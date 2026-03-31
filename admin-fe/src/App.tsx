import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { PermissionRoute } from '@/router/PermissionRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { Loader2 } from 'lucide-react';

export function App() {
  const { initSession } = useAdminAuth();
  const { isLoading } = useAdminAuthStore();

  useEffect(() => {
    initSession();
  }, [initSession]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <PermissionRoute
                allowedRoles={[
                  'super_admin',
                  'moderator',
                  'finance_admin',
                  'support_admin',
                  'compliance_officer',
                ]}
              >
                <DashboardPage />
              </PermissionRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
