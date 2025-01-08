import { User } from '../../database/db';

export interface AdvancedConditions {
  timeRestriction?: {
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };
  locationRestriction?: {
    allowedCountries: string[];
    allowedIPs: string[];
  };
  approvalRequired?: {
    roles: string[];
    minApprovers: number;
  };
  rateLimit?: {
    maxRequests: number;
    timeWindow: number; // in minutes
  };
  dataScope?: {
    departments: string[];
    locations: string[];
    teams: string[];
  };
  auditRequirement?: {
    logLevel: 'basic' | 'detailed';
    retentionDays: number;
  };
  monetaryLimits?: {
    singleTransaction: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
  mfaRequired?: boolean;
  ipWhitelist?: string[];
  customFields?: Record<string, any>;
}

export class AdvancedPermissionChecker {
  private static instance: AdvancedPermissionChecker;
  private requestCounts: Map<string, { count: number; timestamp: number }> = new Map();

  private constructor() {}

  public static getInstance(): AdvancedPermissionChecker {
    if (!AdvancedPermissionChecker.instance) {
      AdvancedPermissionChecker.instance = new AdvancedPermissionChecker();
    }
    return AdvancedPermissionChecker.instance;
  }

  public async checkAdvancedConditions(
    user: User,
    conditions: AdvancedConditions,
    context: {
      currentTime?: Date;
      userIP?: string;
      userCountry?: string;
      transactionAmount?: number;
      mfaVerified?: boolean;
    } = {}
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Time restriction check
    if (conditions.timeRestriction) {
      const result = this.checkTimeRestriction(conditions.timeRestriction, context.currentTime);
      if (!result.allowed) return result;
    }

    // Location restriction check
    if (conditions.locationRestriction) {
      const result = this.checkLocationRestriction(
        conditions.locationRestriction,
        context.userCountry,
        context.userIP
      );
      if (!result.allowed) return result;
    }

    // Rate limit check
    if (conditions.rateLimit) {
      const result = this.checkRateLimit(user.id.toString(), conditions.rateLimit);
      if (!result.allowed) return result;
    }

    // Data scope check
    if (conditions.dataScope) {
      const result = this.checkDataScope(user, conditions.dataScope);
      if (!result.allowed) return result;
    }

    // Monetary limits check
    if (conditions.monetaryLimits && context.transactionAmount) {
      const result = await this.checkMonetaryLimits(
        user.id.toString(),
        conditions.monetaryLimits,
        context.transactionAmount
      );
      if (!result.allowed) return result;
    }

    // MFA check
    if (conditions.mfaRequired && !context.mfaVerified) {
      return {
        allowed: false,
        reason: 'Multi-factor authentication required',
      };
    }

    // IP whitelist check
    if (conditions.ipWhitelist && context.userIP) {
      if (!conditions.ipWhitelist.includes(context.userIP)) {
        return {
          allowed: false,
          reason: 'IP address not in whitelist',
        };
      }
    }

    return { allowed: true };
  }

  private checkTimeRestriction(
    restriction: AdvancedConditions['timeRestriction'],
    currentTime: Date = new Date()
  ): { allowed: boolean; reason?: string } {
    if (!restriction) return { allowed: true };

    const userTime = new Date(currentTime.toLocaleString('en-US', {
      timeZone: restriction.timezone,
    }));
    
    const [startHour, startMinute] = restriction.startTime.split(':').map(Number);
    const [endHour, endMinute] = restriction.endTime.split(':').map(Number);
    
    const currentMinutes = userTime.getHours() * 60 + userTime.getMinutes();
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      return {
        allowed: false,
        reason: 'Access not allowed during this time',
      };
    }

    return { allowed: true };
  }

  private checkLocationRestriction(
    restriction: AdvancedConditions['locationRestriction'],
    userCountry?: string,
    userIP?: string
  ): { allowed: boolean; reason?: string } {
    if (!restriction) return { allowed: true };

    if (userCountry && !restriction.allowedCountries.includes(userCountry)) {
      return {
        allowed: false,
        reason: 'Access not allowed from your country',
      };
    }

    if (userIP && !restriction.allowedIPs.includes(userIP)) {
      return {
        allowed: false,
        reason: 'Access not allowed from your IP address',
      };
    }

    return { allowed: true };
  }

  private checkRateLimit(
    userId: string,
    limit: AdvancedConditions['rateLimit']
  ): { allowed: boolean; reason?: string } {
    if (!limit) return { allowed: true };

    const now = Date.now();
    const userRequests = this.requestCounts.get(userId);

    if (!userRequests) {
      this.requestCounts.set(userId, { count: 1, timestamp: now });
      return { allowed: true };
    }

    const timeWindowMs = limit.timeWindow * 60 * 1000;
    if (now - userRequests.timestamp > timeWindowMs) {
      this.requestCounts.set(userId, { count: 1, timestamp: now });
      return { allowed: true };
    }

    if (userRequests.count >= limit.maxRequests) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
      };
    }

    userRequests.count++;
    return { allowed: true };
  }

  private checkDataScope(
    user: User,
    scope: AdvancedConditions['dataScope']
  ): { allowed: boolean; reason?: string } {
    if (!scope) return { allowed: true };

    if (
      scope.departments &&
      !scope.departments.includes(user.department)
    ) {
      return {
        allowed: false,
        reason: 'Department access restricted',
      };
    }

    if (
      scope.locations &&
      !scope.locations.includes(user.location)
    ) {
      return {
        allowed: false,
        reason: 'Location access restricted',
      };
    }

    if (
      scope.teams &&
      !scope.teams.includes(user.team)
    ) {
      return {
        allowed: false,
        reason: 'Team access restricted',
      };
    }

    return { allowed: true };
  }

  private async checkMonetaryLimits(
    userId: string,
    limits: AdvancedConditions['monetaryLimits'],
    amount: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!limits) return { allowed: true };

    if (amount > limits.singleTransaction) {
      return {
        allowed: false,
        reason: 'Transaction amount exceeds single transaction limit',
      };
    }

    // Daily limit check
    const dailyTotal = await this.getDailyTransactionTotal(userId);
    if (dailyTotal + amount > limits.dailyLimit) {
      return {
        allowed: false,
        reason: 'Transaction would exceed daily limit',
      };
    }

    // Monthly limit check
    const monthlyTotal = await this.getMonthlyTransactionTotal(userId);
    if (monthlyTotal + amount > limits.monthlyLimit) {
      return {
        allowed: false,
        reason: 'Transaction would exceed monthly limit',
      };
    }

    return { allowed: true };
  }

  private async getDailyTransactionTotal(userId: string): Promise<number> {
    // Implementation would fetch from database
    return 0;
  }

  private async getMonthlyTransactionTotal(userId: string): Promise<number> {
    // Implementation would fetch from database
    return 0;
  }
}
