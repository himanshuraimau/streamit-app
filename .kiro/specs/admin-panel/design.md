# Design Document: StreamIt Admin Panel

## Overview

The StreamIt Admin Panel is a comprehensive administrative system that extends the existing Express/Bun/Prisma backend with admin-specific routes under `/api/admin/*` and provides a standalone React 19 frontend application (`admin-fe`) for platform management. The system implements role-based access control (RBAC) for five distinct admin roles, enabling efficient platform moderation, user management, content oversight, financial operations, and legal compliance.

### Design Goals

1. **Security First**: Implement robust authentication and authorization using Better Auth with role-based permissions
2. **Modular Architecture**: Organize code by feature modules with clear boundaries for maintainability
3. **Audit Trail**: Log all administrative actions for compliance and accountability
4. **Scalability**: Design for horizontal scaling with stateless API and efficient database queries
5. **Developer Experience**: Provide consistent patterns, comprehensive types, and reusable components
6. **Performance**: Optimize for fast load times and responsive interactions through caching and pagination
7. **Accessibility**: Ensure WCAG AA compliance with keyboard navigation and screen reader support

### Technology Stack

**Backend Extension**:
- Express.js (existing)
- Bun runtime (existing)
- Prisma ORM (existing)
- Better Auth (existing)
- Zod validation
- TypeScript

**Frontend Application**:
- React 19
- Vite 7
- TypeScript
- TailwindCSS 4
- shadcn/ui (complete component library)
- React Router v7
- TanStack Query v5
- Zustand (state management)
- React Hook Form + Zod
- Axios
- Sonner (toasts)
- Recharts (analytics)
- TanStack Table v8


## Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Frontend (admin-fe)                │
│  React 19 + shadcn/ui + TanStack Query + Zustand            │
│  Port: 5174 (dev) | Domain: admin.streamit.com (prod)       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS + Cookies
                     │ /api/admin/*
┌────────────────────▼────────────────────────────────────────┐
│              Backend (Extended Express App)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Admin Routes (/api/admin/*)                         │  │
│  │  - adminAuthMiddleware (session + role verification) │  │
│  │  - requirePermission (per-route RBAC)                │  │
│  │  - Controllers → Services → Prisma                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Existing User Routes (/api/*)                       │  │
│  │  (unchanged)                                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                PostgreSQL Database (Prisma)                  │
│  - Existing models (User, Stream, Post, etc.)               │
│  - New admin models (AdminAuditLog, AdCreative, GeoBlock)   │
└─────────────────────────────────────────────────────────────┘
```

### Backend Architecture

The admin backend extends the existing Express application without creating a separate server. All admin functionality is organized under `backend/src/admin/` directory.

**Directory Structure**:
```
backend/src/
├── admin/                          # NEW: All admin code
│   ├── controllers/                # Request handlers
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
│   ├── services/                   # Business logic
│   │   ├── user-mgmt.service.ts
│   │   ├── streamer-mgmt.service.ts
│   │   ├── content-mod.service.ts
│   │   ├── reports.service.ts
│   │   ├── monetization.service.ts
│   │   ├── ads.service.ts
│   │   ├── analytics.service.ts
│   │   ├── compliance.service.ts
│   │   ├── settings.service.ts
│   │   └── audit-log.service.ts
│   ├── routes/                     # Route definitions
│   │   ├── index.ts                # Main admin router
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
│   ├── middleware/                 # Admin-specific middleware
│   │   ├── admin-auth.middleware.ts
│   │   └── permissions.middleware.ts
│   ├── validations/                # Zod schemas
│   │   ├── user-mgmt.schema.ts
│   │   ├── streamer-mgmt.schema.ts
│   │   ├── ads.schema.ts
│   │   └── ...
│   └── types/                      # Admin-specific types
│       └── admin.types.ts
├── lib/                            # Shared utilities (existing)
│   ├── auth.ts                     # Better Auth config
│   ├── db.ts                       # Prisma client
│   └── ...
└── index.ts                        # Register admin routes here
```


### Frontend Architecture

The admin frontend is a standalone Vite application completely separate from the user frontend.

**Directory Structure**:
```
admin-fe/
├── src/
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── ... (all shadcn components)
│   │   ├── layout/                 # Layout components
│   │   │   ├── AdminLayout.tsx     # Root layout with sidebar
│   │   │   ├── AppSidebar.tsx      # Navigation sidebar
│   │   │   ├── TopBar.tsx          # Header with breadcrumbs
│   │   │   └── PageHeader.tsx      # Reusable page title
│   │   ├── common/                 # Shared components
│   │   │   ├── DataTable.tsx       # TanStack Table wrapper
│   │   │   ├── FilterBar.tsx       # Search + filters
│   │   │   ├── StatusBadge.tsx     # Status indicators
│   │   │   ├── ConfirmDialog.tsx   # Confirmation dialogs
│   │   │   ├── ActionMenu.tsx      # Row action menus
│   │   │   ├── StatCard.tsx        # Analytics cards
│   │   │   ├── EmptyState.tsx      # Empty list states
│   │   │   └── LoadingSkeleton.tsx # Loading states
│   │   └── [feature]/              # Feature-specific components
│   │       ├── users/
│   │       ├── streamers/
│   │       ├── moderation/
│   │       ├── reports/
│   │       ├── monetization/
│   │       ├── ads/
│   │       ├── analytics/
│   │       ├── compliance/
│   │       └── settings/
│   ├── pages/                      # Route pages
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── users/
│   │   │   ├── UsersPage.tsx
│   │   │   └── UserDetailPage.tsx
│   │   ├── streamers/
│   │   │   ├── ApplicationsPage.tsx
│   │   │   └── LiveMonitorPage.tsx
│   │   ├── moderation/
│   │   │   └── ModerationQueuePage.tsx
│   │   ├── reports/
│   │   │   ├── ReportsPage.tsx
│   │   │   └── ReportDetailPage.tsx
│   │   ├── monetization/
│   │   │   ├── LedgerPage.tsx
│   │   │   ├── WithdrawalsPage.tsx
│   │   │   └── GiftsPage.tsx
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
│   ├── hooks/                      # Custom hooks
│   │   ├── useAdminAuth.ts
│   │   ├── usePermissions.ts
│   │   ├── usePaginatedQuery.ts
│   │   └── useConfirm.ts
│   ├── lib/                        # Utilities
│   │   ├── api/                    # API clients
│   │   │   ├── client.ts           # Axios instance
│   │   │   ├── users.api.ts
│   │   │   ├── streamers.api.ts
│   │   │   └── ...
│   │   ├── permissions.ts          # Permission matrix
│   │   ├── queryKeys.ts            # Query key factory
│   │   └── utils.ts                # Helper functions
│   ├── stores/                     # Zustand stores
│   │   └── adminAuthStore.ts
│   ├── types/                      # TypeScript types
│   │   ├── admin.types.ts
│   │   ├── api.types.ts
│   │   └── permissions.types.ts
│   ├── router/                     # React Router
│   │   ├── index.tsx               # Router config
│   │   ├── ProtectedRoute.tsx      # Auth guard
│   │   └── PermissionRoute.tsx     # Role guard
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── components.json                 # shadcn config
├── .env.example
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```


## Components and Interfaces

### Backend Components

#### 1. Authentication Middleware

**admin-auth.middleware.ts**
```typescript
Purpose: Verify admin session and role on every /api/admin/* request
Dependencies: Better Auth, Prisma
Flow:
  1. Extract session from request using Better Auth
  2. Verify session exists and is valid
  3. Check user role is one of: super_admin, moderator, finance_admin, support_admin, compliance_officer
  4. Attach admin user to request object
  5. Return 401 if no session, 403 if not admin role
```

#### 2. Permission Middleware

**permissions.middleware.ts**
```typescript
Purpose: Enforce role-based access control per route
Pattern: Factory function returning middleware
Usage: requirePermission(['super_admin', 'moderator'])
Flow:
  1. Accept array of allowed roles
  2. Return middleware function
  3. Check req.adminUser.role against allowed roles
  4. Return 403 if role not in allowed list
```

#### 3. Service Layer

Each module has a dedicated service file containing business logic:

**user-mgmt.service.ts**
- listUsers(filters, pagination): Paginated user list with search/filter
- getUserById(id): Complete user details with wallet, ban history
- freezeUser(id, reason, expiresAt): Suspend account temporarily
- banUser(id, reason, adminId): Permanently ban account
- disableChat(id, duration): Prevent chat participation
- resetPassword(id): Generate password reset token

**streamer-mgmt.service.ts**
- listApplications(filters, pagination): Pending creator applications
- getApplicationById(id): Full application details with documents
- approveApplication(id, adminId): Approve and upgrade to creator role
- rejectApplication(id, reason, adminId): Reject with reason
- listLiveStreams(): Currently active streams
- killStream(streamId, adminId): Terminate LiveKit room
- muteStreamer(streamId, adminId): Disable audio
- disableStreamChat(streamId, adminId): Disable chat
- warnStreamer(streamId, message, adminId): Send warning notification
- suspendStreamer(userId, reason, adminId): Freeze account and kill stream

**content-mod.service.ts**
- getModerationQueue(filters, pagination): Flagged content
- getContentById(id, type): Content details with flags
- dismissFlags(contentId, adminId): Clear flags
- warnAuthor(contentId, message, adminId): Send warning
- removeContent(contentId, reason, adminId): Hide content
- strikeAuthor(contentId, adminId): Increment strike count
- banAuthor(contentId, adminId): Ban user and hide all content

**reports.service.ts**
- listReports(filters, pagination): User reports
- getReportById(id): Report details with history
- resolveReport(id, action, notes, adminId): Mark resolved with action

**monetization.service.ts**
- getCoinLedger(filters, pagination): Coin purchase history
- getWithdrawals(filters, pagination): Withdrawal requests
- approveWithdrawal(id, adminId): Approve and deduct balance
- rejectWithdrawal(id, reason, adminId): Reject with reason
- getGiftTransactions(filters, pagination): Gift history
- getWalletDetails(userId): Wallet balance and transactions

**ads.service.ts**
- listAds(filters, pagination): Ad campaigns
- createAd(data, adminId): Create new ad campaign
- updateAd(id, data, adminId): Update ad campaign
- deleteAd(id, adminId): Deactivate ad campaign
- getAdPerformance(id): Analytics for ad campaign

**analytics.service.ts**
- getOverview(dateRange): DAU, MAU, revenue, concurrent users
- getTopStreamers(dateRange, limit): Revenue per streamer
- getTopContent(dateRange, type): Top shorts/posts/streams
- getConversionFunnel(dateRange): Viewer to gift buyer conversion

**compliance.service.ts**
- getAuditLog(filters, pagination): Admin action history
- createGeoBlock(region, contentId, reason, adminId): Block content by region
- exportUserData(userId, adminId): GDPR data export
- getTakedowns(): Content removed for legal reasons

**settings.service.ts**
- getSettings(): All system settings
- updateSettings(updates, adminId): Update platform settings
- listAdmins(): All admin users
- createAdmin(data, adminId): Create new admin account
- updateAdminRole(id, role, adminId): Change admin role
- deleteAdmin(id, adminId): Remove admin access

**audit-log.service.ts**
- createLog(adminId, action, targetType, targetId, metadata): Write audit entry
- getLogs(filters, pagination): Query audit logs


#### 4. Controller Layer

Controllers handle HTTP requests, validate input, call services, and return responses.

**Pattern**:
```typescript
export class UserMgmtController {
  static async listUsers(req: Request, res: Response) {
    try {
      // 1. Validate query parameters using Zod
      const params = listUsersSchema.parse(req.query);
      
      // 2. Call service
      const result = await UserMgmtService.listUsers(params);
      
      // 3. Return response
      res.json(result);
    } catch (error) {
      // 4. Handle errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors });
      }
      console.error('Error listing users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

#### 5. Route Layer

Routes define endpoints and apply middleware.

**admin/routes/index.ts** (Main Router):
```typescript
import { Router } from 'express';
import { requirePermission } from '../middleware/permissions.middleware';
import adminAuthRouter from './admin-auth.route';
import userMgmtRouter from './user-mgmt.route';
// ... other routers

const adminRouter = Router();

// Auth routes (no permission check)
adminRouter.use('/auth', adminAuthRouter);

// Protected routes with role-based access
adminRouter.use('/users', 
  requirePermission(['super_admin', 'support_admin', 'compliance_officer']), 
  userMgmtRouter
);

adminRouter.use('/streamers', 
  requirePermission(['super_admin', 'moderator', 'support_admin']), 
  streamerMgmtRouter
);

adminRouter.use('/moderation', 
  requirePermission(['super_admin', 'moderator']), 
  contentModRouter
);

adminRouter.use('/reports', 
  requirePermission(['super_admin', 'moderator', 'support_admin', 'compliance_officer']), 
  reportsRouter
);

adminRouter.use('/monetization', 
  requirePermission(['super_admin', 'finance_admin', 'compliance_officer']), 
  monetizationRouter
);

adminRouter.use('/ads', 
  requirePermission(['super_admin', 'finance_admin']), 
  adsRouter
);

adminRouter.use('/analytics', 
  requirePermission(['super_admin', 'moderator', 'finance_admin', 'compliance_officer']), 
  analyticsRouter
);

adminRouter.use('/compliance', 
  requirePermission(['super_admin', 'compliance_officer']), 
  complianceRouter
);

adminRouter.use('/settings', 
  requirePermission(['super_admin']), 
  settingsRouter
);

export { adminRouter };
```

**Individual Route Files**:
```typescript
// admin/routes/user-mgmt.route.ts
import { Router } from 'express';
import { UserMgmtController } from '../controllers/user-mgmt.controller';

const router = Router();

router.get('/', UserMgmtController.listUsers);
router.get('/:id', UserMgmtController.getUserById);
router.patch('/:id/freeze', UserMgmtController.freezeUser);
router.patch('/:id/ban', UserMgmtController.banUser);
router.patch('/:id/chat-disable', UserMgmtController.disableChat);
router.post('/:id/reset-password', UserMgmtController.resetPassword);

export default router;
```

### Frontend Components

#### 1. Layout Components

**AdminLayout.tsx**
```typescript
Purpose: Root layout wrapper for all authenticated pages
Components: SidebarProvider, AppSidebar, TopBar, Outlet
Features:
  - Persistent sidebar navigation
  - Top bar with breadcrumbs and user menu
  - Main content area with padding
  - Responsive layout
```

**AppSidebar.tsx**
```typescript
Purpose: Navigation sidebar with role-based filtering
Components: Sidebar, SidebarHeader, SidebarContent, SidebarFooter
Features:
  - Logo and app name in header
  - Navigation items filtered by user role
  - Collapsible nested navigation groups
  - Active route highlighting
  - User info and sign out in footer
  - Icon-only collapsed mode
```

**TopBar.tsx**
```typescript
Purpose: Header bar with navigation aids
Components: SidebarTrigger, Breadcrumb, NotificationBell, ModeToggle
Features:
  - Sidebar collapse toggle
  - Dynamic breadcrumb navigation
  - Notification badge (pending items count)
  - Dark/light theme toggle
```


#### 2. Common Components

**DataTable.tsx**
```typescript
Purpose: Reusable table component for all list views
Dependencies: TanStack Table v8, shadcn Table components
Props:
  - columns: ColumnDef<TData, TValue>[]
  - data: TData[]
  - isLoading: boolean
  - pagination: PaginationState
  - onPaginationChange: (state: PaginationState) => void
  - pageCount: number
  - toolbar: ReactNode (slot for filters)
Features:
  - Column sorting with visual indicators
  - Server-side pagination
  - Row selection with checkboxes
  - Loading skeletons
  - Empty state
  - Custom cell renderers
  - Responsive with horizontal scroll on mobile
```

**FilterBar.tsx**
```typescript
Purpose: Search and filter controls for list views
Components: Input, Select, Badge, Button
Props:
  - searchPlaceholder: string
  - filters: FilterConfig[]
  - onSearchChange: (value: string) => void
  - onFilterChange: (key: string, value: any) => void
Features:
  - Debounced search input (300ms)
  - Multiple filter dropdowns
  - Active filter badges with clear buttons
  - Clear all filters button
```

**StatusBadge.tsx**
```typescript
Purpose: Consistent status indicators
Props:
  - status: string
  - variant: 'default' | 'success' | 'warning' | 'destructive'
Features:
  - Color-coded badges
  - Predefined status mappings
  - Accessible labels
```

**ConfirmDialog.tsx**
```typescript
Purpose: Confirmation dialogs for destructive actions
Components: AlertDialog
Props:
  - title: string
  - description: string
  - confirmText: string
  - onConfirm: () => void
  - variant: 'default' | 'destructive'
Features:
  - Imperative API via useConfirm hook
  - Keyboard navigation
  - Focus management
```

**ActionMenu.tsx**
```typescript
Purpose: Row action dropdown menus
Components: DropdownMenu
Props:
  - actions: ActionItem[]
  - onAction: (action: string) => void
Features:
  - Icon + label for each action
  - Keyboard navigation
  - Destructive action styling
```

#### 3. Feature-Specific Components

**Users Module**:
- UserTable: DataTable with user-specific columns
- UserDetailSheet: Sheet component with user details tabs
- FreezeUserDialog: Dialog for account suspension
- BanUserDialog: Confirmation dialog for permanent ban

**Streamers Module**:
- ApplicationCard: Card displaying application summary
- ApplicationDetailSheet: Sheet with full application review
- LiveStreamCard: Card for live stream monitoring
- StreamActionMenu: Actions for live stream control

**Moderation Module**:
- ContentCard: Card displaying flagged content preview
- ModerationActionDialog: Dialog for moderation actions
- ContentPreview: Media preview component (image/video/text)

**Reports Module**:
- ReportCard: Card displaying report summary
- ReportDetailView: Full report context with history
- ResolveReportDialog: Dialog for report resolution

**Monetization Module**:
- TransactionTable: DataTable for financial records
- WithdrawalCard: Card for withdrawal request
- ApproveWithdrawalDialog: Confirmation with details
- RejectWithdrawalDialog: Dialog with reason input

**Ads Module**:
- AdCard: Card displaying ad campaign summary
- AdForm: Form for creating/editing ads
- AdPerformanceChart: Recharts visualization
- MediaUpload: S3 upload component

**Analytics Module**:
- StatCard: Metric card with trend indicator
- OverviewChart: Recharts area chart for DAU/MAU
- RevenueChart: Recharts bar chart for revenue
- ConversionFunnel: Visual funnel representation

**Compliance Module**:
- AuditLogTable: DataTable for audit entries
- GeoBlockForm: Form for geo-blocking
- DataExportButton: Button triggering export

**Settings Module**:
- SettingsForm: Form with categorized settings
- AdminRoleTable: DataTable for admin users
- CreateAdminDialog: Dialog for new admin creation
- RoleChangeDialog: Dialog for role modification


## Data Models

### Database Schema Extensions

#### New Models

**AdminAuditLog**
```prisma
model AdminAuditLog {
  id         String   @id @default(cuid())
  adminId    String
  admin      User     @relation(fields: [adminId], references: [id])
  action     String   // user_ban, user_freeze, stream_kill, content_remove, etc.
  targetType String   // user, stream, post, short, report, withdrawal, application
  targetId   String
  metadata   Json?    // Additional context (reason, notes, etc.)
  createdAt  DateTime @default(now())

  @@index([adminId])
  @@index([action])
  @@index([targetType])
  @@index([createdAt])
  @@map("admin_audit_log")
}
```

**AdCreative**
```prisma
model AdCreative {
  id           String   @id @default(cuid())
  title        String
  mediaUrl     String   // S3 URL
  targetRegion String[] // Array of ISO country codes
  targetGender String?  // male, female, all
  category     String?  // Stream category targeting
  cpm          Float    // Cost per thousand impressions
  frequencyCap Int      // Max impressions per user per day
  isActive     Boolean  @default(true)
  createdBy    String   // Admin user ID
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([isActive])
  @@index([createdAt])
  @@map("ad_creative")
}
```

**GeoBlock**
```prisma
model GeoBlock {
  id        String   @id @default(cuid())
  region    String   // ISO country code
  contentId String?  // Optional: specific content to block
  content   Post?    @relation(fields: [contentId], references: [id])
  reason    String?  // Legal reason
  createdBy String   // Admin user ID
  createdAt DateTime @default(now())

  @@index([region])
  @@index([contentId])
  @@map("geo_block")
}
```

#### Extended Models

**User Model Extensions** (already in schema):
```prisma
// Admin and moderation fields
role                UserRole  @default(USER)
isSuspended         Boolean   @default(false)
suspendedReason     String?   @db.Text
suspendedBy         String?   // Admin user ID
suspendedAt         DateTime?
suspensionExpiresAt DateTime? // null = permanent
adminNotes          String?   @db.Text
lastLoginAt         DateTime?
lastLoginIp         String?
```

**UserRole Enum** (already in schema):
```prisma
enum UserRole {
  USER
  CREATOR
  ADMIN              // support_admin
  SUPER_ADMIN
  MODERATOR          // NEW
  FINANCE_ADMIN      // NEW
  COMPLIANCE_OFFICER // NEW
}
```

Note: The existing schema uses ADMIN for support_admin. We'll map roles as follows:
- SUPER_ADMIN → super_admin
- MODERATOR → moderator (new enum value needed)
- ADMIN → support_admin
- FINANCE_ADMIN → finance_admin (new enum value needed)
- COMPLIANCE_OFFICER → compliance_officer (new enum value needed)

### API Response Formats

#### Paginated Response
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

#### Error Response
```typescript
interface ErrorResponse {
  error: string;
  details?: object;
}
```

#### Success Response
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
}
```

### Type Definitions

**Admin Types**:
```typescript
type AdminRole = 
  | 'super_admin' 
  | 'moderator' 
  | 'finance_admin' 
  | 'support_admin' 
  | 'compliance_officer';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

interface AdminSession {
  user: AdminUser;
  expiresAt: Date;
}

type AuditAction =
  | 'user_ban'
  | 'user_freeze'
  | 'user_unfreeze'
  | 'stream_kill'
  | 'content_remove'
  | 'withdrawal_approve'
  | 'withdrawal_reject'
  | 'application_approve'
  | 'application_reject'
  | 'role_change'
  | 'settings_update'
  | 'geo_block_create';

interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}
```

**Permission Types**:
```typescript
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: AdminRole[];
  children?: NavItem[];
  badge?: string;
}

type PermissionMatrix = Record<string, AdminRole[]>;
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Admin Authentication Round-Trip

For any valid admin credentials (email and password), authenticating via `/api/admin/auth/sign-in` then retrieving the session via `/api/admin/auth/session` should return the same user data including role.

**Validates: Requirements 1.1, 1.4**

### Property 2: Non-Admin Role Rejection

For any user with role not in [super_admin, moderator, finance_admin, support_admin, compliance_officer], attempting to authenticate to admin endpoints should return HTTP 403 Forbidden.

**Validates: Requirements 1.2**

### Property 3: Unauthenticated Request Rejection

For any admin route excluding `/api/admin/auth/*`, requests without a valid session cookie should return HTTP 401 Unauthorized.

**Validates: Requirements 2.1, 17.14, 22.15**

### Property 4: Role-Based Authorization

For any admin route and any admin role not in the route's allowed roles list (Permission_Matrix), authenticated requests should return HTTP 403 Forbidden.

**Validates: Requirements 2.4**

### Property 5: Permission Check Idempotence

For any administrative action, checking permissions multiple times before execution should produce the same authorization result as checking once.

**Validates: Requirements 2.10**

### Property 6: Audit Log Round-Trip

For any valid audit log entry, writing to AdminAuditLog then reading it back should return an entry containing all required fields (adminId, action, targetType, targetId, timestamp, metadata), and writing the same entry again should produce identical database state.

**Validates: Requirements 3.2, 3.10**

### Property 7: User Suspension State Transition

For any user, freezing the account should set isSuspended to true and record suspension details, and unfreezing should set isSuspended to false. The count of users with isSuspended=true should always equal the count returned by a suspended users filter query.

**Validates: Requirements 4.5, 4.14**

### Property 8: Creator Application Approval State Transition

For any pending creator application, approving it should atomically update application status to APPROVED, update user role to CREATOR, and create an audit log entry. Checking the user role after approval should return CREATOR. Rejecting an application should set status to REJECTED.

**Validates: Requirements 5.3, 5.17**

### Property 9: Content Moderation Idempotence

For any moderation action (dismiss, warn, remove, strike, ban), performing the action twice should produce the same final state as performing it once.

**Validates: Requirements 6.5, 6.18**

### Property 10: Hidden Content Exclusion Invariant

For any content with isHidden=true, the content should not appear in any public feed queries regardless of filter parameters.

**Validates: Requirements 6.17**

### Property 11: Report Status Count Invariant

For all reports in the system, the count of RESOLVED reports plus PENDING reports plus DISMISSED reports should equal the total report count.

**Validates: Requirements 7.16**

### Property 12: Withdrawal Approval Wallet Balance Invariant

For any withdrawal approval, the creator's wallet balance after approval should equal the balance before approval minus the withdrawal amount (amountCoins). The operation should be atomic - either all steps succeed or all fail.

**Validates: Requirements 8.8, 8.19, 29.15**

### Property 13: Coin Purchase Wallet Balance Invariant

For any coin purchase with status COMPLETED, the user's wallet balance should include the purchased coins (coins + bonusCoins).

**Validates: Requirements 8.20**

### Property 14: Ad Campaign Round-Trip

For any valid ad campaign data, creating an ad via `/api/admin/ads` then reading it back via `/api/admin/ads/:id` should return equivalent data.

**Validates: Requirements 9.4**

### Property 15: Active Ad Eligibility Invariant

For any ad with isActive=true, the ad should be eligible for serving in the ad delivery system. For any ad with isActive=false, it should not be served.

**Validates: Requirements 9.16**

### Property 16: Revenue Sum Invariant

For any analytics date range, the sum of individual user revenues should equal the total platform revenue returned by the overview endpoint.

**Validates: Requirements 10.16**

### Property 17: DAU/MAU Relationship Invariant

For any date range, Daily Active Users (DAU) should be less than or equal to Monthly Active Users (MAU).

**Validates: Requirements 10.17**

### Property 18: Geo-Block Access Denial

For any content and region, creating a geo-block then attempting to access the content from that region should return access denied.

**Validates: Requirements 11.5, 11.17**

### Property 19: Data Export Idempotence

For any user, exporting user data multiple times should produce equivalent JSON structures (same fields and values).

**Validates: Requirements 11.18**

### Property 20: Settings Update Round-Trip

For any system setting, updating the value then reading it back should return the updated value.

**Validates: Requirements 12.18**

### Property 21: Role Change Permission Reflection

For any admin user, changing their role should immediately update their permissions according to the Permission_Matrix. Subsequent requests should be authorized based on the new role.

**Validates: Requirements 12.19**

### Property 22: DataTable Row Count Invariant

For any DataTable instance, the displayed row count should match the length of the data array passed as props.

**Validates: Requirements 14.14**

### Property 23: Form Validation Error Condition

For any form with invalid data (missing required fields, invalid formats, out-of-range values), submitting the form should display validation errors without making API requests.

**Validates: Requirements 15.11**

### Property 24: Concurrent Update Transaction Safety

For any database record, concurrent updates from multiple admin users should use transactions to prevent race conditions. The final state should reflect one complete update, not a partial merge.

**Validates: Requirements 18.11**

### Property 25: Pagination Sum Metamorphic Property

For any paginated list endpoint, the sum of items across all pages should equal the totalCount value in the pagination metadata.

**Validates: Requirements 19.10**

### Property 26: Filter Composition Metamorphic Property

For any search query with multiple active filters, the result set should be a subset of the result set with fewer filters. Results should only include records matching all active filter criteria.

**Validates: Requirements 20.15**


## Error Handling

### Backend Error Handling Strategy

**Error Response Format**:
```typescript
interface ErrorResponse {
  error: string;        // Human-readable error message
  details?: object;     // Additional context (validation errors, etc.)
}
```

**HTTP Status Codes**:
- 200: Success
- 400: Bad Request (validation errors, invalid input)
- 401: Unauthorized (no session or invalid session)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error (unexpected errors)

**Error Handling Middleware**:
```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with context
  console.error('[Admin API Error]', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    adminId: req.adminUser?.id,
    timestamp: new Date().toISOString()
  });

  // Zod validation errors
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    // Handle specific Prisma errors (unique constraint, foreign key, etc.)
    return res.status(400).json({
      error: 'Database operation failed',
      details: { code: err.code }
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error'
  });
});
```

**Service Layer Error Handling**:
```typescript
// Services throw specific errors that controllers catch
class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class ValidationError extends Error {
  constructor(message: string, public details: object) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**Transaction Error Handling**:
```typescript
// All multi-step operations use Prisma transactions
async function approveWithdrawal(id: string, adminId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Get withdrawal request
      const withdrawal = await tx.creatorWithdrawalRequest.findUnique({
        where: { id },
        include: { user: { include: { coinWallet: true } } }
      });

      if (!withdrawal) {
        throw new NotFoundError('Withdrawal', id);
      }

      if (withdrawal.status !== 'PENDING') {
        throw new ValidationError('Withdrawal already processed', { status: withdrawal.status });
      }

      // 2. Check wallet balance
      const wallet = withdrawal.user.coinWallet;
      if (!wallet || wallet.balance < withdrawal.amountCoins) {
        throw new ValidationError('Insufficient balance', { 
          required: withdrawal.amountCoins, 
          available: wallet?.balance || 0 
        });
      }

      // 3. Update withdrawal status
      const updated = await tx.creatorWithdrawalRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          approvedAt: new Date()
        }
      });

      // 4. Deduct from wallet
      await tx.coinWallet.update({
        where: { userId: withdrawal.userId },
        data: {
          balance: { decrement: withdrawal.amountCoins }
        }
      });

      // 5. Create audit log
      await tx.adminAuditLog.create({
        data: {
          adminId,
          action: 'withdrawal_approve',
          targetType: 'withdrawal',
          targetId: id,
          metadata: {
            amount: withdrawal.amountCoins,
            userId: withdrawal.userId
          }
        }
      });

      return updated;
    });
  } catch (error) {
    // Transaction automatically rolled back on error
    console.error('Withdrawal approval failed:', error);
    throw error;
  }
}
```

### Frontend Error Handling Strategy

**Axios Interceptor**:
```typescript
adminClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    const status = error.response?.status;
    const message = error.response?.data?.error || 'An error occurred';

    // Handle authentication errors
    if (status === 401) {
      useAdminAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle authorization errors
    if (status === 403) {
      window.location.href = '/unauthorized';
      return Promise.reject(error);
    }

    // Handle not found errors
    if (status === 404) {
      toast.error('Resource not found');
      return Promise.reject(error);
    }

    // Handle validation errors
    if (status === 400) {
      toast.error(message);
      return Promise.reject(error);
    }

    // Handle server errors
    if (status === 500) {
      toast.error('Server error occurred. Please try again.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
```

**React Error Boundaries**:
```typescript
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-4">
            An unexpected error occurred. Please try reloading the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**TanStack Query Error Handling**:
```typescript
const { data, error, isError } = useQuery({
  queryKey: queryKeys.users.list(params),
  queryFn: () => usersApi.list(params),
  onError: (error: AxiosError<ErrorResponse>) => {
    // Error already handled by interceptor
    // Additional component-specific handling if needed
  }
});

if (isError) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Failed to load users"
      description="An error occurred while fetching user data."
      action={
        <Button onClick={() => refetch()}>
          Try Again
        </Button>
      }
    />
  );
}
```

**Mutation Error Handling**:
```typescript
const freezeMutation = useMutation({
  mutationFn: (data: FreezeUserData) => usersApi.freeze(data.id, data),
  onSuccess: () => {
    toast.success('User account frozen successfully');
    queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
  },
  onError: (error: AxiosError<ErrorResponse>) => {
    const message = error.response?.data?.error || 'Failed to freeze account';
    toast.error(message);
  }
});
```


## Testing Strategy

### Dual Testing Approach

The admin panel requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Specific user scenarios (e.g., freezing a specific user)
- Integration points between components
- Edge cases (empty lists, null values, boundary conditions)
- Error conditions (invalid input, missing data)

**Property-Based Tests**: Verify universal properties across all inputs
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants that must always be true
- Round-trip properties (serialize/deserialize, write/read)
- Idempotence properties (same action twice = same result)
- Metamorphic properties (relationships between operations)

Together, unit tests catch concrete bugs while property tests verify general correctness.

### Backend Testing

**Property-Based Testing Library**: fast-check (JavaScript/TypeScript)

**Configuration**:
- Minimum 100 iterations per property test
- Each test references its design document property
- Tag format: `Feature: admin-panel, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check';
import { describe, it, expect } from 'bun:test';

describe('Property 6: Audit Log Round-Trip', () => {
  it('should preserve all fields when writing and reading audit log entries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          adminId: fc.uuid(),
          action: fc.constantFrom('user_ban', 'user_freeze', 'stream_kill'),
          targetType: fc.constantFrom('user', 'stream', 'post'),
          targetId: fc.uuid(),
          metadata: fc.object()
        }),
        async (auditData) => {
          // Write audit log
          const created = await AuditLogService.createLog(auditData);
          
          // Read it back
          const retrieved = await AuditLogService.getLogById(created.id);
          
          // Verify all fields preserved
          expect(retrieved.adminId).toBe(auditData.adminId);
          expect(retrieved.action).toBe(auditData.action);
          expect(retrieved.targetType).toBe(auditData.targetType);
          expect(retrieved.targetId).toBe(auditData.targetId);
          expect(retrieved.metadata).toEqual(auditData.metadata);
          
          // Write again should be idempotent
          const created2 = await AuditLogService.createLog(auditData);
          expect(created2).toEqual(created);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Example Unit Test**:
```typescript
describe('UserMgmtService.freezeUser', () => {
  it('should freeze user account with reason and expiration', async () => {
    const userId = 'test-user-id';
    const reason = 'Spam violation';
    const expiresAt = new Date('2024-12-31');
    const adminId = 'admin-id';

    const result = await UserMgmtService.freezeUser(userId, reason, expiresAt, adminId);

    expect(result.isSuspended).toBe(true);
    expect(result.suspendedReason).toBe(reason);
    expect(result.suspensionExpiresAt).toEqual(expiresAt);
    expect(result.suspendedBy).toBe(adminId);
  });

  it('should throw error when user not found', async () => {
    await expect(
      UserMgmtService.freezeUser('nonexistent-id', 'reason', null, 'admin-id')
    ).rejects.toThrow('User with id nonexistent-id not found');
  });
});
```

**Test Coverage Goals**:
- Service layer: Minimum 80% code coverage
- Controllers: Test all endpoints with valid and invalid inputs
- Middleware: Test authentication and authorization logic
- Error handling: Test all error paths

### Frontend Testing

**Testing Library**: React Testing Library + Vitest

**Component Tests**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UsersPage } from './UsersPage';

describe('UsersPage', () => {
  it('should display users in table', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'USER' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'CREATOR' }
    ];

    vi.mocked(usersApi.list).mockResolvedValue({
      data: mockUsers,
      pagination: { currentPage: 1, pageSize: 20, totalCount: 2, totalPages: 1 }
    });

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should show error state when fetch fails', async () => {
    vi.mocked(usersApi.list).mockRejectedValue(new Error('Network error'));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });

  it('should filter users by role', async () => {
    render(<UsersPage />);

    const roleFilter = screen.getByLabelText('Role');
    fireEvent.change(roleFilter, { target: { value: 'CREATOR' } });

    await waitFor(() => {
      expect(usersApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'CREATOR' })
      );
    });
  });
});
```

**Permission-Based Rendering Tests**:
```typescript
describe('PermissionRoute', () => {
  it('should render children when user has required role', () => {
    useAdminAuthStore.setState({
      user: { id: '1', name: 'Admin', email: 'admin@example.com', role: 'super_admin' }
    });

    render(
      <PermissionRoute allowedRoles={['super_admin']}>
        <div>Protected Content</div>
      </PermissionRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect when user lacks required role', () => {
    useAdminAuthStore.setState({
      user: { id: '1', name: 'Moderator', email: 'mod@example.com', role: 'moderator' }
    });

    render(
      <PermissionRoute allowedRoles={['super_admin']}>
        <div>Protected Content</div>
      </PermissionRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
```

**Integration Tests**:
```typescript
describe('User Management Flow', () => {
  it('should complete full user freeze workflow', async () => {
    // 1. Navigate to users page
    render(<App />);
    fireEvent.click(screen.getByText('Users'));

    // 2. Click freeze action
    await waitFor(() => screen.getByText('John Doe'));
    const actionMenu = screen.getAllByRole('button', { name: /actions/i })[0];
    fireEvent.click(actionMenu);
    fireEvent.click(screen.getByText('Freeze Account'));

    // 3. Fill freeze dialog
    const reasonInput = screen.getByLabelText('Reason');
    fireEvent.change(reasonInput, { target: { value: 'Spam violation' } });
    fireEvent.click(screen.getByText('Confirm'));

    // 4. Verify success toast
    await waitFor(() => {
      expect(screen.getByText('User account frozen successfully')).toBeInTheDocument();
    });

    // 5. Verify API called correctly
    expect(usersApi.freeze).toHaveBeenCalledWith('1', {
      reason: 'Spam violation',
      expiresAt: null
    });
  });
});
```

### Property-Based Test Examples

**Property 12: Withdrawal Approval Wallet Balance Invariant**
```typescript
describe('Property 12: Withdrawal Approval Wallet Balance Invariant', () => {
  it('should maintain wallet balance invariant after withdrawal approval', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          initialBalance: fc.integer({ min: 1000, max: 100000 }),
          withdrawalAmount: fc.integer({ min: 100, max: 10000 })
        }),
        async ({ userId, initialBalance, withdrawalAmount }) => {
          // Setup: Create user with wallet
          await setupUserWithWallet(userId, initialBalance);
          
          // Create withdrawal request
          const withdrawal = await createWithdrawalRequest(userId, withdrawalAmount);
          
          // Approve withdrawal
          await MonetizationService.approveWithdrawal(withdrawal.id, 'admin-id');
          
          // Verify invariant: balance_after = balance_before - withdrawal_amount
          const wallet = await getWalletBalance(userId);
          expect(wallet.balance).toBe(initialBalance - withdrawalAmount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 25: Pagination Sum Metamorphic Property**
```typescript
describe('Property 25: Pagination Sum Metamorphic Property', () => {
  it('should have sum of items across pages equal totalCount', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalItems: fc.integer({ min: 1, max: 500 }),
          pageSize: fc.integer({ min: 10, max: 50 })
        }),
        async ({ totalItems, pageSize }) => {
          // Setup: Create test data
          await setupTestUsers(totalItems);
          
          // Fetch all pages
          const allItems = [];
          let currentPage = 1;
          let hasMore = true;
          
          while (hasMore) {
            const response = await UserMgmtService.listUsers({
              page: currentPage,
              pageSize
            });
            
            allItems.push(...response.data);
            hasMore = response.pagination.hasNextPage;
            currentPage++;
          }
          
          // Verify metamorphic property
          expect(allItems.length).toBe(totalItems);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```


## Security Design

### Authentication Flow

```
1. Admin navigates to admin-fe (http://localhost:5174 or admin.streamit.com)
2. No session in Zustand store → redirect to /login
3. Admin enters email + password in LoginPage
4. POST /api/admin/auth/sign-in
   ├─ Better Auth validates credentials
   ├─ Verify user.role is admin role
   ├─ Create session with HTTP-only cookie
   └─ Return session data with role
5. Frontend stores user data in Zustand
6. Redirect to /dashboard
7. On app mount: GET /api/admin/auth/session to rehydrate state
```

### Authorization Flow

```
1. Admin makes request to /api/admin/users
2. adminAuthMiddleware:
   ├─ Extract session from cookie
   ├─ Verify session with Better Auth
   ├─ Check user.role is admin role
   ├─ Attach req.adminUser
   └─ Return 401 if no session, 403 if not admin
3. requirePermission(['super_admin', 'support_admin']):
   ├─ Check req.adminUser.role in allowed roles
   └─ Return 403 if role not allowed
4. Controller executes request
5. Service performs business logic
6. Return response
```

### Role-Based Access Control (RBAC)

**Permission Matrix**:
```typescript
const PERMISSION_MATRIX: Record<string, AdminRole[]> = {
  // User Management
  'GET /api/admin/users': ['super_admin', 'support_admin', 'compliance_officer'],
  'GET /api/admin/users/:id': ['super_admin', 'support_admin', 'compliance_officer'],
  'PATCH /api/admin/users/:id/freeze': ['super_admin', 'support_admin'],
  'PATCH /api/admin/users/:id/ban': ['super_admin', 'support_admin'],
  'PATCH /api/admin/users/:id/chat-disable': ['super_admin', 'support_admin'],
  'POST /api/admin/users/:id/reset-password': ['super_admin', 'support_admin'],

  // Streamer Management
  'GET /api/admin/streamers/applications': ['super_admin', 'moderator', 'support_admin'],
  'PATCH /api/admin/streamers/applications/:id/approve': ['super_admin', 'moderator'],
  'PATCH /api/admin/streamers/applications/:id/reject': ['super_admin', 'moderator'],
  'GET /api/admin/streamers/live': ['super_admin', 'moderator'],
  'POST /api/admin/streamers/:id/kill-stream': ['super_admin', 'moderator'],
  'POST /api/admin/streamers/:id/mute': ['super_admin', 'moderator'],
  'POST /api/admin/streamers/:id/disable-chat': ['super_admin', 'moderator'],
  'POST /api/admin/streamers/:id/warn': ['super_admin', 'moderator'],
  'PATCH /api/admin/streamers/:id/suspend': ['super_admin', 'moderator'],

  // Content Moderation
  'GET /api/admin/moderation/queue': ['super_admin', 'moderator'],
  'PATCH /api/admin/moderation/:contentId/action': ['super_admin', 'moderator'],
  'GET /api/admin/moderation/shorts': ['super_admin', 'moderator'],
  'GET /api/admin/moderation/posts': ['super_admin', 'moderator'],

  // Reports
  'GET /api/admin/reports': ['super_admin', 'moderator', 'support_admin', 'compliance_officer'],
  'GET /api/admin/reports/:id': ['super_admin', 'moderator', 'support_admin', 'compliance_officer'],
  'PATCH /api/admin/reports/:id/resolve': ['super_admin', 'moderator', 'support_admin'],

  // Monetization
  'GET /api/admin/monetization/ledger': ['super_admin', 'finance_admin', 'compliance_officer'],
  'GET /api/admin/monetization/withdrawals': ['super_admin', 'finance_admin', 'compliance_officer'],
  'PATCH /api/admin/monetization/withdrawals/:id/approve': ['super_admin', 'finance_admin'],
  'PATCH /api/admin/monetization/withdrawals/:id/reject': ['super_admin', 'finance_admin'],
  'GET /api/admin/monetization/gifts': ['super_admin', 'finance_admin', 'compliance_officer'],

  // Advertisements
  'GET /api/admin/ads': ['super_admin', 'finance_admin'],
  'POST /api/admin/ads': ['super_admin', 'finance_admin'],
  'PATCH /api/admin/ads/:id': ['super_admin', 'finance_admin'],
  'DELETE /api/admin/ads/:id': ['super_admin', 'finance_admin'],

  // Analytics
  'GET /api/admin/analytics/overview': ['super_admin', 'moderator', 'finance_admin', 'compliance_officer'],
  'GET /api/admin/analytics/streamers': ['super_admin', 'finance_admin'],
  'GET /api/admin/analytics/content': ['super_admin', 'moderator'],
  'GET /api/admin/analytics/conversion': ['super_admin', 'finance_admin'],

  // Compliance
  'GET /api/admin/compliance/audit-log': ['super_admin', 'compliance_officer'],
  'POST /api/admin/compliance/geo-block': ['super_admin', 'compliance_officer'],
  'GET /api/admin/compliance/export': ['super_admin', 'compliance_officer'],
  'GET /api/admin/compliance/takedowns': ['super_admin', 'compliance_officer'],

  // Settings
  'GET /api/admin/settings': ['super_admin'],
  'PATCH /api/admin/settings': ['super_admin'],
  'GET /api/admin/settings/admins': ['super_admin'],
  'POST /api/admin/settings/admins': ['super_admin'],
  'PATCH /api/admin/settings/admins/:id/role': ['super_admin'],
  'DELETE /api/admin/settings/admins/:id': ['super_admin']
};
```

### Session Management

**Session Configuration**:
- Session duration: 24 hours
- Cookie settings:
  - httpOnly: true (prevents JavaScript access)
  - secure: true (HTTPS only in production)
  - sameSite: 'lax' (CSRF protection)
  - path: '/api/admin' (scope to admin routes)

**Session Validation**:
```typescript
export async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify admin role
    const adminRoles: AdminRole[] = [
      'super_admin',
      'moderator',
      'finance_admin',
      'support_admin',
      'compliance_officer'
    ];

    if (!adminRoles.includes(session.user.role as AdminRole)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    // Attach admin user to request
    req.adminUser = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role as AdminRole
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

### Input Validation and Sanitization

**Zod Validation Schemas**:
```typescript
// user-mgmt.schema.ts
export const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['USER', 'CREATOR', 'ADMIN', 'SUPER_ADMIN']).optional(),
  isSuspended: z.coerce.boolean().optional(),
  createdAtFrom: z.coerce.date().optional(),
  createdAtTo: z.coerce.date().optional()
});

export const freezeUserSchema = z.object({
  reason: z.string().min(1).max(500),
  expiresAt: z.coerce.date().optional()
});

export const banUserSchema = z.object({
  reason: z.string().min(1).max(500)
});
```

**SQL Injection Prevention**:
- All database queries use Prisma ORM with parameterized queries
- No raw SQL queries without proper escaping
- Input validation before database operations

**XSS Prevention**:
- React automatically escapes rendered content
- Sanitize user-generated content before display
- Use Content Security Policy headers

### CORS Configuration

**Backend CORS Setup**:
```typescript
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.ADMIN_FRONTEND_URL,  // http://localhost:5174 or https://admin.streamit.com
      process.env.FRONTEND_URL          // User frontend (for shared resources)
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
```

### Rate Limiting

**API Rate Limiting**:
```typescript
import rateLimit from 'express-rate-limit';

const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for super_admin in development
    return process.env.NODE_ENV === 'development' && req.adminUser?.role === 'super_admin';
  }
});

app.use('/api/admin', adminRateLimiter);
```

**Authentication Rate Limiting**:
```typescript
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true
});

app.post('/api/admin/auth/sign-in', authRateLimiter, ...);
```

### Audit Logging for Security

All security-relevant events are logged:
- Failed authentication attempts (email, IP, timestamp)
- Failed authorization attempts (admin ID, route, timestamp)
- Successful admin actions (admin ID, action, target, timestamp)
- Role changes (admin ID, target user, old role, new role, timestamp)
- Settings changes (admin ID, setting key, old value, new value, timestamp)

```typescript
// Log failed authentication
console.error('[Admin Auth Failed]', {
  email: req.body.email,
  ip: req.ip,
  timestamp: new Date().toISOString()
});

// Log failed authorization
console.warn('[Admin Authorization Failed]', {
  adminId: req.adminUser.id,
  route: req.path,
  method: req.method,
  requiredRoles: allowedRoles,
  actualRole: req.adminUser.role,
  timestamp: new Date().toISOString()
});
```


## API Endpoint Specifications

### Authentication Endpoints

**POST /api/admin/auth/sign-in**
```
Purpose: Authenticate admin user
Request Body:
  {
    email: string,
    password: string
  }
Response: 200 OK
  {
    user: {
      id: string,
      name: string,
      email: string,
      role: AdminRole
    },
    session: {
      expiresAt: string (ISO date)
    }
  }
Errors:
  401: Invalid credentials
  403: User is not an admin
```

**POST /api/admin/auth/sign-out**
```
Purpose: Invalidate admin session
Response: 200 OK
  { success: true }
```

**GET /api/admin/auth/session**
```
Purpose: Get current admin session
Response: 200 OK
  {
    user: {
      id: string,
      name: string,
      email: string,
      role: AdminRole
    }
  }
Errors:
  401: No valid session
```

### User Management Endpoints

**GET /api/admin/users**
```
Purpose: List users with pagination and filters
Query Parameters:
  page?: number (default: 1)
  pageSize?: number (default: 20, max: 100)
  search?: string (searches name, email, username)
  role?: UserRole
  isSuspended?: boolean
  createdAtFrom?: string (ISO date)
  createdAtTo?: string (ISO date)
Response: 200 OK
  {
    data: User[],
    pagination: PaginationMetadata
  }
```

**GET /api/admin/users/:id**
```
Purpose: Get user details
Response: 200 OK
  {
    user: User,
    wallet: CoinWallet,
    banHistory: AdminAuditLog[],
    lastLogin: { at: string, ip: string }
  }
Errors:
  404: User not found
```

**PATCH /api/admin/users/:id/freeze**
```
Purpose: Freeze/unfreeze user account
Request Body:
  {
    frozen: boolean,
    reason?: string,
    expiresAt?: string (ISO date)
  }
Response: 200 OK
  { user: User }
Errors:
  404: User not found
  400: Invalid request data
```

**PATCH /api/admin/users/:id/ban**
```
Purpose: Permanently ban user
Request Body:
  {
    reason: string
  }
Response: 200 OK
  { user: User }
Errors:
  404: User not found
```

**PATCH /api/admin/users/:id/chat-disable**
```
Purpose: Disable chat for 24 hours
Response: 200 OK
  { user: User }
Errors:
  404: User not found
```

**POST /api/admin/users/:id/reset-password**
```
Purpose: Generate password reset token
Response: 200 OK
  { success: true, message: 'Password reset email sent' }
Errors:
  404: User not found
```

### Streamer Management Endpoints

**GET /api/admin/streamers/applications**
```
Purpose: List creator applications
Query Parameters:
  page?: number
  pageSize?: number
  status?: ApplicationStatus
  submittedAtFrom?: string (ISO date)
  submittedAtTo?: string (ISO date)
Response: 200 OK
  {
    data: CreatorApplication[],
    pagination: PaginationMetadata
  }
```

**GET /api/admin/streamers/applications/:id**
```
Purpose: Get application details
Response: 200 OK
  {
    application: CreatorApplication,
    identity: IdentityVerification,
    financial: FinancialDetails,
    profile: CreatorProfile
  }
Errors:
  404: Application not found
```

**PATCH /api/admin/streamers/applications/:id/approve**
```
Purpose: Approve creator application
Response: 200 OK
  { application: CreatorApplication }
Errors:
  404: Application not found
  400: Application already processed
```

**PATCH /api/admin/streamers/applications/:id/reject**
```
Purpose: Reject creator application
Request Body:
  {
    reason: string
  }
Response: 200 OK
  { application: CreatorApplication }
Errors:
  404: Application not found
  400: Application already processed
```

**GET /api/admin/streamers/live**
```
Purpose: Get currently live streams
Response: 200 OK
  {
    streams: Array<{
      id: string,
      title: string,
      streamer: { id: string, name: string, username: string },
      viewerCount: number,
      duration: number (seconds),
      category: string,
      thumbnail: string,
      startedAt: string (ISO date)
    }>
  }
```

**POST /api/admin/streamers/:id/kill-stream**
```
Purpose: Terminate live stream
Response: 200 OK
  { success: true }
Errors:
  404: Stream not found
  400: Stream not live
```

**POST /api/admin/streamers/:id/mute**
```
Purpose: Mute streamer audio
Response: 200 OK
  { success: true }
Errors:
  404: Stream not found
```

**POST /api/admin/streamers/:id/disable-chat**
```
Purpose: Disable stream chat
Response: 200 OK
  { success: true }
Errors:
  404: Stream not found
```

**POST /api/admin/streamers/:id/warn**
```
Purpose: Send warning to streamer
Request Body:
  {
    message: string
  }
Response: 200 OK
  { success: true }
Errors:
  404: Stream not found
```

**PATCH /api/admin/streamers/:id/suspend**
```
Purpose: Suspend streamer account
Request Body:
  {
    reason: string,
    expiresAt?: string (ISO date)
  }
Response: 200 OK
  { user: User }
Errors:
  404: User not found
```

### Content Moderation Endpoints

**GET /api/admin/moderation/queue**
```
Purpose: Get flagged content queue
Query Parameters:
  page?: number
  pageSize?: number
  type?: 'post' | 'short' | 'stream'
  category?: ContentCategory
  flagCountMin?: number
  createdAtFrom?: string (ISO date)
  createdAtTo?: string (ISO date)
Response: 200 OK
  {
    data: Array<{
      id: string,
      type: string,
      content: Post | Stream,
      author: User,
      flagCount: number,
      flagReasons: string[],
      createdAt: string
    }>,
    pagination: PaginationMetadata
  }
```

**GET /api/admin/moderation/:contentId**
```
Purpose: Get content details for moderation
Query Parameters:
  type: 'post' | 'short' | 'stream'
Response: 200 OK
  {
    content: Post | Stream,
    author: User,
    flags: Array<{ reason: string, reporterId: string, createdAt: string }>,
    flagCount: number
  }
Errors:
  404: Content not found
```

**PATCH /api/admin/moderation/:contentId/action**
```
Purpose: Take moderation action
Request Body:
  {
    action: 'dismiss' | 'warn' | 'remove' | 'strike' | 'ban',
    reason?: string,
    type: 'post' | 'short' | 'stream'
  }
Response: 200 OK
  { success: true }
Errors:
  404: Content not found
  400: Invalid action
```

**GET /api/admin/moderation/shorts**
```
Purpose: Get shorts for moderation
Query Parameters: (same as /queue)
Response: 200 OK (same format as /queue)
```

**GET /api/admin/moderation/posts**
```
Purpose: Get posts for moderation
Query Parameters: (same as /queue)
Response: 200 OK (same format as /queue)
```

### Reports Endpoints

**GET /api/admin/reports**
```
Purpose: List user reports
Query Parameters:
  page?: number
  pageSize?: number
  reason?: ReportReason
  status?: ReportStatus
  reporterId?: string
  reportedUserId?: string
  createdAtFrom?: string (ISO date)
  createdAtTo?: string (ISO date)
Response: 200 OK
  {
    data: Report[],
    pagination: PaginationMetadata
  }
```

**GET /api/admin/reports/:id**
```
Purpose: Get report details
Response: 200 OK
  {
    report: Report,
    reporter: User,
    reportedUser: User,
    content: Post | Comment | null,
    reporterHistory: Report[],
    reportedUserHistory: Report[]
  }
Errors:
  404: Report not found
```

**PATCH /api/admin/reports/:id/resolve**
```
Purpose: Resolve report
Request Body:
  {
    action: 'dismiss' | 'warning_sent' | 'content_removed' | 'user_suspended' | 'user_banned',
    notes?: string
  }
Response: 200 OK
  { report: Report }
Errors:
  404: Report not found
  400: Report already resolved
```

**GET /api/admin/reports/audit-log**
```
Purpose: Get report resolution history
Query Parameters:
  page?: number
  pageSize?: number
Response: 200 OK
  {
    data: Array<{
      report: Report,
      resolvedBy: User,
      action: string,
      notes: string,
      resolvedAt: string
    }>,
    pagination: PaginationMetadata
  }
```

### Monetization Endpoints

**GET /api/admin/monetization/ledger**
```
Purpose: Get coin purchase ledger
Query Parameters:
  page?: number
  pageSize?: number
  userId?: string
  status?: PurchaseStatus
  amountMin?: number
  amountMax?: number
  createdAtFrom?: string (ISO date)
  createdAtTo?: string (ISO date)
  paymentGateway?: string
Response: 200 OK
  {
    data: Array<{
      id: string,
      user: { id: string, name: string, email: string },
      package: { name: string, coins: number, bonusCoins: number },
      amount: number,
      currency: string,
      status: PurchaseStatus,
      transactionId: string,
      createdAt: string
    }>,
    pagination: PaginationMetadata
  }
```

**GET /api/admin/monetization/withdrawals**
```
Purpose: Get withdrawal requests
Query Parameters:
  page?: number
  pageSize?: number
  status?: WithdrawalStatus
  userId?: string
  amountMin?: number
  amountMax?: number
  requestedAtFrom?: string (ISO date)
  requestedAtTo?: string (ISO date)
Response: 200 OK
  {
    data: Array<{
      id: string,
      user: { id: string, name: string, email: string },
      amountCoins: number,
      netAmountPaise: number,
      status: WithdrawalStatus,
      requestedAt: string,
      reviewedAt?: string,
      reviewedBy?: { id: string, name: string }
    }>,
    pagination: PaginationMetadata
  }
```

**PATCH /api/admin/monetization/withdrawals/:id/approve**
```
Purpose: Approve withdrawal request
Response: 200 OK
  { withdrawal: CreatorWithdrawalRequest }
Errors:
  404: Withdrawal not found
  400: Withdrawal already processed or insufficient balance
```

**PATCH /api/admin/monetization/withdrawals/:id/reject**
```
Purpose: Reject withdrawal request
Request Body:
  {
    reason: string
  }
Response: 200 OK
  { withdrawal: CreatorWithdrawalRequest }
Errors:
  404: Withdrawal not found
  400: Withdrawal already processed
```

**GET /api/admin/monetization/gifts**
```
Purpose: Get gift transaction history
Query Parameters:
  page?: number
  pageSize?: number
  senderId?: string
  receiverId?: string
  streamId?: string
  createdAtFrom?: string (ISO date)
  createdAtTo?: string (ISO date)
Response: 200 OK
  {
    data: Array<{
      id: string,
      sender: { id: string, name: string },
      receiver: { id: string, name: string },
      gift: { name: string, imageUrl: string },
      coinAmount: number,
      quantity: number,
      stream?: { id: string, title: string },
      createdAt: string
    }>,
    pagination: PaginationMetadata
  }
```

**GET /api/admin/monetization/wallets/:userId**
```
Purpose: Get wallet details
Response: 200 OK
  {
    wallet: CoinWallet,
    recentTransactions: Array<{
      type: 'purchase' | 'gift_sent' | 'gift_received' | 'withdrawal',
      amount: number,
      description: string,
      createdAt: string
    }>
  }
Errors:
  404: User or wallet not found
```


### Advertisement Endpoints

**GET /api/admin/ads**
```
Purpose: List ad campaigns
Query Parameters:
  page?: number
  pageSize?: number
  isActive?: boolean
  targetRegion?: string
  category?: string
  createdAtFrom?: string (ISO date)
  createdAtTo?: string (ISO date)
Response: 200 OK
  {
    data: AdCreative[],
    pagination: PaginationMetadata
  }
```

**POST /api/admin/ads**
```
Purpose: Create ad campaign
Request Body:
  {
    title: string,
    mediaUrl: string (S3 URL),
    targetRegion: string[],
    targetGender?: string,
    category?: string,
    cpm: number,
    frequencyCap: number,
    isActive: boolean
  }
Response: 201 Created
  { ad: AdCreative }
Errors:
  400: Invalid ad data
```

**PATCH /api/admin/ads/:id**
```
Purpose: Update ad campaign
Request Body: (same as POST, all fields optional)
Response: 200 OK
  { ad: AdCreative }
Errors:
  404: Ad not found
  400: Invalid ad data
```

**DELETE /api/admin/ads/:id**
```
Purpose: Deactivate ad campaign
Response: 200 OK
  { success: true }
Errors:
  404: Ad not found
```

**GET /api/admin/ads/:id/performance**
```
Purpose: Get ad performance metrics
Response: 200 OK
  {
    impressions: number,
    clicks: number,
    ctr: number,
    totalSpend: number,
    averageCpm: number
  }
Errors:
  404: Ad not found
```


### Analytics Endpoints

**GET /api/admin/analytics/overview**
```
Purpose: Get platform overview metrics
Query Parameters:
  dateRange: 'today' | '7days' | '30days' | '90days' | 'custom'
  startDate?: string (ISO date, required if dateRange=custom)
  endDate?: string (ISO date, required if dateRange=custom)
Response: 200 OK
  {
    dau: number,
    mau: number,
    concurrentViewers: number,
    totalRevenue: number,
    conversionRate: number,
    trends: {
      dau: Array<{ date: string, value: number }>,
      mau: Array<{ date: string, value: number }>
    }
  }
```

**GET /api/admin/analytics/streamers**
```
Purpose: Get top streamers by revenue
Query Parameters:
  dateRange: string
  startDate?: string
  endDate?: string
  limit?: number (default: 10)
Response: 200 OK
  {
    streamers: Array<{
      id: string,
      name: string,
      username: string,
      totalRevenue: number,
      giftCount: number,
      averageViewers: number,
      streamHours: number
    }>
  }
```

**GET /api/admin/analytics/content**
```
Purpose: Get top performing content
Query Parameters:
  dateRange: string
  startDate?: string
  endDate?: string
  type: 'shorts' | 'posts' | 'streams'
  limit?: number (default: 10)
Response: 200 OK
  {
    content: Array<{
      id: string,
      title: string,
      author: { id: string, name: string },
      views: number,
      likes: number,
      engagement: number,
      createdAt: string
    }>
  }
```

**GET /api/admin/analytics/conversion**
```
Purpose: Get conversion funnel data
Query Parameters:
  dateRange: string
  startDate?: string
  endDate?: string
Response: 200 OK
  {
    totalViewers: number,
    giftBuyers: number,
    averageGiftValue: number,
    conversionPercentage: number,
    funnel: Array<{
      stage: string,
      count: number,
      percentage: number
    }>
  }
```

### Compliance Endpoints

**GET /api/admin/compliance/audit-log**
```
Purpose: Get admin action audit log
Query Parameters:
  page?: number
  pageSize?: number
  adminId?: string
  action?: AuditAction
  targetType?: string
  createdAtFrom?: string (ISO date)
  createdAtTo?: string (ISO date)
Response: 200 OK
  {
    data: Array<{
      id: string,
      admin: { id: string, name: string, email: string },
      action: AuditAction,
      targetType: string,
      targetId: string,
      metadata: object,
      createdAt: string
    }>,
    pagination: PaginationMetadata
  }
```

**POST /api/admin/compliance/geo-block**
```
Purpose: Create geo-block
Request Body:
  {
    region: string (ISO country code),
    contentId?: string,
    reason?: string
  }
Response: 201 Created
  { geoBlock: GeoBlock }
Errors:
  400: Invalid region code
```

**GET /api/admin/compliance/export**
```
Purpose: Export user data (GDPR/IT Rules)
Query Parameters:
  userId: string
Response: 200 OK (JSON file download)
  {
    user: User,
    posts: Post[],
    comments: Comment[],
    transactions: CoinPurchase[],
    streams: Stream[]
  }
Errors:
  404: User not found
```

**GET /api/admin/compliance/takedowns**
```
Purpose: Get legally removed content
Query Parameters:
  page?: number
  pageSize?: number
Response: 200 OK
  {
    data: Array<{
      id: string,
      type: string,
      content: Post | Stream,
      author: User,
      hiddenReason: string,
      hiddenBy: User,
      hiddenAt: string
    }>,
    pagination: PaginationMetadata
  }
```

### Settings Endpoints

**GET /api/admin/settings**
```
Purpose: Get all system settings
Response: 200 OK
  {
    settings: Array<{
      key: string,
      value: string,
      description: string,
      category: string
    }>
  }
```

**PATCH /api/admin/settings**
```
Purpose: Update system settings
Request Body:
  {
    settings: Array<{
      key: string,
      value: string
    }>
  }
Response: 200 OK
  { success: true }
Errors:
  400: Invalid setting key or value
```

**GET /api/admin/settings/admins**
```
Purpose: List admin users
Response: 200 OK
  {
    admins: Array<{
      id: string,
      name: string,
      email: string,
      role: AdminRole,
      createdAt: string
    }>
  }
```

**POST /api/admin/settings/admins**
```
Purpose: Create admin user
Request Body:
  {
    name: string,
    email: string,
    password: string,
    role: AdminRole
  }
Response: 201 Created
  { admin: User }
Errors:
  400: Invalid data or email already exists
```

**PATCH /api/admin/settings/admins/:id/role**
```
Purpose: Change admin role
Request Body:
  {
    role: AdminRole
  }
Response: 200 OK
  { admin: User }
Errors:
  404: Admin not found
  400: Invalid role
```

**DELETE /api/admin/settings/admins/:id**
```
Purpose: Remove admin access
Response: 200 OK
  { success: true }
Errors:
  404: Admin not found
  400: Cannot delete own account
```


## Integration Points

### Better Auth Integration

The admin panel uses the existing Better Auth system for authentication. No separate auth service is needed.

**Integration Pattern**:
```typescript
// backend/src/lib/auth.ts (existing)
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  database: prisma,
  // ... existing config
});

// Admin middleware uses the same auth instance
import { auth } from '../lib/auth';

export async function adminAuthMiddleware(req, res, next) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers)
  });
  // ... verify admin role
}
```

**Session Sharing**:
- Admin and user sessions use the same Better Auth instance
- Sessions are differentiated by user role
- Admin sessions have same expiration and security settings
- HTTP-only cookies prevent JavaScript access

### Prisma Database Integration

All database operations use the existing Prisma client.

**Integration Pattern**:
```typescript
// backend/src/lib/db.ts (existing)
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Admin services import the same client
import { prisma } from '../lib/db';

export class UserMgmtService {
  static async listUsers(params) {
    return prisma.user.findMany({
      where: { /* filters */ },
      // ... query
    });
  }
}
```

**Transaction Support**:
```typescript
// Multi-step operations use Prisma transactions
await prisma.$transaction(async (tx) => {
  // All operations use tx instead of prisma
  await tx.user.update({ /* ... */ });
  await tx.coinWallet.update({ /* ... */ });
  await tx.adminAuditLog.create({ /* ... */ });
});
```

### LiveKit Integration

For stream control operations (kill stream, mute, disable chat).

**Integration Pattern**:
```typescript
import { RoomServiceClient } from 'livekit-server-sdk';

