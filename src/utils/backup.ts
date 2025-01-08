import { db } from '../database/db';
import { validateData } from './validation';
import { userSchema, candidateSchema, jobSchema, clientSchema, invoiceSchema } from './validation';

interface BackupData {
  timestamp: string;
  version: string;
  data: {
    users: any[];
    candidates: any[];
    jobs: any[];
    clients: any[];
    invoices: any[];
  };
}

export class BackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupError';
  }
}

export const createBackup = async (): Promise<BackupData> => {
  try {
    const [users, candidates, jobs, clients, invoices] = await Promise.all([
      db.users.toArray(),
      db.candidates.toArray(),
      db.jobs.toArray(),
      db.clients.toArray(),
      db.invoices.toArray(),
    ]);

    const backup: BackupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        users,
        candidates,
        jobs,
        clients,
        invoices,
      },
    };

    // Save backup to IndexedDB
    await db.backups.add({
      timestamp: backup.timestamp,
      data: backup,
    });

    // Download backup file
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recruitment_backup_${backup.timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return backup;
  } catch (error) {
    throw new BackupError(`Failed to create backup: ${error.message}`);
  }
};

export const restoreBackup = async (backupFile: File): Promise<void> => {
  try {
    const backupContent = await backupFile.text();
    const backup: BackupData = JSON.parse(backupContent);

    // Validate backup structure
    if (!backup.timestamp || !backup.version || !backup.data) {
      throw new BackupError('Invalid backup file structure');
    }

    // Validate data
    const validationPromises = [
      ...backup.data.users.map(user => validateData(userSchema, user)),
      ...backup.data.candidates.map(candidate => validateData(candidateSchema, candidate)),
      ...backup.data.jobs.map(job => validateData(jobSchema, job)),
      ...backup.data.clients.map(client => validateData(clientSchema, client)),
      ...backup.data.invoices.map(invoice => validateData(invoiceSchema, invoice)),
    ];

    const validationResults = await Promise.all(validationPromises);
    const validationErrors = validationResults
      .filter(result => !result.success)
      .map(result => (result as { success: false; errors: string[] }).errors)
      .flat();

    if (validationErrors.length > 0) {
      throw new BackupError(`Validation errors in backup data: ${validationErrors.join(', ')}`);
    }

    // Clear existing data
    await db.transaction('rw', 
      db.users, db.candidates, db.jobs, db.clients, db.invoices,
      async () => {
        await Promise.all([
          db.users.clear(),
          db.candidates.clear(),
          db.jobs.clear(),
          db.clients.clear(),
          db.invoices.clear(),
        ]);

        // Restore data
        await Promise.all([
          db.users.bulkAdd(backup.data.users),
          db.candidates.bulkAdd(backup.data.candidates),
          db.jobs.bulkAdd(backup.data.jobs),
          db.clients.bulkAdd(backup.data.clients),
          db.invoices.bulkAdd(backup.data.invoices),
        ]);
    });
  } catch (error) {
    throw new BackupError(`Failed to restore backup: ${error.message}`);
  }
};

export const getBackupHistory = async () => {
  return await db.backups
    .orderBy('timestamp')
    .reverse()
    .toArray();
};

export const deleteBackup = async (timestamp: string) => {
  await db.backups
    .where('timestamp')
    .equals(timestamp)
    .delete();
};
