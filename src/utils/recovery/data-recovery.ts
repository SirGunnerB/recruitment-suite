import { RecruitmentDatabase, RecoveryPoint, RecoveryData } from '../../database/schema';
import { validateData } from '../validation/advanced-validation';
import { SecurityManager } from '../security/advanced-security';
import { createHash } from 'crypto';
import { AES, enc } from 'crypto-js';

interface RecoveryOptions {
  tables?: string[];
  validateData?: boolean;
  preserveAuditTrail?: boolean;
  notifyUsers?: boolean;
}

interface ValidationResult {
  table: string;
  valid: boolean;
  errors: string[];
}

type RecoveryResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

export class DataRecoveryManager {
  private db: RecruitmentDatabase;
  private securityManager: SecurityManager;
  private encryptionKey: string;

  constructor(db: RecruitmentDatabase) {
    this.db = db;
    this.securityManager = SecurityManager.getInstance();
    this.encryptionKey = process.env.RECOVERY_ENCRYPTION_KEY || 'default-key';
  }

  private calculateChecksum(data: unknown): string {
    return createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  private encryptData(data: unknown): string {
    return AES.encrypt(JSON.stringify(data), this.encryptionKey).toString();
  }

  private decryptData(encryptedData: string): unknown {
    const bytes = AES.decrypt(encryptedData, this.encryptionKey);
    return JSON.parse(bytes.toString(enc.Utf8));
  }

  private async validateTableData(table: string, records: unknown[]): Promise<ValidationResult> {
    try {
      for (const record of records) {
        const result = await validateData(table as any, record);
        if (!result.success) {
          return {
            table,
            valid: false,
            errors: result.errors
          };
        }
      }
      return {
        table,
        valid: true,
        errors: []
      };
    } catch (error) {
      return {
        table,
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    }
  }

  async createRecoveryPoint(
    description: string
  ): Promise<RecoveryResult<RecoveryPoint>> {
    try {
      // Get all table data
      const tables = this.db.tables.map(table => table.name);
      const data: Record<string, unknown[]> = {};
      
      for (const table of tables) {
        data[table] = await this.db.table(table).toArray();
      }

      // Calculate metadata
      const recordCounts: Record<string, number> = {};
      for (const [table, records] of Object.entries(data)) {
        recordCounts[table] = records.length;
      }

      // Create recovery point
      const point: Omit<RecoveryPoint, 'id'> = {
        timestamp: new Date(),
        type: 'full',
        description,
        status: 'pending',
        size: Buffer.byteLength(JSON.stringify(data)),
        checksum: this.calculateChecksum(data),
        metadata: {
          version: '1.0',
          tables,
          recordCounts
        }
      };

      // Save recovery point and data
      const id = await this.db.recoveryPoints.add(point);
      
      const recoveryData: Omit<RecoveryData, 'id'> = {
        recoveryPointId: id,
        data: this.encryptData(data),
        timestamp: new Date()
      };
      
      await this.db.recoveryData.add(recoveryData);
      
      // Update status to completed
      await this.db.recoveryPoints.update(id, { status: 'completed' });

      return {
        success: true,
        data: { ...point, id, status: 'completed' }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during recovery point creation'
      };
    }
  }

  async restoreFromPoint(
    recoveryPointId: number,
    options: RecoveryOptions = {}
  ): Promise<RecoveryResult<{ restoredCollections: string[]; timestamp: Date }>> {
    try {
      const point = await this.db.recoveryPoints.get(recoveryPointId);
      if (!point) {
        return { success: false, error: 'Recovery point not found' };
      }

      const recoveryData = await this.db.recoveryData.get({ recoveryPointId });
      if (!recoveryData) {
        return { success: false, error: 'Recovery data not found' };
      }

      // Decrypt and validate data
      const data = this.decryptData(recoveryData.data) as Record<string, unknown[]>;
      
      // Verify checksum
      if (this.calculateChecksum(data) !== point.checksum) {
        return { success: false, error: 'Data integrity check failed' };
      }

      // Validate data if requested
      if (options.validateData) {
        for (const [table, records] of Object.entries(data)) {
          const validation = await this.validateTableData(table, records);
          if (!validation.valid) {
            return { 
              success: false, 
              error: `Validation failed for table ${table}: ${validation.errors.join(', ')}` 
            };
          }
        }
      }

      // Perform restore
      const tablesToRestore = options.tables || Object.keys(data);
      
      await this.db.transaction('rw', tablesToRestore.map(t => this.db.table(t)), async () => {
        for (const table of tablesToRestore) {
          if (!options.preserveAuditTrail || table !== 'auditLogs') {
            await this.db.table(table).clear();
            await this.db.table(table).bulkAdd(data[table]);
          }
        }
      });

      return {
        success: true,
        data: {
          restoredCollections: tablesToRestore,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during restore'
      };
    }
  }

  async listRecoveryPoints(): Promise<RecoveryResult<RecoveryPoint[]>> {
    try {
      const points = await this.db.recoveryPoints
        .orderBy('timestamp')
        .reverse()
        .toArray();
      
      return { success: true, data: points };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error while listing recovery points'
      };
    }
  }

  async deleteRecoveryPoint(id: number): Promise<RecoveryResult<void>> {
    try {
      await this.db.transaction('rw', [this.db.recoveryPoints, this.db.recoveryData], async () => {
        await this.db.recoveryPoints.delete(id);
        await this.db.recoveryData.delete(id);
      });
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error while deleting recovery point'
      };
    }
  }
}
