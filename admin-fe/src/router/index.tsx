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
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
]);
