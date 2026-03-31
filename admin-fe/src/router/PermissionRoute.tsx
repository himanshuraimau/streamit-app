import { Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import type { AdminRole } from '@/types/admin.types';
import { Loader2 } from 'lucide-react';

interface PermissionRouteProps {
  children: React.ReactNode;
  allowedRoles: AdminRole[];
}

export function PermissionRoute({ children, allowedRoles }: PermissionRouteProps) {
  const { user, isLoading } = useAdminAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