const livekitClient = new RoomServiceClient(
  process.env.LIVEKIT_API_URL,
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

export class StreamerMgmtService {
  static async killStream(streamId: string, adminId: string) {
    // Get stream details
    const stream = await prisma.stream.findUnique({
      where: { id: streamId }
    });

    if (!stream || !stream.isLive) {
      throw new Error('Stream not found or not live');
    }

    // Terminate LiveKit room
    await livekitClient.deleteRoom(stream.id);

    // Update database
    await prisma.stream.update({
      where: { id: streamId },
      data: { isLive: false }
    });

    // Create audit log
    await AuditLogService.createLog({
      adminId,
      action: 'stream_kill',
      targetType: 'stream',
      targetId: streamId
    });
  }

  static async muteStreamer(streamId: string, adminId: string) {
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { user: true }
    });

    // Mute participant in LiveKit room
    await livekitClient.mutePublishedTrack(
      stream.id,
      stream.user.id,
      'audio'
    );

    // Create audit log
    await AuditLogService.createLog({
      adminId,
      action: 'stream_mute',
      targetType: 'stream',
      targetId: streamId
    });
  }
}
```

### AWS S3 Integration

For ad creative uploads.

**Integration Pattern**:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export class AdsService {
  static async getUploadUrl(fileName: string, contentType: string) {
    const key = `ads/${Date.now()}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600 // 1 hour
    });

    return {
      uploadUrl,
      fileUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    };
  }

  static async createAd(data: CreateAdData, adminId: string) {
    // Assume media already uploaded to S3 via presigned URL
    const ad = await prisma.adCreative.create({
      data: {
        ...data,
        createdBy: adminId
      }
    });

    await AuditLogService.createLog({
      adminId,
      action: 'ad_create',
      targetType: 'ad',
      targetId: ad.id
    });

    return ad;
  }
}
```

**Frontend Upload Flow**:
```typescript
// 1. Request presigned URL
const { uploadUrl, fileUrl } = await adsApi.getUploadUrl(file.name, file.type);

