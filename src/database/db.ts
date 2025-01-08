import Dexie, { Table } from 'dexie';

export interface User {
  id?: number;
  username: string;
  password: string;
  role: 'CEO' | 'CFO' | 'Superadmin' | 'Admin' | 'User' | 'Reception';
  email: string;
}

export interface Candidate {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  resumeUrl: string;
  status: 'applied' | 'interviewed' | 'hired' | 'rejected';
  createdAt: Date;
}

export interface Job {
  id?: number;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  salary: string;
  status: 'active' | 'filled' | 'closed';
  createdAt: Date;
}

export interface Client {
  id?: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Invoice {
  id?: number;
  clientId: number;
  candidateId: number;
  amount: number;
  status: 'draft' | 'sent' | 'paid';
  dueDate: Date;
  createdAt: Date;
}

class RecruitmentDB extends Dexie {
  users!: Table<User>;
  candidates!: Table<Candidate>;
  jobs!: Table<Job>;
  clients!: Table<Client>;
  invoices!: Table<Invoice>;

  constructor() {
    super('RecruitmentDB');
    this.version(1).stores({
      users: '++id, username, role, email',
      candidates: '++id, firstName, lastName, email, status, createdAt',
      jobs: '++id, title, status, createdAt',
      clients: '++id, companyName, status, createdAt',
      invoices: '++id, clientId, candidateId, status, dueDate, createdAt'
    });
  }
}

export const db = new RecruitmentDB();
