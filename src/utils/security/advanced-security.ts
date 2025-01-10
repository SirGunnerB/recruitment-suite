import { AES, enc } from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';

interface SecurityConfig {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // in days
    preventReuse: number; // number of previous passwords to check
  };
  sessionPolicy: {
    maxDuration: number; // in minutes
    extendOnActivity: boolean;
    maxConcurrentSessions: number;
    requireMfa: boolean;
  };
  lockoutPolicy: {
    maxAttempts: number;
    lockoutDuration: number; // in minutes
    resetAfter: number; // in minutes
  };
  auditPolicy: {
    logLevel: 'basic' | 'detailed';
    retentionDays: number;
    sensitiveFields: string[];
  };
}

interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  details: any;
  ip: string;
  userAgent: string;
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'login_attempt' | 'password_change' | 'mfa_attempt' | 'lockout' | 'security_alert';
  userId: string;
  success: boolean;
  details: any;
  ip: string;
}

export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig = {
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90,
      preventReuse: 5,
    },
    sessionPolicy: {
      maxDuration: 120,
      extendOnActivity: true,
      maxConcurrentSessions: 2,
      requireMfa: true,
    },
    lockoutPolicy: {
      maxAttempts: 5,
      lockoutDuration: 30,
      resetAfter: 60,
    },
    auditPolicy: {
      logLevel: 'detailed',
      retentionDays: 90,
      sensitiveFields: ['password', 'ssn', 'bankAccount'],
    },
  };

  private constructor() {
    this.initializeSecurityDatabase();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Password Security
  public async validatePassword(password: string, userId: string): Promise<{ valid: boolean; reason?: string }> {
    // Check password complexity
    if (password.length < this.config.passwordPolicy.minLength) {
      return { valid: false, reason: 'Password too short' };
    }

    if (this.config.passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      return { valid: false, reason: 'Password must contain uppercase letters' };
    }

    if (this.config.passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      return { valid: false, reason: 'Password must contain lowercase letters' };
    }

    if (this.config.passwordPolicy.requireNumbers && !/\d/.test(password)) {
      return { valid: false, reason: 'Password must contain numbers' };
    }

    if (this.config.passwordPolicy.requireSpecialChars && !/[^A-Za-z0-9]/.test(password)) {
      return { valid: false, reason: 'Password must contain special characters' };
    }

    // Check password history
    const previousPasswords = await this.getPreviousPasswords(userId);
    for (const prevPassword of previousPasswords) {
      if (await this.comparePasswords(password, prevPassword)) {
        return { valid: false, reason: 'Password was used recently' };
      }
    }

    return { valid: true };
  }

  // Session Management
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await db.sessions.get(sessionId);
      if (!session) return false;

      const now = new Date();
      const sessionAge = now.getTime() - session.lastActive.getTime();
      const maxAge = this.config.sessionPolicy.maxDuration * 60 * 1000;

      if (sessionAge > maxAge) {
        await db.sessions.delete(sessionId);
        return false;
      }

      if (this.config.sessionPolicy.extendOnActivity) {
        await db.sessions.update(sessionId, { lastActive: now });
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  // Multi-factor Authentication
  public async setupMfa(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = this.generateMfaSecret();
    const qrCode = await this.generateQrCode(secret);
    
    await db.users.update(userId, {
      mfaSecret: this.encryptSecret(secret),
      mfaEnabled: true,
    });

    return { secret, qrCode };
  }

  public async verifyMfa(userId: string, token: string): Promise<boolean> {
    const user = await db.users.get(userId);
    if (!user || !user.mfaSecret) return false;

    const secret = this.decryptSecret(user.mfaSecret);
    return this.validateMfaToken(token, secret);
  }

  // Audit Logging
  async logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditLog: AuditLog = {
        id: uuidv4(),
        timestamp: new Date(),
        ...log,
        details: this.sanitizeSensitiveData(log.details)
      };

      await db.auditLogs.add(auditLog);
      await this.cleanupOldAuditLogs();
    } catch (error) {
      console.error('Failed to log audit:', error);
      throw new Error('Audit logging failed');
    }
  }

  // Security Event Monitoring
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        ...event
      };

      await db.securityEvents.add(securityEvent);
      await this.handleSecurityEvent(securityEvent);
    } catch (error) {
      console.error('Failed to log security event:', error);
      throw new Error('Security event logging failed');
    }
  }

  // Account Lockout
  public async checkLockout(userId: string): Promise<{ locked: boolean; remainingTime?: number }> {
    const recentFailures = await db.securityEvents
      .where({ userId, type: 'login_attempt', success: false })
      .filter(event => 
        event.timestamp.getTime() > Date.now() - this.config.lockoutPolicy.resetAfter * 60 * 1000
      )
      .count();

    if (recentFailures >= this.config.lockoutPolicy.maxAttempts) {
      const lastFailure = await db.securityEvents
        .where({ userId, type: 'login_attempt', success: false })
        .reverse()
        .first();

      if (lastFailure) {
        const lockoutEnd = new Date(lastFailure.timestamp.getTime() + 
          this.config.lockoutPolicy.lockoutDuration * 60 * 1000);
        
        if (lockoutEnd > new Date()) {
          return {
            locked: true,
            remainingTime: Math.ceil((lockoutEnd.getTime() - Date.now()) / 1000 / 60),
          };
        }
      }
    }

    return { locked: false };
  }

  // Private helper methods
  private async initializeSecurityDatabase(): Promise<void> {
    try {
      await db.transaction('rw', [
        db.sessions,
        db.auditLogs,
        db.securityEvents
      ], async () => {
        // Initialize tables if they don't exist
        await db.sessions.count();
        await db.auditLogs.count();
        await db.securityEvents.count();
      });
    } catch (error) {
      console.error('Failed to initialize security database:', error);
      throw new Error('Security database initialization failed');
    }
  }

  private async getPreviousPasswords(userId: string): Promise<string[]> {
    const user = await db.users.get(userId);
    return user?.passwordHistory || [];
  }

  private async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    // Implement password comparison logic
    return false; // Placeholder
  }

  private generateMfaSecret(): string {
    // Implement MFA secret generation
    return 'secret'; // Placeholder
  }

  private async generateQrCode(secret: string): Promise<string> {
    // Implement QR code generation
    return 'qrcode'; // Placeholder
  }

  private encryptSecret(secret: string): string {
    const key = process.env.ENCRYPTION_KEY || 'default-key';
    return AES.encrypt(secret, key).toString();
  }

  private decryptSecret(encrypted: string): string {
    const key = process.env.ENCRYPTION_KEY || 'default-key';
    return AES.decrypt(encrypted, key).toString(enc.Utf8);
  }

  private validateMfaToken(token: string, secret: string): boolean {
    // Implement MFA token validation
    return false; // Placeholder
  }

  private sanitizeSensitiveData(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };
    this.config.auditPolicy.sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  private async cleanupOldAuditLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.auditPolicy.retentionDays);

    await db.auditLogs
      .where('timestamp')
      .below(cutoffDate)
      .delete();
  }

  private async handleSecurityEvent(event: SecurityEvent): Promise<void> {
    switch (event.type) {
      case 'login_attempt':
        if (!event.success) {
          await this.handleFailedLogin(event);
        }
        break;
      case 'security_alert':
        await this.handleSecurityAlert(event);
        break;
    }
  }

  private async handleFailedLogin(event: SecurityEvent): Promise<void> {
    const lockoutStatus = await this.checkLockout(event.userId);
    if (lockoutStatus.locked) {
      await this.logAudit({
        userId: event.userId,
        action: 'account_locked',
        resource: 'auth',
        details: {
          reason: 'Multiple failed login attempts',
          duration: lockoutStatus.remainingTime,
        },
        ip: event.ip,
        userAgent: 'system',
      });
    }
  }

  private async handleSecurityAlert(event: SecurityEvent): Promise<void> {
    // Implement security alert handling
    console.log('Security alert:', event);
  }
}
