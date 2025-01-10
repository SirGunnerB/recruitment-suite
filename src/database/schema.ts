import Dexie, { Table } from 'dexie';
import { CandidateStatus } from '../types';

export type RecoveryPointType = 'full' | 'incremental';
export type RecoveryPointStatus = 'pending' | 'completed' | 'failed';

export interface Candidate {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  experience: number;
  status: CandidateStatus;
  predictedSuccess?: number;
  gender: string;
  ethnicity: string;
  veteranStatus: string;
  source: string;
  sourcingCost: number;
  department: string;
  hireDate?: Date;
  appliedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id?: number;
  title: string;
  department: string;
  location: string;
  description: string;
  requirements: string[];
  status: 'open' | 'filled' | 'cancelled';
  salary: { min: number; max: number; currency: string };
  postedDate: Date;
  filledDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id?: number;
  name: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  engagementScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  performanceScore?: number;
  salary: number;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayrollRecord {
  id?: number;
  employeeId: number;
  period: { start: Date; end: Date };
  basePay: number;
  deductions: { type: string; amount: number }[];
  bonus?: number;
  totalPay: number;
  status: 'pending' | 'processed' | 'paid';
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  id?: number;
  type: 'candidate' | 'employee' | 'client' | 'job';
  metrics: Record<string, number>;
  predictions: Record<string, number>;
  timestamp: Date;
}

export interface AuditLog {
  id?: number;
  userId: number;
  action: string;
  entity: string;
  entityId: number;
  changes: Record<string, any>;
  timestamp: Date;
}

export interface Session {
  id?: number;
  userId: number;
  token: string;
  lastActive: Date;
  expiresAt: Date;
  deviceInfo: Record<string, string>;
}

export interface SecurityEvent {
  id?: number;
  type: 'login' | 'logout' | 'failed_login' | 'password_reset' | 'permission_change';
  userId: number;
  ipAddress: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface RecoveryPoint {
  id?: number;
  timestamp?: Date;
  type: RecoveryPointType;
  description?: string;
  size?: number;
  checksum?: string;
  status?: RecoveryPointStatus;
  metadata?: {
    version?: string;
    tables?: string[];
    recordCounts?: Record<string, number>;
  };
}

export interface RecoveryData {
  id?: number;
  recoveryPointId: number;
  data: string;
  timestamp: Date;
}

export class RecruitmentDatabase extends Dexie {
  candidates!: Table<Candidate>;
  jobs!: Table<Job>;
  clients!: Table<Client>;
  employees!: Table<Employee>;
  payroll!: Table<PayrollRecord>;
  analytics!: Table<Analytics>;
  auditLogs!: Table<AuditLog>;
  sessions!: Table<Session>;
  securityEvents!: Table<SecurityEvent>;
  recoveryPoints!: Dexie.Table<RecoveryPoint, number>;
  recoveryData!: Dexie.Table<RecoveryData, number>;
  roles!: Table<any>;
  backups!: Table<any>;

  constructor() {
    super('RecruitmentDB');

    this.version(1).stores({
      candidates: '++id, email, status, createdAt, department, hireDate, appliedDate',
      jobs: '++id, title, status, department, postedDate, filledDate',
      clients: '++id, name, industry, createdAt',
      employees: '++id, email, department, role',
      payroll: '++id, employeeId, [period.start+period.end], status',
      analytics: '++id, type, timestamp',
      auditLogs: '++id, userId, action, entity, timestamp',
      sessions: '++id, userId, token, expiresAt',
      securityEvents: '++id, type, userId, timestamp',
      recoveryPoints: '++id, timestamp, type, status',
      recoveryData: '++id, recoveryPointId, timestamp',
      recoveryData: '++id',
      roles: '++id',
      backups: '++id'
    });

    this.recoveryPoints = this.table('recoveryPoints');
    this.recoveryData = this.table('recoveryData');
  }

  async initialize() {
    try {
      await this.open();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async backup() {
    const timestamp = new Date();
    const recoveryPoint: RecoveryPoint = {
      timestamp,
      type: 'full',
      status: 'pending',
      size: 0,
      path: `backup_${timestamp.toISOString()}`
    };

    try {
      // Implement backup logic here
      recoveryPoint.status = 'completed';
      await this.recoveryPoints.add(recoveryPoint);
    } catch (error) {
      recoveryPoint.status = 'failed';
      await this.recoveryPoints.add(recoveryPoint);
      throw error;
    }
  }

  async createRecoveryPoint(): Promise<RecoveryPoint> {
    const point: RecoveryPoint = {
      timestamp: new Date(),
      type: 'full',
      status: 'pending'
    };
    
    const id = await this.recoveryPoints.add(point);
    return { ...point, id };
  }

  async listRecoveryPoints(): Promise<RecoveryPoint[]> {
    return this.recoveryPoints.toArray();
  }
}

export const db = new RecruitmentDatabase();