// 2. Upload directly to S3
await axios.put(uploadUrl, file, {
  headers: { 'Content-Type': file.type }
});

// 3. Create ad with S3 URL
await adsApi.create({
  title,
  mediaUrl: fileUrl,
  // ... other fields
});
```


## Data Flow Diagrams

### Authentication Flow

```
┌─────────────┐
│ Admin User  │
└──────┬──────┘
       │ 1. Navigate to admin-fe
       ▼
┌─────────────────────┐
│   LoginPage         │
│  (email + password) │
└──────┬──────────────┘
       │ 2. POST /api/admin/auth/sign-in
       ▼
┌─────────────────────────────────────┐
│  adminAuthController.signIn         │
│  ├─ Validate input (Zod)            │
│  ├─ Call Better Auth sign-in        │
│  ├─ Verify user.role is admin       │
│  ├─ Create session (HTTP-only)      │
│  └─ Return session + user data      │
└──────┬──────────────────────────────┘
       │ 3. Session cookie set
       ▼
┌─────────────────────┐
│  adminAuthStore     │
│  ├─ Store user data │
│  └─ Set isAuth=true │
└──────┬──────────────┘
       │ 4. Redirect to /dashboard
       ▼
┌─────────────────────┐
│  DashboardPage      │
│  (authenticated)    │
└─────────────────────┘
```

### Authorization Flow

```
┌─────────────┐
│ Admin User  │
└──────┬──────┘
       │ 1. Request /api/admin/users
       ▼
