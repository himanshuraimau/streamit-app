import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { UserDetailPage } from '@/pages/users/UserDetailPage';
import { ApplicationsPage } from '@/pages/streamers/ApplicationsPage';
import { LiveMonitorPage } from '@/pages/streamers/LiveMonitorPage';
import { ModerationQueuePage } from '@/pages/moderation/ModerationQueuePage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { ReportDetailPage } from '@/pages/reports/ReportDetailPage';
import { LedgerPage } from '@/pages/monetization/LedgerPage';
import { WithdrawalsPage } from '@/pages/monetization/WithdrawalsPage';
import { GiftsPage } from '@/pages/monetization/GiftsPage';
import { AdsPage } from '@/pages/ads/AdsPage';
import { AdEditorPage } from '@/pages/ads/AdEditorPage';
import { ProtectedRoute } from './ProtectedRoute';
import { PermissionRoute } from './PermissionRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
    ],
  },
  {
    path: '/users',
    element: (
      <ProtectedRoute>
        <PermissionRoute allowedRoles={['super_admin', 'support_admin', 'compliance_officer']}>
          <AdminLayout />
        </PermissionRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <UsersPage />,
      },
      {
        path: ':id',
        element: <UserDetailPage />,
      },
    ],
  },
  {
    path: '/streamers',
    element: (
      <ProtectedRoute>
        <PermissionRoute allowedRoles={['super_admin', 'moderator', 'support_admin']}>
          <AdminLayout />
        </PermissionRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'applications',
        element: <ApplicationsPage />,
      },
      {
        path: 'live',
        element: <LiveMonitorPage />,
      },
    ],
  },
  {
    path: '/moderation',
    element: (
      <ProtectedRoute>
        <PermissionRoute allowedRoles={['super_admin', 'moderator']}>
          <AdminLayout />
        </PermissionRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ModerationQueuePage />,
      },
      {
        path: 'shorts',
        element: <ModerationQueuePage />,
      },
      {
        path: 'posts',
        element: <ModerationQueuePage />,
      },
    ],
  },
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <PermissionRoute allowedRoles={['super_admin', 'moderator', 'support_admin', 'compliance_officer']}>
          <AdminLayout />
        </PermissionRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <ReportsPage />,
      },
      {
        path: ':id',
        element: <ReportDetailPage />,
      },
    ],
  },
  {
    path: '/monetization',
    element: (
      <ProtectedRoute>
        <PermissionRoute allowedRoles={['super_admin', 'finance_admin', 'compliance_officer']}>
          <AdminLayout />
        </PermissionRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'ledger',
        element: <LedgerPage />,
      },
      {
        path: 'withdrawals',
        element: <WithdrawalsPage />,
      },
      {
        path: 'gifts',
        element: <GiftsPage />,
      },
    ],
  },
  {
    path: '/ads',
    element: (
      <ProtectedRoute>
        <PermissionRoute allowedRoles={['super_admin', 'finance_admin']}>
          <AdminLayout />
        </PermissionRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdsPage />,
      },
      {
        path: 'new',
        element: <AdEditorPage />,
      },
      {
        path: ':id/edit',
        element: <AdEditorPage />,
      },
    ],
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
]);
