export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  location: string;
  team: string;
  mfaSecret?: string;
  passwordHistory?: string[];
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  status: 'active' | 'inactive' | 'suspended';
  departmentId?: string;
}