┌──────────────────────────────────┐
│  adminAuthMiddleware             │
│  ├─ Extract session from cookie  │
│  ├─ Verify with Better Auth      │
│  ├─ Check role is admin          │
│  ├─ Attach req.adminUser         │
│  └─ Return 401/403 if invalid    │
└──────┬───────────────────────────┘
       │ 2. Session valid
       ▼
┌──────────────────────────────────┐
│  requirePermission middleware    │
│  ├─ Check role in allowed list   │
│  └─ Return 403 if not allowed    │
└──────┬───────────────────────────┘
       │ 3. Permission granted
       ▼
┌──────────────────────────────────┐
│  UserMgmtController.listUsers    │
│  ├─ Validate query params        │
│  ├─ Call service                 │
│  └─ Return response              │
└──────┬───────────────────────────┘
       │ 4. Call service
       ▼
┌──────────────────────────────────┐
│  UserMgmtService.listUsers       │
│  ├─ Build Prisma query           │
│  ├─ Apply filters                │
│  ├─ Execute query                │
│  └─ Return paginated data        │
└──────┬───────────────────────────┘
       │ 5. Return data
       ▼
┌─────────────┐
│ Admin User  │
└─────────────┘
```

### Withdrawal Approval Flow

```
┌─────────────┐
│Finance Admin│
└──────┬──────┘
       │ 1. Click "Approve" on withdrawal
       ▼
