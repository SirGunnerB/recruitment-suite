import { RolePermissions } from './types';

export const rolePermissions: RolePermissions = {
  CEO: [
    {
      resource: 'candidate',
      actions: ['create', 'read', 'update', 'delete', 'export'],
    },
    {
      resource: 'job',
      actions: ['create', 'read', 'update', 'delete', 'export'],
    },
    {
      resource: 'client',
      actions: ['create', 'read', 'update', 'delete', 'export'],
    },
    {
      resource: 'invoice',
      actions: ['create', 'read', 'update', 'delete', 'export', 'approve'],
    },
    {
      resource: 'user',
      actions: ['create', 'read', 'update', 'delete'],
    },
    {
      resource: 'report',
      actions: ['read', 'export'],
    },
  ],
  CFO: [
    {
      resource: 'client',
      actions: ['read', 'update'],
    },
    {
      resource: 'invoice',
      actions: ['create', 'read', 'update', 'delete', 'export', 'approve'],
    },
    {
      resource: 'report',
      actions: ['read', 'export'],
      conditions: {
        departmentOnly: true,
      },
    },
  ],
  Superadmin: [
    {
      resource: 'candidate',
      actions: ['create', 'read', 'update', 'delete', 'export'],
    },
    {
      resource: 'job',
      actions: ['create', 'read', 'update', 'delete', 'export'],
    },
    {
      resource: 'client',
      actions: ['create', 'read', 'update', 'delete', 'export'],
    },
    {
      resource: 'invoice',
      actions: ['create', 'read', 'update', 'delete', 'export'],
      conditions: {
        amountLimit: 50000,
      },
    },
    {
      resource: 'user',
      actions: ['create', 'read', 'update'],
    },
    {
      resource: 'report',
      actions: ['read', 'export'],
    },
  ],
  Admin: [
    {
      resource: 'candidate',
      actions: ['create', 'read', 'update', 'export'],
    },
    {
      resource: 'job',
      actions: ['create', 'read', 'update', 'export'],
    },
    {
      resource: 'client',
      actions: ['read', 'update'],
    },
    {
      resource: 'invoice',
      actions: ['create', 'read'],
      conditions: {
        amountLimit: 10000,
      },
    },
    {
      resource: 'report',
      actions: ['read'],
      conditions: {
        departmentOnly: true,
      },
    },
  ],
  User: [
    {
      resource: 'candidate',
      actions: ['create', 'read', 'update'],
      conditions: {
        ownerOnly: true,
      },
    },
    {
      resource: 'job',
      actions: ['read'],
    },
    {
      resource: 'client',
      actions: ['read'],
    },
    {
      resource: 'invoice',
      actions: ['read'],
      conditions: {
        ownerOnly: true,
      },
    },
  ],
  Reception: [
    {
      resource: 'candidate',
      actions: ['create', 'read'],
    },
    {
      resource: 'job',
      actions: ['read'],
    },
  ],
};
