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
const MonetizationOverviewPage = lazy(() => import('@/pages/monetization/MonetizationOverviewPage'));
const LedgerPage = lazy(() => import('@/pages/monetization/LedgerPage'));
const WithdrawalsPage = lazy(() => import('@/pages/monetization/WithdrawalsPage'));
const GiftsPage = lazy(() => import('@/pages/monetization/GiftsPage'));
const DiscountCodesPage = lazy(() => import('@/pages/monetization/DiscountCodesPage'));
const DiscountCodeEditorPage = lazy(() => import('@/pages/monetization/DiscountCodeEditorPage'));
const AdsPage = lazy(() => import('@/pages/ads/AdsPage'));
const AdEditorPage = lazy(() => import('@/pages/ads/AdEditorPage'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
const TopShortsPage = lazy(() => import('@/pages/analytics/TopShortsPage'));
const TopPostsPage = lazy(() => import('@/pages/analytics/TopPostsPage'));
const TopStreamsPage = lazy(() => import('@/pages/analytics/TopStreamsPage'));
const TopStreamersPage = lazy(() => import('@/pages/analytics/TopStreamersPage'));
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
  const { sessionInitialized } = useAdminAuthStore();

  useEffect(() => {
    if (!sessionInitialized) {
      void initSession();
    } else {
      // Ensure persisted sessions don't keep the app in a loading gate.
      useAdminAuthStore.setState({ isLoading: false });
    }

    const bootstrapTimeout = window.setTimeout(() => {
      const state = useAdminAuthStore.getState();
      if (state.isLoading) {
        console.warn('[Auth] Session bootstrap timed out, showing login screen');
        useAdminAuthStore.setState({
          isLoading: false,
          sessionInitialized: true,
          isAuthenticated: false,
          user: null,
        });
      }
    }, 12000);

    return () => window.clearTimeout(bootstrapTimeout);
  }, [initSession, sessionInitialized]);

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
              path="monetization"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'finance_admin', 'compliance_officer']}>
                  <MonetizationOverviewPage />
                </PermissionRoute>
              }
            />
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
            <Route
              path="monetization/discounts"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'finance_admin']}>
                  <DiscountCodesPage />
                </PermissionRoute>
              }
            />
            <Route
              path="monetization/discounts/new"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'finance_admin']}>
                  <DiscountCodeEditorPage />
                </PermissionRoute>
              }
            />
            <Route
              path="monetization/discounts/:id/edit"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'finance_admin']}>
                  <DiscountCodeEditorPage />
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
            <Route
              path="analytics/shorts"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator', 'finance_admin', 'compliance_officer']}>
                  <TopShortsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="analytics/posts"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator', 'finance_admin', 'compliance_officer']}>
                  <TopPostsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="analytics/streams"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator', 'finance_admin', 'compliance_officer']}>
                  <TopStreamsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="analytics/streamers"
              element={
                <PermissionRoute allowedRoles={['super_admin', 'moderator', 'finance_admin', 'compliance_officer']}>
                  <TopStreamersPage />
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
