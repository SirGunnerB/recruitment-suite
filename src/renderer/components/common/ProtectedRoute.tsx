import React from 'react';
import { Navigate } from 'react-router-dom';
import { Permission, usePermissions } from '../../../utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { hasPermission } = usePermissions();
  const isAuthenticated = sessionStorage.getItem('user') !== null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
