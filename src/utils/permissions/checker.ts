import { User } from '../../database/db';
import { rolePermissions } from './config';
import { ResourceType, Action, Permission } from './types';

interface CheckPermissionOptions {
  user: User;
  resource: ResourceType;
  action: Action;
  context?: {
    ownerId?: number;
    departmentId?: string;
    amount?: number;
  };
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export const checkPermission = ({
  user,
  resource,
  action,
  context = {},
}: CheckPermissionOptions): boolean => {
  const userPermissions = rolePermissions[user.role];
  if (!userPermissions) return false;

  const resourcePermission = userPermissions.find(p => p.resource === resource);
  if (!resourcePermission) return false;

  if (!resourcePermission.actions.includes(action)) return false;

  // Check conditions if they exist
  if (resourcePermission.conditions) {
    const { ownerOnly, departmentOnly, amountLimit } = resourcePermission.conditions;

    if (ownerOnly && context.ownerId !== user.id) {
      return false;
    }

    if (departmentOnly && context.departmentId !== user.departmentId) {
      return false;
    }

    if (amountLimit && context.amount && context.amount > amountLimit) {
      return false;
    }
  }

  return true;
};

export const usePermissions = () => {
  const userJson = sessionStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) as User : null;

  return {
    can: (resource: ResourceType, action: Action, context = {}) => {
      if (!user) return false;
      return checkPermission({ user, resource, action, context });
    },
    canAny: (permissions: Array<{ resource: ResourceType; action: Action }>) => {
      if (!user) return false;
      return permissions.some(({ resource, action }) =>
        checkPermission({ user, resource, action })
      );
    },
    canAll: (permissions: Array<{ resource: ResourceType; action: Action }>) => {
      if (!user) return false;
      return permissions.every(({ resource, action }) =>
        checkPermission({ user, resource, action })
      );
    },
    getResourcePermissions: (resource: ResourceType) => {
      if (!user) return [];
      const userPermissions = rolePermissions[user.role];
      return userPermissions
        ?.find(p => p.resource === resource)
        ?.actions || [];
    },
    isAuthenticated: !!user,
    user,
  };
};