┌──────────────────────────────────┐
│  ConfirmDialog                   │
│  (shows withdrawal details)      │
└──────┬───────────────────────────┘
       │ 2. Confirm
       ▼
┌──────────────────────────────────┐
│  PATCH /api/admin/monetization/  │
│        withdrawals/:id/approve   │
└──────┬───────────────────────────┘
       │ 3. Request
       ▼
┌──────────────────────────────────────────┐
│  MonetizationController.approveWithdrawal│
│  ├─ Validate request                     │
│  └─ Call service                         │
└──────┬───────────────────────────────────┘
       │ 4. Call service
       ▼
┌──────────────────────────────────────────┐
│  MonetizationService.approveWithdrawal   │
│  ├─ Start transaction                    │
│  │  ├─ Get withdrawal request            │
│  │  ├─ Verify status = PENDING           │
│  │  ├─ Check wallet balance              │
│  │  ├─ Update withdrawal status          │
│  │  ├─ Deduct from wallet                │
│  │  └─ Create audit log                  │
│  └─ Commit or rollback                   │
└──────┬───────────────────────────────────┘
       │ 5. Success
       ▼
┌──────────────────────────────────┐
│  Frontend                        │
│  ├─ Show success toast           │
│  ├─ Invalidate queries           │
│  └─ Refresh withdrawal list      │
└──────────────────────────────────┘
```

### Content Moderation Flow

```
┌─────────────┐
│  Moderator  │
└──────┬──────┘
       │ 1. View moderation queue
       ▼
