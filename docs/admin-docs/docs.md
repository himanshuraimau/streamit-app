# StreamIt — Admin Panel Architecture

> **Scope**: Admin backend extension (existing Express/Bun/Prisma) + standalone Admin Frontend (React 19 + shadcn/ui).
> All shadcn/ui components are used throughout — sidebar, inputs, tables, dialogs, badges, everything.

---

## Table of Contents

1. [Overview & Guiding Principles](#1-overview--guiding-principles)
2. [Role-Based Access Control](#2-role-based-access-control)
3. [Admin Backend Architecture](#3-admin-backend-architecture)
4. [Admin Frontend Architecture](#4-admin-fe-architecture)
5. [Auth System (Frontend)](#5-auth-system-frontend)
6. [Sidebar System](#6-sidebar-system)
7. [Module-by-Module Frontend Breakdown](#7-module-by-module-frontend-breakdown)
8. [API Integration Strategy](#8-api-integration-strategy)
9. [State Management](#9-state-management)
10. [Shared Code Strategy](#10-shared-code-strategy)
11. [Environment Separation](#11-environment-separation)
12. [Naming Conventions](#12-naming-conventions)
13. [Scalability Considerations](#13-scalability-considerations)

---

## 1. Overview & Guiding Principles

### Architecture Model

```
monorepo or multi-repo
├── backend/          ← existing (extended, not forked)
├── frontend/         ← existing user app (unchanged)
└── admin-fe/   ← new standalone admin app
```

### Core Constraints

- **Same backend**: Admin routes extend the existing Express app under `/api/admin/*`. No separate server.
- **Separate admin app**: `admin-fe/` is an independent Vite project. Runs on a different port/domain (e.g. `admin.streamit.com`).
- **No duplication**: Shared logic (types, validation schemas, utilities) lives in `backend/src/lib/` and is imported by admin modules, not copied.
- **shadcn/ui everywhere**: Every UI element in the admin frontend uses shadcn primitives — Sidebar, DataTable, Input, Dialog, Badge, Select, Switch, Tabs, Card, etc.

---

## 2. Role-Based Access Control

### Admin Roles

| Role | Description |
|---|---|
| `super_admin` | Full system access, role management |
| `moderator` | Content moderation, reports, stream control |
| `finance_admin` | Wallet, withdrawals, coin ledger, ad billing |
| `support_admin` | User management, ban/freeze, KYC status |
| `compliance_officer` | Legal requests, geo-blocking, audit logs, data exports |

### Permission Matrix

| Module | super_admin | moderator | finance_admin | support_admin | compliance_officer |
|---|---|---|---|---|---|
| User Management | ✅ | ❌ | ❌ | ✅ | ✅ (read) |
| Streamer Management | ✅ | ✅ | ❌ | ✅ | ❌ |
| Content Moderation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reports & Complaints | ✅ | ✅ | ❌ | ✅ | ✅ (read) |
| Monetization & Wallet | ✅ | ❌ | ✅ | ❌ | ✅ (read) |
| Advertisements | ✅ | ❌ | ✅ | ❌ | ❌ |
| Analytics | ✅ | ✅ (limited) | ✅ | ❌ | ✅ (read) |
| Legal & Compliance | ✅ | ❌ | ❌ | ❌ | ✅ |
| Settings & Controls | ✅ | ❌ | ❌ | ❌ | ❌ |
| Role Management | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Admin Backend Architecture

### Folder Structure

Extend the existing `backend/src/` — do not restructure existing code.

```
backend/src/
├── admin/                          ← NEW: all admin-specific code
│   ├── controllers/
│   │   ├── admin-auth.controller.ts
│   │   ├── user-mgmt.controller.ts
│   │   ├── streamer-mgmt.controller.ts
│   │   ├── content-mod.controller.ts
│   │   ├── reports.controller.ts
│   │   ├── monetization.controller.ts
│   │   ├── ads.controller.ts
│   │   ├── analytics.controller.ts
│   │   ├── compliance.controller.ts
│   │   └── settings.controller.ts
│   ├── routes/
│   │   ├── admin-auth.route.ts
│   │   ├── user-mgmt.route.ts
│   │   ├── streamer-mgmt.route.ts
│   │   ├── content-mod.route.ts
│   │   ├── reports.route.ts
│   │   ├── monetization.route.ts
│   │   ├── ads.route.ts
│   │   ├── analytics.route.ts
│   │   ├── compliance.route.ts
│   │   └── settings.route.ts
│   ├── middleware/
│   │   ├── admin-auth.middleware.ts    ← verifies admin session + role
│   │   └── permissions.middleware.ts  ← per-route permission check
│   ├── services/
│   │   ├── user-mgmt.service.ts
│   │   ├── streamer-mgmt.service.ts
│   │   ├── content-mod.service.ts
│   │   ├── reports.service.ts
│   │   ├── monetization.service.ts
│   │   ├── ads.service.ts
│   │   ├── analytics.service.ts
│   │   ├── compliance.service.ts
│   │   └── settings.service.ts
│   ├── validations/
│   │   ├── user-mgmt.schema.ts
│   │   ├── streamer-mgmt.schema.ts
│   │   ├── ads.schema.ts
│   │   └── ...
│   └── types/
│       └── admin.types.ts
├── controllers/                    ← existing, untouched
├── routes/                         ← existing, untouched
├── lib/
│   ├── auth.ts                     ← existing Better Auth config (shared)
│   ├── db.ts                       ← existing Prisma client (shared)
│   └── ...
└── index.ts                        ← register /api/admin/* router here
```

### Route Registration (index.ts)

```typescript
// existing routes untouched
app.use('/api/auth', authRouter);
app.use('/api/content', contentRouter);
// ...

// admin routes block — all protected by adminAuthMiddleware
import { adminRouter } from './admin/routes';
app.use('/api/admin', adminAuthMiddleware, adminRouter);
```

### Admin Router (admin/routes/index.ts)

```typescript
import { Router } from 'express';
import { requirePermission } from '../middleware/permissions.middleware';
import adminAuthRouter from './admin-auth.route';
import userMgmtRouter from './user-mgmt.route';
// ...

const adminRouter = Router();

adminRouter.use('/auth', adminAuthRouter);   // no permission guard — public admin login
adminRouter.use('/users', requirePermission(['super_admin', 'support_admin', 'compliance_officer']), userMgmtRouter);
adminRouter.use('/streamers', requirePermission(['super_admin', 'moderator', 'support_admin']), streamerMgmtRouter);
adminRouter.use('/moderation', requirePermission(['super_admin', 'moderator']), contentModRouter);
adminRouter.use('/reports', requirePermission(['super_admin', 'moderator', 'support_admin', 'compliance_officer']), reportsRouter);
adminRouter.use('/monetization', requirePermission(['super_admin', 'finance_admin', 'compliance_officer']), monetizationRouter);
adminRouter.use('/ads', requirePermission(['super_admin', 'finance_admin']), adsRouter);
adminRouter.use('/analytics', requirePermission(['super_admin', 'moderator', 'finance_admin', 'compliance_officer']), analyticsRouter);
adminRouter.use('/compliance', requirePermission(['super_admin', 'compliance_officer']), complianceRouter);
adminRouter.use('/settings', requirePermission(['super_admin']), settingsRouter);

export { adminRouter };
```

### Middleware

#### admin-auth.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';

export async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const session = await auth.getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const adminRoles = ['super_admin', 'moderator', 'finance_admin', 'support_admin', 'compliance_officer'];
  if (!adminRoles.includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  req.adminUser = session.user;  // typed via Express augmentation
  next();
}
```

#### permissions.middleware.ts

```typescript
export function requirePermission(allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.adminUser.role as AdminRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
```

### Admin Auth Endpoints

Admin uses the **same Better Auth system** as users. No separate auth service needed.

```
POST /api/admin/auth/sign-in        ← email + password → verifies role server-side
POST /api/admin/auth/sign-out
GET  /api/admin/auth/session        ← returns session + role
```

On sign-in, if `user.role` is not an admin role → return `403`. Admin accounts are seeded or created via super_admin.

### Key Admin API Endpoints

```
# User Management
GET    /api/admin/users                    list all users (paginated, searchable)
GET    /api/admin/users/:id               user detail + wallet + ban history
PATCH  /api/admin/users/:id/freeze        freeze/unfreeze account
PATCH  /api/admin/users/:id/ban           permanent ban
PATCH  /api/admin/users/:id/chat-disable  disable chat (24hr)
POST   /api/admin/users/:id/reset-password
GET    /api/admin/users/:id/ip-history

# Streamer Management
GET    /api/admin/streamers/applications  list pending applications
GET    /api/admin/streamers/applications/:id
PATCH  /api/admin/streamers/applications/:id/approve
PATCH  /api/admin/streamers/applications/:id/reject
GET    /api/admin/streamers/live          currently live streamers
POST   /api/admin/streamers/:id/kill-stream
POST   /api/admin/streamers/:id/mute
POST   /api/admin/streamers/:id/disable-chat
POST   /api/admin/streamers/:id/warn
PATCH  /api/admin/streamers/:id/suspend

# Content Moderation
GET    /api/admin/moderation/queue        flagged content queue
PATCH  /api/admin/moderation/:contentId/action   { action: dismiss|warn|remove|strike|ban }
GET    /api/admin/moderation/shorts
GET    /api/admin/moderation/posts
GET    /api/admin/moderation/streams

# Reports & Complaints
GET    /api/admin/reports                 paginated, filterable by category
GET    /api/admin/reports/:id
PATCH  /api/admin/reports/:id/resolve     { action, note }
GET    /api/admin/reports/audit-log

# Monetization & Wallet
GET    /api/admin/monetization/ledger     coin purchase ledger
GET    /api/admin/monetization/withdrawals
PATCH  /api/admin/monetization/withdrawals/:id/approve
PATCH  /api/admin/monetization/withdrawals/:id/reject
GET    /api/admin/monetization/gifts      gift transaction log
GET    /api/admin/monetization/wallets/:userId

# Advertisements
GET    /api/admin/ads
POST   /api/admin/ads                     upload creative + targeting config
PATCH  /api/admin/ads/:id
DELETE /api/admin/ads/:id
GET    /api/admin/ads/:id/performance

# Analytics
GET    /api/admin/analytics/overview      DAU, MAU, revenue, concurrent users
GET    /api/admin/analytics/streamers     revenue per streamer
GET    /api/admin/analytics/content       top shorts, posts, streams
GET    /api/admin/analytics/conversion    viewer → gift buyer funnel

# Compliance & Legal
GET    /api/admin/compliance/audit-log
POST   /api/admin/compliance/geo-block    { region, contentId? }
GET    /api/admin/compliance/export       user data export (GDPR/IT Rules)
GET    /api/admin/compliance/takedowns

# Settings
GET    /api/admin/settings
PATCH  /api/admin/settings               platform-wide config
POST   /api/admin/settings/admins        create admin user (super_admin only)
PATCH  /api/admin/settings/admins/:id/role
DELETE /api/admin/settings/admins/:id
```

### Prisma Schema Additions

```prisma
model AdminAuditLog {
  id         String   @id @default(cuid())
  adminId    String
  action     String
  targetType String   // user | stream | post | short | report | withdrawal
  targetId   String
  metadata   Json?
  createdAt  DateTime @default(now())

  admin User @relation(fields: [adminId], references: [id])
}

model AdCreative {
  id           String   @id @default(cuid())
  title        String
  mediaUrl     String
  targetRegion String[]
  targetGender String?
  category     String?
  cpm          Float
  frequencyCap Int
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model GeoBlock {
  id        String   @id @default(cuid())
  region    String
  contentId String?
  reason    String?
  createdAt DateTime @default(now())
}
```

---

## 4. Admin Frontend Architecture

### Project Setup

```
admin-fe/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/                    ← shadcn/ui components (auto-generated)
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx    ← root layout with sidebar
│   │   │   ├── AppSidebar.tsx     ← shadcn Sidebar implementation
│   │   │   ├── SidebarNav.tsx     ← nav items with permission filtering
│   │   │   ├── TopBar.tsx         ← breadcrumb + admin user menu
│   │   │   └── PageHeader.tsx     ← reusable page title + actions slot
│   │   ├── common/
│   │   │   ├── DataTable.tsx      ← shadcn Table + TanStack Table wrapper
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ConfirmDialog.tsx  ← shadcn AlertDialog wrapper
│   │   │   ├── ActionMenu.tsx     ← shadcn DropdownMenu for row actions
│   │   │   ├── FilterBar.tsx      ← search + filter controls
│   │   │   ├── StatCard.tsx       ← analytics metric card
│   │   │   ├── EmptyState.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── users/
│   │   ├── streamers/
│   │   ├── moderation/
│   │   ├── reports/
│   │   ├── monetization/
│   │   ├── ads/
│   │   ├── analytics/
│   │   ├── compliance/
│   │   └── settings/
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── users/
│   │   │   ├── UsersPage.tsx
│   │   │   └── UserDetailPage.tsx
│   │   ├── streamers/
│   │   │   ├── StreamersPage.tsx
│   │   │   ├── ApplicationsPage.tsx
│   │   │   └── LiveMonitorPage.tsx
│   │   ├── moderation/
│   │   │   ├── ModerationQueuePage.tsx
│   │   │   ├── ShortsModPage.tsx
│   │   │   └── PostsModPage.tsx
│   │   ├── reports/
│   │   │   ├── ReportsPage.tsx
│   │   │   └── ReportDetailPage.tsx
│   │   ├── monetization/
│   │   │   ├── WalletLedgerPage.tsx
│   │   │   ├── WithdrawalsPage.tsx
│   │   │   └── GiftTransactionsPage.tsx
│   │   ├── ads/
│   │   │   ├── AdsPage.tsx
│   │   │   └── AdEditorPage.tsx
│   │   ├── analytics/
│   │   │   └── AnalyticsPage.tsx
│   │   ├── compliance/
│   │   │   ├── CompliancePage.tsx
│   │   │   └── AuditLogPage.tsx
│   │   └── settings/
│   │       ├── SettingsPage.tsx
│   │       └── AdminRolesPage.tsx
│   ├── hooks/
│   │   ├── useAdminAuth.ts        ← session + role access
│   │   ├── usePermissions.ts      ← check role against permission matrix
│   │   ├── usePaginatedQuery.ts   ← TanStack Query wrapper with pagination
│   │   └── useConfirm.ts          ← imperative confirm dialog
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts          ← axios instance pointing to /api/admin
│   │   │   ├── users.api.ts
│   │   │   ├── streamers.api.ts
│   │   │   ├── moderation.api.ts
│   │   │   ├── reports.api.ts
│   │   │   ├── monetization.api.ts
│   │   │   ├── ads.api.ts
│   │   │   ├── analytics.api.ts
│   │   │   ├── compliance.api.ts
│   │   │   └── settings.api.ts
│   │   ├── permissions.ts         ← ROLE_PERMISSIONS map
│   │   ├── queryKeys.ts           ← TanStack Query key factory
│   │   └── utils.ts
│   ├── stores/
│   │   └── adminAuthStore.ts      ← Zustand: session, role, isLoading
│   ├── types/
│   │   ├── admin.types.ts
│   │   ├── api.types.ts
│   │   └── permissions.types.ts
│   ├── router/
│   │   ├── index.tsx              ← React Router v7 root router
│   │   ├── ProtectedRoute.tsx     ← auth guard
│   │   └── PermissionRoute.tsx    ← role guard
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── components.json                ← shadcn config
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

### Tech Stack (identical to user frontend)

- React 19 + TypeScript
- Vite 7
- TailwindCSS 4
- shadcn/ui (full component set)
- React Router v7
- TanStack Query v5
- Zustand
- React Hook Form + Zod
- Axios
- Lucide React
- Sonner (toasts)
- Recharts (for analytics charts)
- TanStack Table v8 (for DataTable)

---

## 5. Auth System (Frontend)

### Flow

```
Admin navigates to admin-fe
        ↓
No session in store → redirect to /login
        ↓
LoginPage renders shadcn Card + Form (email + password)
        ↓
POST /api/admin/auth/sign-in
        ↓
Success → session stored in Zustand + cookie set by Better Auth
        ↓
Role loaded into store → redirect to /dashboard
        ↓
On every app mount → GET /api/admin/auth/session to rehydrate
```

### adminAuthStore.ts (Zustand)

```typescript
import { create } from 'zustand';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

interface AdminAuthState {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AdminUser | null) => void;
  setLoading: (v: boolean) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### useAdminAuth.ts

```typescript
export function useAdminAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout } = useAdminAuthStore();

  const initSession = async () => {
    try {
      const res = await adminAuthApi.getSession();
      setUser(res.data.user);
    } catch {
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const res = await adminAuthApi.signIn({ email, password });
    setUser(res.data.user);
  };

  const signOut = async () => {
    await adminAuthApi.signOut();
    logout();
  };

  return { user, isLoading, isAuthenticated, initSession, signIn, signOut };
}
```

### Router Guards

#### ProtectedRoute.tsx

```tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuthStore();

  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

#### PermissionRoute.tsx

```tsx
interface Props {
  allowedRoles: AdminRole[];
  children: ReactNode;
}

export function PermissionRoute({ allowedRoles, children }: Props) {
  const { user } = useAdminAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}
```

### Router Structure (router/index.tsx)

```tsx
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />    {/* sidebar lives here */}
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      {
        path: 'users',
        element: <PermissionRoute allowedRoles={['super_admin', 'support_admin', 'compliance_officer']}><UsersPage /></PermissionRoute>,
      },
      {
        path: 'users/:id',
        element: <PermissionRoute allowedRoles={['super_admin', 'support_admin', 'compliance_officer']}><UserDetailPage /></PermissionRoute>,
      },
      {
        path: 'streamers',
        element: <PermissionRoute allowedRoles={['super_admin', 'moderator', 'support_admin']}><StreamersPage /></PermissionRoute>,
      },
      {
        path: 'streamers/applications',
        element: <PermissionRoute allowedRoles={['super_admin', 'moderator', 'support_admin']}><ApplicationsPage /></PermissionRoute>,
      },
      {
        path: 'streamers/live',
        element: <PermissionRoute allowedRoles={['super_admin', 'moderator']}><LiveMonitorPage /></PermissionRoute>,
      },
      {
        path: 'moderation',
        element: <PermissionRoute allowedRoles={['super_admin', 'moderator']}><ModerationQueuePage /></PermissionRoute>,
      },
      { path: 'moderation/shorts', element: <PermissionRoute allowedRoles={['super_admin', 'moderator']}><ShortsModPage /></PermissionRoute> },
      { path: 'moderation/posts', element: <PermissionRoute allowedRoles={['super_admin', 'moderator']}><PostsModPage /></PermissionRoute> },
      { path: 'reports', element: <PermissionRoute allowedRoles={['super_admin', 'moderator', 'support_admin', 'compliance_officer']}><ReportsPage /></PermissionRoute> },
      { path: 'reports/:id', element: <PermissionRoute allowedRoles={['super_admin', 'moderator', 'support_admin', 'compliance_officer']}><ReportDetailPage /></PermissionRoute> },
      { path: 'monetization/ledger', element: <PermissionRoute allowedRoles={['super_admin', 'finance_admin', 'compliance_officer']}><WalletLedgerPage /></PermissionRoute> },
      { path: 'monetization/withdrawals', element: <PermissionRoute allowedRoles={['super_admin', 'finance_admin']}><WithdrawalsPage /></PermissionRoute> },
      { path: 'monetization/gifts', element: <PermissionRoute allowedRoles={['super_admin', 'finance_admin', 'compliance_officer']}><GiftTransactionsPage /></PermissionRoute> },
      { path: 'ads', element: <PermissionRoute allowedRoles={['super_admin', 'finance_admin']}><AdsPage /></PermissionRoute> },
      { path: 'ads/new', element: <PermissionRoute allowedRoles={['super_admin', 'finance_admin']}><AdEditorPage /></PermissionRoute> },
      { path: 'ads/:id', element: <PermissionRoute allowedRoles={['super_admin', 'finance_admin']}><AdEditorPage /></PermissionRoute> },
      { path: 'analytics', element: <PermissionRoute allowedRoles={['super_admin', 'moderator', 'finance_admin', 'compliance_officer']}><AnalyticsPage /></PermissionRoute> },
      { path: 'compliance', element: <PermissionRoute allowedRoles={['super_admin', 'compliance_officer']}><CompliancePage /></PermissionRoute> },
      { path: 'compliance/audit', element: <PermissionRoute allowedRoles={['super_admin', 'compliance_officer']}><AuditLogPage /></PermissionRoute> },
      { path: 'settings', element: <PermissionRoute allowedRoles={['super_admin']}><SettingsPage /></PermissionRoute> },
      { path: 'settings/roles', element: <PermissionRoute allowedRoles={['super_admin']}><AdminRolesPage /></PermissionRoute> },
      { path: 'unauthorized', element: <UnauthorizedPage /> },
    ],
  },
]);
```

---

## 6. Sidebar System

Built with the **shadcn Sidebar** component (`components/ui/sidebar`). Use `SidebarProvider`, `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarFooter`.

### Sidebar Nav Configuration

```typescript
// lib/permissions.ts
export type AdminRole = 'super_admin' | 'moderator' | 'finance_admin' | 'support_admin' | 'compliance_officer';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: AdminRole[];
  children?: NavItem[];
  badge?: string;   // e.g. "12" for pending reports count
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['super_admin', 'moderator', 'finance_admin', 'support_admin', 'compliance_officer'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    allowedRoles: ['super_admin', 'support_admin', 'compliance_officer'],
  },
  {
    label: 'Streamers',
    href: '/streamers',
    icon: Radio,
    allowedRoles: ['super_admin', 'moderator', 'support_admin'],
    children: [
      { label: 'All Streamers', href: '/streamers', icon: List, allowedRoles: ['super_admin', 'moderator', 'support_admin'] },
      { label: 'Applications', href: '/streamers/applications', icon: FileCheck, allowedRoles: ['super_admin', 'moderator', 'support_admin'] },
      { label: 'Live Monitor', href: '/streamers/live', icon: Activity, allowedRoles: ['super_admin', 'moderator'] },
    ],
  },
  {
    label: 'Moderation',
    href: '/moderation',
    icon: ShieldAlert,
    allowedRoles: ['super_admin', 'moderator'],
    children: [
      { label: 'Queue', href: '/moderation', icon: Inbox, allowedRoles: ['super_admin', 'moderator'] },
      { label: 'Shorts', href: '/moderation/shorts', icon: Film, allowedRoles: ['super_admin', 'moderator'] },
      { label: 'Posts', href: '/moderation/posts', icon: FileText, allowedRoles: ['super_admin', 'moderator'] },
    ],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: Flag,
    allowedRoles: ['super_admin', 'moderator', 'support_admin', 'compliance_officer'],
  },
  {
    label: 'Monetization',
    href: '/monetization/ledger',
    icon: Wallet,
    allowedRoles: ['super_admin', 'finance_admin', 'compliance_officer'],
    children: [
      { label: 'Coin Ledger', href: '/monetization/ledger', icon: Coins, allowedRoles: ['super_admin', 'finance_admin', 'compliance_officer'] },
      { label: 'Withdrawals', href: '/monetization/withdrawals', icon: ArrowDownToLine, allowedRoles: ['super_admin', 'finance_admin'] },
      { label: 'Gift Transactions', href: '/monetization/gifts', icon: Gift, allowedRoles: ['super_admin', 'finance_admin', 'compliance_officer'] },
    ],
  },
  {
    label: 'Advertisements',
    href: '/ads',
    icon: Megaphone,
    allowedRoles: ['super_admin', 'finance_admin'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    allowedRoles: ['super_admin', 'moderator', 'finance_admin', 'compliance_officer'],
  },
  {
    label: 'Compliance',
    href: '/compliance',
    icon: Scale,
    allowedRoles: ['super_admin', 'compliance_officer'],
    children: [
      { label: 'Overview', href: '/compliance', icon: FileWarning, allowedRoles: ['super_admin', 'compliance_officer'] },
      { label: 'Audit Log', href: '/compliance/audit', icon: ClipboardList, allowedRoles: ['super_admin', 'compliance_officer'] },
    ],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    allowedRoles: ['super_admin'],
    children: [
      { label: 'Platform', href: '/settings', icon: SlidersHorizontal, allowedRoles: ['super_admin'] },
      { label: 'Admin Roles', href: '/settings/roles', icon: UserCog, allowedRoles: ['super_admin'] },
    ],
  },
];
```

### AppSidebar.tsx

```tsx
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubButton, SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function AppSidebar() {
  const { user } = useAdminAuthStore();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  const visibleNav = NAV_ITEMS.filter(item => hasPermission(item.allowedRoles));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Logo + app name */}
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <Radio className="size-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">StreamIt Admin</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {visibleNav.map((item) =>
              item.children ? (
                <Collapsible key={item.href} asChild defaultOpen={location.pathname.startsWith(item.href)}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.label}>
                        <item.icon />
                        <span>{item.label}</span>
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children
                          .filter(child => hasPermission(child.allowedRoles))
                          .map(child => (
                            <SidebarMenuSubItem key={child.href}>
                              <SidebarMenuSubButton asChild isActive={location.pathname === child.href}>
                                <Link to={child.href}>
                                  <child.icon />
                                  <span>{child.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.href} tooltip={item.label}>
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                      {item.badge && <Badge className="ml-auto size-5 justify-center rounded-full p-0 text-xs">{item.badge}</Badge>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Admin user card with sign out */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{user?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="size-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
```

### AdminLayout.tsx

```tsx
export function AdminLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

### TopBar.tsx

```tsx
export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/dashboard">Admin</Link></BreadcrumbLink>
          </BreadcrumbItem>
          {/* dynamic segments via useLocation */}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />    {/* pending reports / withdrawals count */}
        <ModeToggle />          {/* shadcn dark/light toggle */}
      </div>
    </header>
  );
}
```

---

## 7. Module-by-Module Frontend Breakdown

### shadcn Components Used Per Module

| Module | Primary shadcn Components |
|---|---|
| Login | Card, Form, Input, Button, Label |
| Dashboard | Card, Badge, Separator |
| Users | Table, Input, Select, Badge, DropdownMenu, Dialog, AlertDialog, Sheet |
| Streamer Applications | Table, Badge, Button, Dialog, Textarea |
| Live Monitor | Card, Badge, Button, Separator |
| Moderation Queue | Tabs, Table, Badge, AlertDialog, Select |
| Reports | Table, Badge, Select, Dialog, Textarea |
| Monetization | Table, Tabs, Badge, AlertDialog, Card |
| Ads | Form, Input, Select, Switch, Card, Table |
| Analytics | Card, Tabs, Select (Recharts for charts) |
| Compliance | Table, Button, Dialog, Badge |
| Settings | Form, Input, Switch, Select, Separator, Card |
| Admin Roles | Table, Dialog, Select, Badge |

### DataTable (Reusable)

Central component used in every listing page. Built on **TanStack Table v8** + **shadcn Table**.

```tsx
// components/common/DataTable.tsx
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  pageCount?: number;
  toolbar?: ReactNode;    // slot for search + filters
}
```

Supports: sorting, pagination, row selection, custom cell renderers, loading skeletons.

### Live Monitor Page

```
LiveMonitorPage
├── FilterBar (shadcn Input + Select for category filter)
├── grid of LiveStreamCard components
│   └── Each card: thumbnail preview, viewer count Badge, streamer name
│       ActionMenu: Kill Stream | Mute | Disable Chat | Warn | Suspend
│           → each action opens ConfirmDialog (shadcn AlertDialog)
└── Polling with TanStack Query refetchInterval: 10000
```

### Streamer Application Detail

```
ApplicationsPage → Table → row click → Sheet (shadcn) slides in
Sheet contains:
  - Applicant info
  - Uploaded docs (Government ID, PAN, Selfie) as images
  - Bank details
  - Approve / Reject buttons
  - Reject: opens Dialog with Textarea for rejection reason
```

### Reports Page

```
ReportsPage
├── FilterBar: category Select (Sexual|Violence|Spam|Copyright|Hate speech) + status Select
├── DataTable with columns: Reporter | Target | Category | Priority Badge | Reports Count | Date | Actions
└── Row click → ReportDetailPage
    ├── Report metadata
    ├── Reported content preview (post/short/stream embed)
    ├── Reporter history (previous reports from same user)
    └── Action buttons via shadcn Button group:
        Dismiss | Warning | Remove Content | Strike | Ban
        → ConfirmDialog for Strike and Ban
```

### Withdrawals Page

```
WithdrawalsPage
├── Tabs: Pending | Approved | Rejected (shadcn Tabs)
├── DataTable: Streamer | Amount | Bank Details | Requested At | Status
└── Approve: AlertDialog confirm → PATCH /api/admin/monetization/withdrawals/:id/approve
    Reject: Dialog with Textarea for reason → PATCH .../reject
```

### Analytics Page

```
AnalyticsPage
├── Date range Select: Today | 7 Days | 30 Days | 90 Days
├── StatCard row: DAU | MAU | Live Concurrent | Total Revenue | Conversion Rate
├── Recharts AreaChart: DAU/MAU trend
├── Recharts BarChart: Revenue per streamer (top 10)
├── Recharts BarChart: Top Shorts by views
└── Recharts FunnelChart or simple stat: Viewer → Gift Buyer conversion
```

### Ad Editor Page

```
AdEditorPage (shadcn Form + React Hook Form + Zod)
├── Input: Ad Title
├── File upload: Ad Creative (image/video) → presigned S3 upload
├── MultiSelect: Target Regions
├── Select: Target Gender
├── MultiSelect: Stream Category
├── Input (number): CPM
├── Input (number): Frequency Cap (per user per day)
├── Switch: Active / Inactive
└── Submit → POST or PATCH /api/admin/ads
```

---

## 8. API Integration Strategy

### Axios Client (lib/api/client.ts)

```typescript
import axios from 'axios';

export const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/admin',
  withCredentials: true,    // sends Better Auth session cookie
});

adminClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAdminAuthStore.getState().logout();
      window.location.href = '/login';
    }
    if (err.response?.status === 403) {
      window.location.href = '/unauthorized';
    }
    return Promise.reject(err);
  }
);
```

### API Module Pattern

```typescript
// lib/api/users.api.ts
import { adminClient } from './client';

export const usersApi = {
  list: (params: UserListParams) => adminClient.get('/users', { params }),
  getById: (id: string) => adminClient.get(`/users/${id}`),
  freeze: (id: string, frozen: boolean) => adminClient.patch(`/users/${id}/freeze`, { frozen }),
  ban: (id: string) => adminClient.patch(`/users/${id}/ban`),
  disableChat: (id: string) => adminClient.patch(`/users/${id}/chat-disable`),
  resetPassword: (id: string) => adminClient.post(`/users/${id}/reset-password`),
};
```

### Query Keys Factory (lib/queryKeys.ts)

```typescript
export const queryKeys = {
  users: {
    all: ['admin', 'users'] as const,
    list: (params: object) => ['admin', 'users', 'list', params] as const,
    detail: (id: string) => ['admin', 'users', id] as const,
  },
  streamers: {
    all: ['admin', 'streamers'] as const,
    applications: (params: object) => ['admin', 'streamers', 'applications', params] as const,
    live: ['admin', 'streamers', 'live'] as const,
  },
  reports: {
    list: (params: object) => ['admin', 'reports', params] as const,
    detail: (id: string) => ['admin', 'reports', id] as const,
  },
  analytics: {
    overview: (range: string) => ['admin', 'analytics', 'overview', range] as const,
  },
  // ...
};
```

### Mutations with Toast Feedback

All mutating actions follow this pattern:

```typescript
const freezeMutation = useMutation({
  mutationFn: () => usersApi.freeze(userId, true),
  onSuccess: () => {
    toast.success('Account frozen successfully');
    queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
  },
  onError: (err: AxiosError<{ error: string }>) => {
    toast.error(err.response?.data?.error ?? 'Action failed');
  },
});
```

---

## 9. State Management

| State Type | Tool |
|---|---|
| Auth session + role | Zustand (`adminAuthStore`) |
| Server data + caching | TanStack Query |
| Form state | React Hook Form |
| Local UI state | useState / useReducer |

No global UI store needed. Page-level state stays in the page component. Mutations invalidate only the affected query keys.

---

## 10. Shared Code Strategy

### What to Share

- **Types**: `backend/src/types/` contains shared Prisma-derived types. Export from backend, import into both frontends via a shared package or copy-and-maintain in `admin-fe/src/types/`.
- **Zod schemas**: Validation schemas live in `backend/src/lib/validations/`. For frontend forms, duplicate the relevant schema in `admin-fe/src/lib/validations/` — do not import directly from backend to avoid coupling.
- **shadcn components**: `admin-fe` maintains its own `components/ui/` installed via shadcn CLI. Do not copy from user frontend; reinstall fresh.

### What Not to Share

- API clients (different base URLs and interceptor logic)
- Auth hooks (admin vs user session shape)
- Zustand stores (separate concerns)
- Any user-facing components

### Recommended Approach

For a simple setup, `admin-fe/` is a fully independent Vite project that does not import from `frontend/`. Types can be hand-synced or extracted into a small shared `packages/types/` if you move to a monorepo later.

---

## 11. Environment Separation

### Backend (.env additions)

```env
ADMIN_FRONTEND_URL="http://localhost:5174"    # already in existing .env.example
```

CORS configuration in `index.ts` already allows `ADMIN_FRONTEND_URL`. Admin routes are under `/api/admin/*` — no port or process separation required.

### Admin Frontend (.env)

```env
VITE_API_URL="http://localhost:3000"          # same backend, same base URL
```

### Port Assignments

```
Backend:        3000
User Frontend:  5173
Admin Frontend: 5174
```

### Production

- Admin frontend deployed to `admin.streamit.com`
- Optionally behind IP allowlist (restrict to office/VPN IPs via Nginx or Cloudflare Access)
- Backend CORS updated to include production admin domain

---

## 12. Naming Conventions

### Files

```
PascalCase   → React components       UsersPage.tsx, AppSidebar.tsx
camelCase    → hooks, utils, services useAdminAuth.ts, usersApi.ts
kebab-case   → route segments         /streamer-applications, /audit-log
```

### API Layer

```
Suffix .api.ts       → lib/api/users.api.ts
Suffix .service.ts   → backend/src/admin/services/user-mgmt.service.ts
Suffix .controller.ts → backend/src/admin/controllers/user-mgmt.controller.ts
Suffix .route.ts     → backend/src/admin/routes/user-mgmt.route.ts
Suffix .schema.ts    → validations/user-mgmt.schema.ts
Suffix .types.ts     → types/admin.types.ts
```

### Backend Routes

```
All admin routes prefixed: /api/admin/*
Admin auth:               /api/admin/auth/*
No overlap with user API: /api/* (user) vs /api/admin/* (admin)
```

### Query Keys

All admin query keys are prefixed with `'admin'` as the first array element to prevent collision with user frontend query keys if they ever share a cache.

---

## 13. Scalability Considerations

### Backend

- **Module isolation**: Each admin domain (`users`, `streamers`, `moderation`, ...) is a self-contained folder with its own controller, service, route, and validation. Adding a new admin module never touches existing modules.
- **Permission middleware is composable**: `requirePermission(['super_admin', 'finance_admin'])` is a factory — add new roles without changing route files.
- **Audit logging**: Every destructive admin action (ban, kill stream, approve/reject withdrawal) calls `AdminAuditLog` write in the service layer. This is enforced by convention in the service, not the controller.
- **Analytics queries**: Heavy aggregate queries (DAU, MAU, revenue) should be cached with a Redis layer or materialized views as traffic grows. Service layer abstracts this — swap implementation without changing controllers.

### Frontend

- **`PermissionRoute` wraps every admin page**: Adding a new role only requires updating the `allowedRoles` prop and the `ROLE_PERMISSIONS` map. Zero component rewrites.
- **`NAV_ITEMS` config drives the sidebar**: Adding a new section = adding one object to the array. The sidebar filters it automatically by role.
- **DataTable is the single source of truth for tabular data**: All listing pages use the same `DataTable` component. Pagination, sorting, and search are handled once.
- **TanStack Query key factory**: Prevents cache fragmentation. Adding a new query = adding a key function to `queryKeys`. Invalidation is predictable.
- **Code splitting**: Every page uses `React.lazy()`. Admin pages are loaded on demand — the initial bundle stays small regardless of how many modules are added.

```tsx
// router/index.tsx — apply lazy to every page
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'));
// wrap Outlet in <Suspense fallback={<PageSkeleton />}>
```

---

*End of StreamIt Admin Panel Architecture Document*