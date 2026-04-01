import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { PermissionRoute } from '@/router/PermissionRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Loader2 } from 'lucide-react';

// Lazy load all page components for code splitting
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'));
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));
const UserDetailPage = lazy(() => import('@/pages/users/UserDetailPage'));
const ApplicationsPage = lazy(() => import('@/pages/streamers/ApplicationsPage'));
const LiveMonitorPage = lazy(() => import('@/pages/streamers/LiveMonitorPage'));
const ModerationQueuePage = lazy(() => import('@/pages/moderation/ModerationQueuePage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const ReportDetailPage = lazy(() => import('@/pages/reports/ReportDetailPage'));
const LedgerPage = lazy(() => import('@/pages/monetization/LedgerPage'));
const WithdrawalsPage = lazy(() => import('@/pages/monetization/WithdrawalsPage'));
const GiftsPage = lazy(() => import('@/pages/monetization/GiftsPage'));
const AdsPage = lazy(() => import('@/pages/ads/AdsPage'));
const AdEditorPage = lazy(() => import('@/pages/ads/AdEditorPage'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const CompliancePage = lazy(() => import('@/pages/compliance/CompliancePage'));
const AuditLogPage = lazy(() => import('@/pages/compliance/AuditLogPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const AdminRolesPage = lazy(() => import('@/pages/settings/AdminRolesPage'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex min-h-[400px] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function App() {
  const { initSession } = useAdminAuth();
  const { isLoading, isAuthenticated, sessionInitialized } = useAdminAuthStore();

  useEffect(() => {
    // Only check session once, and only if not already initialized
    if (!sessionInitialized) {
      initSession();
    } else if (!isAuthenticated) {
      // If session was initialized but user is not authenticated, set loading to false
      useAdminAuthStore.setState({ isLoading: false });
    } else {
      // Already authenticated from storage
      useAdminAuthStore.setState({ isLoading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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
            
            {/* Dashboard */}
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

            {/* Users */}
            <Route
              path="users"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'support_admin', 'compliance_officer']}>
                  <UsersPage />
                </PermissionRoute>
              }
            />
            <Route
              path="users/:id"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'support_admin', 'compliance_officer']}>
                  <UserDetailPage />
                </PermissionRoute>
              }
            />

            {/* Streamers */}
            <Route
              path="streamers/applications"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator', 'support_admin']}>
                  <ApplicationsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="streamers/live"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator', 'support_admin']}>
                  <LiveMonitorPage />
                </PermissionRoute>
              }
            />

            {/* Moderation */}
            <Route
              path="moderation"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator']}>
                  <ModerationQueuePage />
                </PermissionRoute>
              }
            />
            <Route
              path="moderation/shorts"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator']}>
                  <ModerationQueuePage />
                </PermissionRoute>
              }
            />
            <Route
              path="moderation/posts"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator']}>
                  <ModerationQueuePage />
                </PermissionRoute>
              }
            />

            {/* Reports */}
            <Route
              path="reports"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator', 'support_admin', 'compliance_officer']}>
                  <ReportsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="reports/:id"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator', 'support_admin', 'compliance_officer']}>
                  <ReportDetailPage />
                </PermissionRoute>
              }
            />

            {/* Monetization */}
            <Route
              path="monetization/ledger"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'finance_admin', 'compliance_officer']}>
                  <LedgerPage />
                </PermissionRoute>
              }
            />
            <Route
              path="monetization/withdrawals"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'finance_admin', 'compliance_officer']}>
                  <WithdrawalsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="monetization/gifts"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'finance_admin', 'compliance_officer']}>
                  <GiftsPage />
                </PermissionRoute>
              }
            />

            {/* Ads */}
            <Route
              path="ads"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'finance_admin']}>
                  <AdsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="ads/new"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'finance_admin']}>
                  <AdEditorPage />
                </PermissionRoute>
              }
            />
            <Route
              path="ads/:id/edit"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'finance_admin']}>
                  <AdEditorPage />
                </PermissionRoute>
              }
            />

            {/* Analytics */}
            <Route
              path="analytics"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator', 'finance_admin', 'compliance_officer']}>
                  <AnalyticsPage />
                </PermissionRoute>
              }
            />

            {/* Compliance */}
            <Route
              path="compliance"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'compliance_officer']}>
                  <CompliancePage />
                </PermissionRoute>
              }
            />
            <Route
              path="compliance/audit"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'compliance_officer']}>
                  <AuditLogPage />
                </PermissionRoute>
              }
            />

            {/* Settings */}
            <Route
              path="settings"
              element={
                <PermissionRoute allowedRoles={['super_admin']}>
                  <SettingsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="settings/roles"
              element={
                <PermissionRoute allowedRoles={['super_admin']}>
                  <AdminRolesPage />
                </PermissionRoute>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