┌──────────────────────────────────┐
│  GET /api/admin/moderation/queue │
└──────┬───────────────────────────┘
       │ 2. Returns flagged content
       ▼
┌──────────────────────────────────┐
│  ModerationQueuePage             │
│  ├─ Display content cards        │
│  └─ Show flag count & reasons    │
└──────┬───────────────────────────┘
       │ 3. Click content to review
       ▼
┌──────────────────────────────────┐
│  ContentDetailModal              │
│  ├─ Show content preview         │
│  ├─ Show flag details            │
│  └─ Action buttons               │
└──────┬───────────────────────────┘
       │ 4. Select action (e.g., "Remove")
       ▼
┌──────────────────────────────────┐
│  ConfirmDialog                   │
│  (confirm removal)               │
└──────┬───────────────────────────┘
       │ 5. Confirm
       ▼
┌──────────────────────────────────┐
│  PATCH /api/admin/moderation/    │
│        :contentId/action         │
│  Body: { action: 'remove',       │
│          reason: '...' }         │
└──────┬───────────────────────────┘
       │ 6. Request
       ▼
┌──────────────────────────────────┐
│  ContentModService.removeContent │
│  ├─ Get content                  │
│  ├─ Set isHidden = true          │
│  ├─ Record hiddenReason          │
│  ├─ Record hiddenBy              │
│  └─ Create audit log             │
└──────┬───────────────────────────┘
       │ 7. Success
       ▼
┌──────────────────────────────────┐
│  Frontend                        │
│  ├─ Show success toast           │
│  ├─ Remove from queue            │
│  └─ Refresh queue                │
└──────────────────────────────────┘
```

### Real-Time Polling Flow

```
┌─────────────┐
│  Moderator  │
└──────┬──────┘
       │ 1. Navigate to Live Monitor
       ▼
┌──────────────────────────────────┐
│  LiveMonitorPage                 │
│  ├─ useQuery with refetchInterval│
│  └─ Poll every 10 seconds        │
└──────┬───────────────────────────┘
       │ 2. Initial fetch
       ▼
┌──────────────────────────────────┐
│  GET /api/admin/streamers/live   │
└──────┬───────────────────────────┘
       │ 3. Returns live streams
       ▼
┌──────────────────────────────────┐
│  Display stream cards            │
│  ├─ Thumbnail                    │
│  ├─ Viewer count badge           │
│  └─ Action menu                  │
└──────┬───────────────────────────┘
       │ 4. Wait 10 seconds
       ▼
┌──────────────────────────────────┐
│  TanStack Query refetch          │
│  (automatic background refresh)  │
└──────┬───────────────────────────┘
       │ 5. Fetch updated data
       ▼
┌──────────────────────────────────┐
│  GET /api/admin/streamers/live   │
└──────┬───────────────────────────┘
       │ 6. Returns updated streams
       ▼
┌──────────────────────────────────┐
│  Update UI                       │
│  ├─ Add new streams              │
│  ├─ Remove ended streams         │
│  └─ Update viewer counts         │
└──────────────────────────────────┘
       │
       │ (Repeat every 10 seconds)
       ▼
```


## Performance Considerations

### Backend Optimization

**Database Query Optimization**:
```typescript
// Use Prisma select to fetch only required fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    isSuspended: true,
    createdAt: true
    // Don't fetch unnecessary fields like bio, phone, etc.
  },
  where: filters,
  take: pageSize,
  skip: (page - 1) * pageSize
});

// Use indexes for frequently queried fields
// Already defined in schema:
// @@index([role])
// @@index([isSuspended])
// @@index([email])
// @@index([username])
```

**Pagination**:
```typescript
// Always paginate list queries
// Default page size: 20, max: 100
const pageSize = Math.min(params.pageSize || 20, 100);
const page = Math.max(params.page || 1, 1);

// Use cursor-based pagination for large datasets
const users = await prisma.user.findMany({
  take: pageSize,
  skip: (page - 1) * pageSize,
  cursor: params.cursor ? { id: params.cursor } : undefined
});
```

**Caching Strategy**:
```typescript
// Cache expensive analytics queries
import NodeCache from 'node-cache';

const analyticsCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60
});

export class AnalyticsService {
  static async getOverview(dateRange: string) {
    const cacheKey = `overview:${dateRange}`;
    
    // Check cache first
    const cached = analyticsCache.get(cacheKey);
    if (cached) return cached;
    
    // Compute if not cached
    const data = await computeOverview(dateRange);
    
    // Store in cache
    analyticsCache.set(cacheKey, data);
    
    return data;
  }
}
```

**Connection Pooling**:
```typescript
// Prisma automatically handles connection pooling
// Configure in DATABASE_URL:
// postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

### Frontend Optimization

**Code Splitting**:
```typescript
// Lazy load all page components
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));
const StreamersPage = lazy(() => import('@/pages/streamers/StreamersPage'));
const ModerationPage = lazy(() => import('@/pages/moderation/ModerationQueuePage'));
// ... all pages

// Wrap in Suspense
<Suspense fallback={<PageSkeleton />}>
  <Outlet />
</Suspense>
```

**TanStack Query Caching**:
```typescript
// Configure appropriate staleTime values
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes for static data
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Use shorter staleTime for dynamic data
useQuery({
  queryKey: queryKeys.streamers.live,
  queryFn: streamersApi.getLive,
  staleTime: 30 * 1000, // 30 seconds
  refetchInterval: 10 * 1000 // Poll every 10 seconds
});
```

**Prefetching**:
```typescript
// Prefetch likely next navigation
const queryClient = useQueryClient();

const handleUserRowHover = (userId: string) => {
  // Prefetch user details on hover
  queryClient.prefetchQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => usersApi.getById(userId)
  });
};
```

**Virtual Scrolling**:
```typescript
// Use virtual scrolling for large lists (>100 items)
import { useVirtualizer } from '@tanstack/react-virtual';

function LargeUserList({ users }: { users: User[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Row height
    overscan: 5
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <UserRow user={users[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Image Optimization**:
```typescript
// Lazy load images
<img
  src={user.image}
  alt={user.name}
  loading="lazy"
  className="w-10 h-10 rounded-full"
/>

// Use appropriate image formats
// - WebP for photos
// - SVG for icons
// - Optimize sizes (thumbnails vs full size)
```

**Bundle Size Optimization**:
```typescript
// Tree-shake unused code
// Vite automatically does this

// Analyze bundle size
// bun run build --analyze

// Import only what you need
import { Button } from '@/components/ui/button';
// Not: import * as UI from '@/components/ui';
```

### Performance Targets

**Backend**:
- List queries: < 500ms for datasets under 10,000 records
- Detail queries: < 200ms
- Mutations: < 1000ms (including transaction commit)
- Analytics queries: < 2000ms (with caching)

**Frontend**:
- Initial page load: < 2 seconds
- Route navigation: < 500ms
- User interaction feedback: < 200ms
- Data table rendering: < 300ms for 100 rows

**Monitoring**:
```typescript
// Log slow queries
const startTime = Date.now();
const result = await prisma.user.findMany({ /* ... */ });
const duration = Date.now() - startTime;

if (duration > 500) {
  console.warn('[Slow Query]', {
    operation: 'user.findMany',
    duration,
    filters: params
  });
}
```


## Deployment Strategy

### Environment Configuration

**Backend Environment Variables**:
```env
# Existing variables (unchanged)
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
AWS_S3_BUCKET="..."
LIVEKIT_API_URL="..."
LIVEKIT_API_KEY="..."
LIVEKIT_API_SECRET="..."

# New admin-specific variables
ADMIN_FRONTEND_URL="http://localhost:5174"  # Dev
# ADMIN_FRONTEND_URL="https://admin.streamit.com"  # Production
```

**Frontend Environment Variables**:
```env
# admin-fe/.env
VITE_API_URL="http://localhost:3000"  # Dev
# VITE_API_URL="https://api.streamit.com"  # Production
```

### Backend Deployment

The admin backend is part of the existing Express application, so it uses the same deployment process.

**Deployment Steps**:
1. Run database migrations: `bun run db:migrate:deploy`
2. Build TypeScript: `bun run build`
3. Start server: `bun run start`

**No separate server needed** - admin routes are registered in the existing Express app.

**Production Considerations**:
- Ensure ADMIN_FRONTEND_URL is set to production admin domain
- Update CORS configuration to include admin domain
- Enable HTTPS (secure cookies)
- Configure rate limiting
- Set up monitoring and logging
- Use production database with connection pooling

### Frontend Deployment

The admin frontend is a standalone Vite application that can be deployed separately.

**Build Process**:
```bash
cd admin-fe
bun install
bun run build
# Output: dist/ directory with static files
```

**Deployment Options**:

**1. Vercel**:
```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
cd admin-fe
vercel --prod
```

**2. Netlify**:
```bash
# Install Netlify CLI
bun add -g netlify-cli

# Deploy
cd admin-fe
netlify deploy --prod --dir=dist
```

**3. AWS S3 + CloudFront**:
```bash
# Build
bun run build

