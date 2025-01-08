export type ResourceType = 'candidate' | 'job' | 'client' | 'invoice' | 'user' | 'report';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'export' | 'approve';

export interface Permission {
  resource: ResourceType;
  actions: Action[];
  conditions?: {
    ownerOnly?: boolean;
    departmentOnly?: boolean;
    amountLimit?: number;
  };
}

export type RolePermissions = {
  [key: string]: Permission[];
};
