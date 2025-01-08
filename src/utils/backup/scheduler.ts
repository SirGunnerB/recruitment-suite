import { createBackup, BackupError } from '../backup';

interface BackupSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm format
  retentionDays: number;
  excludeWeekends?: boolean;
  maxBackups?: number;
}

interface BackupJob {
  id: string;
  schedule: BackupSchedule;
  lastRun?: Date;
  nextRun?: Date;
  status: 'active' | 'paused' | 'error';
  error?: string;
}

export class BackupScheduler {
  private static instance: BackupScheduler;
  private jobs: Map<string, BackupJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    // Load saved backup jobs from storage
    this.loadJobs();
    // Start all active jobs
    this.jobs.forEach((job) => {
      if (job.status === 'active') {
        this.scheduleBackup(job);
      }
    });
  }

  public static getInstance(): BackupScheduler {
    if (!BackupScheduler.instance) {
      BackupScheduler.instance = new BackupScheduler();
    }
    return BackupScheduler.instance;
  }

  public createJob(schedule: BackupSchedule): string {
    const id = crypto.randomUUID();
    const job: BackupJob = {
      id,
      schedule,
      status: 'active',
    };

    this.jobs.set(id, job);
    this.scheduleBackup(job);
    this.saveJobs();

    return id;
  }

  public updateJob(id: string, schedule: Partial<BackupSchedule>): void {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error('Backup job not found');
    }

    job.schedule = { ...job.schedule, ...schedule };
    this.rescheduleJob(job);
    this.saveJobs();
  }

  public deleteJob(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.jobs.delete(id);
    this.saveJobs();
  }

  public pauseJob(id: string): void {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error('Backup job not found');
    }

    job.status = 'paused';
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.saveJobs();
  }

  public resumeJob(id: string): void {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error('Backup job not found');
    }

    job.status = 'active';
    this.scheduleBackup(job);
    this.saveJobs();
  }

  public getJobs(): BackupJob[] {
    return Array.from(this.jobs.values());
  }

  private async executeBackup(job: BackupJob): Promise<void> {
    try {
      await createBackup();
      job.lastRun = new Date();
      job.error = undefined;
      this.scheduleBackup(job);
    } catch (error) {
      job.status = 'error';
      job.error = error instanceof BackupError ? error.message : 'Unknown error during backup';
    } finally {
      this.saveJobs();
    }
  }

  private scheduleBackup(job: BackupJob): void {
    const timer = this.timers.get(job.id);
    if (timer) {
      clearTimeout(timer);
    }

    const nextRun = this.calculateNextRun(job.schedule);
    job.nextRun = nextRun;

    const delay = nextRun.getTime() - Date.now();
    const newTimer = setTimeout(() => {
      this.executeBackup(job);
    }, delay);

    this.timers.set(job.id, newTimer);
  }

  private rescheduleJob(job: BackupJob): void {
    const timer = this.timers.get(job.id);
    if (timer) {
      clearTimeout(timer);
    }
    if (job.status === 'active') {
      this.scheduleBackup(job);
    }
  }

  private calculateNextRun(schedule: BackupSchedule): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    let next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      next = this.addDay(next);
    }

    switch (schedule.frequency) {
      case 'daily':
        if (schedule.excludeWeekends) {
          while (this.isWeekend(next)) {
            next = this.addDay(next);
          }
        }
        break;
      case 'weekly':
        while (next.getDay() !== 1) { // Monday
          next = this.addDay(next);
        }
        break;
      case 'monthly':
        next.setDate(1);
        next = this.addMonth(next);
        break;
    }

    return next;
  }

  private addDay(date: Date): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return next;
  }

  private addMonth(date: Date): Date {
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  private async loadJobs(): Promise<void> {
    try {
      const savedJobs = localStorage.getItem('backupJobs');
      if (savedJobs) {
        const jobs = JSON.parse(savedJobs);
        jobs.forEach((job: BackupJob) => {
          if (job.lastRun) job.lastRun = new Date(job.lastRun);
          if (job.nextRun) job.nextRun = new Date(job.nextRun);
          this.jobs.set(job.id, job);
        });
      }
    } catch (error) {
      console.error('Error loading backup jobs:', error);
    }
  }

  private saveJobs(): void {
    try {
      const jobs = Array.from(this.jobs.values());
      localStorage.setItem('backupJobs', JSON.stringify(jobs));
    } catch (error) {
      console.error('Error saving backup jobs:', error);
    }
  }
}