# Upload to S3
aws s3 sync dist/ s3://admin-streamit-bucket --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/*"
```

**4. Nginx**:
```nginx
server {
    listen 443 ssl http2;
    server_name admin.streamit.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/admin-fe/dist;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.streamit.com;" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**5. Docker**:
```dockerfile
# admin-fe/Dockerfile
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t admin-fe .
docker run -p 80:80 admin-fe
```

### Production Security

**IP Allowlisting** (Nginx):
```nginx
# Restrict admin panel to office/VPN IPs
geo $admin_allowed {
    default 0;
    10.0.0.0/8 1;        # Internal network
    203.0.113.0/24 1;    # Office IP range
}

server {
    # ... other config

    location / {
        if ($admin_allowed = 0) {
            return 403;
        }
        try_files $uri $uri/ /index.html;
    }
}
```

**Cloudflare Access**:
```yaml
# Alternative: Use Cloudflare Access for authentication
# Configure in Cloudflare dashboard:
# - Create Access application for admin.streamit.com
# - Require email domain or specific emails
# - Enable MFA
```

**VPN Requirement**:
```bash
# Require VPN connection to access admin panel
# Configure at network level or use Cloudflare Tunnel
```

### Database Migrations

**Migration Process**:
```bash
# Create migration for new admin models
cd backend
bun run db:migrate:dev --name add_admin_models

# Apply to production
bun run db:migrate:deploy
```

**Migration File** (example):
```sql
-- Add admin roles to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MODERATOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'FINANCE_ADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COMPLIANCE_OFFICER';

-- Create AdminAuditLog table
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "admin_audit_log_adminId_idx" ON "admin_audit_log"("adminId");
CREATE INDEX "admin_audit_log_action_idx" ON "admin_audit_log"("action");
CREATE INDEX "admin_audit_log_targetType_idx" ON "admin_audit_log"("targetType");
CREATE INDEX "admin_audit_log_createdAt_idx" ON "admin_audit_log"("createdAt");

-- Add foreign key
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_adminId_fkey" 
    FOREIGN KEY ("adminId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create AdCreative table
CREATE TABLE "ad_creative" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "targetRegion" TEXT[],
    "targetGender" TEXT,
    "category" TEXT,
    "cpm" DOUBLE PRECISION NOT NULL,
    "frequencyCap" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_creative_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ad_creative_isActive_idx" ON "ad_creative"("isActive");
CREATE INDEX "ad_creative_createdAt_idx" ON "ad_creative"("createdAt");

-- Create GeoBlock table
CREATE TABLE "geo_block" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "contentId" TEXT,
    "reason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geo_block_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "geo_block_region_idx" ON "geo_block"("region");
CREATE INDEX "geo_block_contentId_idx" ON "geo_block"("contentId");

ALTER TABLE "geo_block" ADD CONSTRAINT "geo_block_contentId_fkey" 
    FOREIGN KEY ("contentId") REFERENCES "post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Monitoring and Logging

**Production Logging**:
```typescript
// Use structured logging in production
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log admin actions
logger.info('Admin action', {
  adminId: req.adminUser.id,
  action: 'user_ban',
  targetId: userId,
  timestamp: new Date().toISOString()
});
```

**Health Check Endpoint**:
```typescript
app.get('/api/admin/health', async (req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});
```

**Metrics Endpoint** (Prometheus):
```typescript
import promClient from 'prom-client';

const register = new promClient.Registry();

// Define metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```


## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Backend**:
- [ ] Create admin directory structure
- [ ] Implement adminAuthMiddleware
- [ ] Implement requirePermission middleware
- [ ] Create admin router with route registration
- [ ] Add AdminAuditLog, AdCreative, GeoBlock models to Prisma schema
- [ ] Run database migrations
- [ ] Implement AuditLogService

**Frontend**:
- [ ] Initialize admin-fe Vite project
- [ ] Install shadcn/ui components
- [ ] Set up TailwindCSS configuration
- [ ] Implement AdminLayout with AppSidebar and TopBar
- [ ] Create adminAuthStore (Zustand)
- [ ] Implement useAdminAuth hook
- [ ] Create ProtectedRoute and PermissionRoute components
- [ ] Implement LoginPage
- [ ] Set up React Router with basic routes
- [ ] Configure TanStack Query

**Testing**:
- [ ] Write property tests for authentication
- [ ] Write property tests for authorization
- [ ] Write property tests for audit logging

### Phase 2: User Management (Week 3)

**Backend**:
- [ ] Implement UserMgmtService
- [ ] Implement UserMgmtController
- [ ] Create user-mgmt routes
- [ ] Implement validation schemas
- [ ] Add pagination support
- [ ] Add search and filter support

**Frontend**:
- [ ] Create UsersPage with DataTable
- [ ] Implement FilterBar component
- [ ] Create UserDetailPage
- [ ] Implement freeze/ban/chat-disable actions
- [ ] Create confirmation dialogs
- [ ] Implement user search and filters

**Testing**:
- [ ] Write property tests for user freeze/unfreeze
- [ ] Write property tests for user ban
- [ ] Write unit tests for user management flows

### Phase 3: Streamer Management (Week 4)

**Backend**:
- [ ] Implement StreamerMgmtService
- [ ] Implement StreamerMgmtController
- [ ] Create streamer-mgmt routes
- [ ] Integrate with LiveKit for stream control
- [ ] Implement application approval/rejection

**Frontend**:
- [ ] Create ApplicationsPage
- [ ] Create LiveMonitorPage with polling
- [ ] Implement application review Sheet
- [ ] Create stream control actions
- [ ] Implement real-time updates

**Testing**:
- [ ] Write property tests for application approval
- [ ] Write property tests for stream control
- [ ] Write integration tests for LiveKit integration

### Phase 4: Content Moderation & Reports (Week 5)

**Backend**:
- [ ] Implement ContentModService
- [ ] Implement ReportsService
- [ ] Create content-mod and reports routes
- [ ] Implement moderation actions
- [ ] Implement report resolution

**Frontend**:
- [ ] Create ModerationQueuePage
- [ ] Create ReportsPage
- [ ] Implement content preview components
- [ ] Create moderation action dialogs
- [ ] Implement report resolution flow

**Testing**:
- [ ] Write property tests for content moderation
- [ ] Write property tests for report resolution
- [ ] Write property tests for hidden content invariant

### Phase 5: Monetization (Week 6)

**Backend**:
- [ ] Implement MonetizationService
- [ ] Implement MonetizationController
- [ ] Create monetization routes
- [ ] Implement withdrawal approval with transactions
- [ ] Implement wallet balance tracking

**Frontend**:
- [ ] Create LedgerPage
- [ ] Create WithdrawalsPage
- [ ] Create GiftsPage
- [ ] Implement withdrawal approval flow
- [ ] Create wallet detail view

**Testing**:
- [ ] Write property tests for withdrawal approval
- [ ] Write property tests for wallet balance invariant
- [ ] Write property tests for transaction atomicity

### Phase 6: Advertisements (Week 7)

**Backend**:
- [ ] Implement AdsService
- [ ] Implement AdsController
- [ ] Create ads routes
- [ ] Integrate with AWS S3 for uploads
- [ ] Implement ad performance tracking

**Frontend**:
- [ ] Create AdsPage
- [ ] Create AdEditorPage with form
- [ ] Implement S3 upload flow
- [ ] Create ad performance charts
- [ ] Implement ad management actions

**Testing**:
- [ ] Write property tests for ad creation
- [ ] Write property tests for active ad invariant
- [ ] Write unit tests for S3 integration

### Phase 7: Analytics (Week 8)

**Backend**:
- [ ] Implement AnalyticsService
- [ ] Implement AnalyticsController
- [ ] Create analytics routes
- [ ] Implement caching for expensive queries
- [ ] Calculate DAU, MAU, revenue metrics

**Frontend**:
- [ ] Create AnalyticsPage
- [ ] Implement StatCard components
- [ ] Create charts with Recharts
- [ ] Implement date range selector
- [ ] Add real-time metric updates

**Testing**:
- [ ] Write property tests for revenue sum invariant
- [ ] Write property tests for DAU/MAU relationship
- [ ] Write unit tests for analytics calculations

### Phase 8: Compliance & Settings (Week 9)

**Backend**:
- [ ] Implement ComplianceService
- [ ] Implement SettingsService
- [ ] Create compliance and settings routes
- [ ] Implement geo-blocking
- [ ] Implement data export (GDPR)
- [ ] Implement settings management

**Frontend**:
- [ ] Create CompliancePage
- [ ] Create AuditLogPage
- [ ] Create SettingsPage
- [ ] Create AdminRolesPage
- [ ] Implement geo-block interface
- [ ] Implement data export flow

**Testing**:
- [ ] Write property tests for geo-blocking
- [ ] Write property tests for data export
- [ ] Write property tests for settings updates

### Phase 9: Polish & Optimization (Week 10)

**Backend**:
- [ ] Optimize database queries
- [ ] Add query result caching
- [ ] Implement rate limiting
- [ ] Add comprehensive logging
- [ ] Performance testing and optimization

**Frontend**:
- [ ] Implement code splitting for all pages
- [ ] Add loading skeletons
- [ ] Optimize bundle size
- [ ] Add error boundaries
- [ ] Implement prefetching
- [ ] Accessibility audit and fixes
- [ ] Responsive design testing

**Testing**:
- [ ] Complete property-based test suite
- [ ] Integration testing for critical flows
- [ ] Performance testing
- [ ] Security testing
- [ ] Accessibility testing

### Phase 10: Deployment & Documentation (Week 11)

**Backend**:
- [ ] Production environment setup
- [ ] Database migration to production
- [ ] Configure monitoring and logging
- [ ] Set up health checks
- [ ] Configure rate limiting

**Frontend**:
- [ ] Production build optimization
- [ ] Deploy to production environment
- [ ] Configure CDN
- [ ] Set up error tracking
- [ ] Configure analytics

**Documentation**:
- [ ] API documentation (Swagger)
- [ ] Component documentation (Storybook)
- [ ] Deployment guide
- [ ] Admin user guide
- [ ] Developer guide

**Final Testing**:
- [ ] End-to-end testing in production
- [ ] Load testing
- [ ] Security audit
- [ ] User acceptance testing


## Conclusion

This design document provides a comprehensive technical specification for implementing the StreamIt Admin Panel. The system extends the existing Express/Bun/Prisma backend with admin-specific routes under `/api/admin/*` and provides a standalone React 19 frontend application for platform management.

### Key Design Decisions

1. **Backend Extension, Not Separate Server**: Admin routes are registered in the existing Express app, avoiding the complexity of managing multiple servers and ensuring shared infrastructure.

2. **Role-Based Access Control**: Five distinct admin roles (super_admin, moderator, finance_admin, support_admin, compliance_officer) with granular permissions enforced at both backend and frontend layers.

3. **Comprehensive Audit Logging**: All administrative actions are logged to AdminAuditLog for compliance and accountability.

4. **Transaction-Based Operations**: Multi-step operations (withdrawal approval, user ban, application approval) use Prisma transactions to ensure atomicity and data consistency.

5. **Property-Based Testing**: 26 correctness properties defined to verify system behavior across all inputs, complementing traditional unit tests.

6. **shadcn/ui Throughout**: Consistent UI components across the entire admin frontend, ensuring accessibility and maintainability.

7. **Performance Optimization**: Database query optimization, pagination, caching, code splitting, and TanStack Query for efficient data fetching.

8. **Security First**: HTTP-only cookies, CORS configuration, input validation, rate limiting, and comprehensive authorization checks.

### Implementation Readiness

This design provides:
- Complete API endpoint specifications with request/response formats
- Detailed component architecture for frontend
- Service layer design for backend business logic
- Database schema extensions with migrations
- Security design with authentication and authorization flows
- Testing strategy with property-based and unit tests
- Performance optimization strategies
- Deployment configuration for production

### Next Steps

1. Review and approve this design document
2. Begin Phase 1 implementation (Foundation)
3. Follow the 10-week implementation plan
4. Conduct regular design reviews as implementation progresses
5. Adjust design based on implementation learnings

The design is comprehensive, scalable, and ready for implementation. All 30 requirements from the requirements document are addressed with clear technical specifications.

