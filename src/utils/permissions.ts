import { User } from '../database/db';

export type Permission =
  | 'view_dashboard'
  | 'manage_candidates'
  | 'manage_jobs'
  | 'manage_clients'
  | 'manage_invoices'
  | 'manage_users'
  | 'view_reports'
  | 'edit_settings';

type RolePermissions = {
  [key in User['role']]: Permission[];
};

export const rolePermissions: RolePermissions = {
  CEO: [
    'view_dashboard',
    'manage_candidates',
    'manage_jobs',
    'manage_clients',
    'manage_invoices',
    'manage_users',
    'view_reports',
    'edit_settings',
  ],
  CFO: [
    'view_dashboard',
    'manage_clients',
    'manage_invoices',
    'view_reports',
    'edit_settings',
  ],
  Superadmin: [
    'view_dashboard',
    'manage_candidates',
    'manage_jobs',
    'manage_clients',
    'manage_invoices',
    'manage_users',
    'view_reports',
    'edit_settings',
  ],
  Admin: [
    'view_dashboard',
    'manage_candidates',
    'manage_jobs',
    'manage_clients',
    'manage_invoices',
    'view_reports',
  ],
  User: [
    'view_dashboard',
    'manage_candidates',
    'manage_jobs',
  ],
  Reception: [
    'view_dashboard',
    'manage_candidates',
  ],
};

export const checkPermission = (userRole: User['role'], permission: Permission): boolean => {
  return rolePermissions[userRole]?.includes(permission) || false;
};

export const usePermissions = () => {
  const userJson = sessionStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) as User : null;

  return {
    hasPermission: (permission: Permission) => {
      if (!user) return false;
      return checkPermission(user.role, permission);
    },
    userRole: user?.role,
  };
};
