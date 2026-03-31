# Implementation Plan: StreamIt Admin Panel

## Overview

This implementation plan breaks down the StreamIt Admin Panel into executable tasks organized by the 10 implementation phases defined in the design document. The admin panel extends the existing Express/Bun/Prisma backend with routes under `/api/admin/*` and provides a standalone React 19 frontend application (`admin-fe`) with shadcn/ui components throughout.

The implementation uses TypeScript for both backend and frontend, with Better Auth for authentication, Prisma for database operations, TanStack Query for data fetching, and Zustand for state management.

## Tasks

- [x] 1. Phase 1: Foundation - Backend Infrastructure
  - [x] 1.1 Create admin directory structure in backend/src/admin/
    - Create directories: controllers/, services/, routes/, middleware/, validations/, types/
    - _Requirements: 17.1_
  
  - [x] 1.2 Add Prisma schema extensions for admin models
    - Add AdminAuditLog model with fields: id, adminId, action, targetType, targetId, metadata, createdAt
    - Add AdCreative model with fields: id, title, mediaUrl, targetRegion, targetGender, category, cpm, frequencyCap, isActive, createdAt, updatedAt
    - Add GeoBlock model with fields: id, region, contentId, reason, createdBy, createdAt
    - Add indexes for AdminAuditLog: adminId, action, targetType, createdAt
    - _Requirements: 18.1, 18.2, 18.3, 18.9_
  
  - [x] 1.3 Run database migration for admin schema
    - Execute `bun run db:migrate:dev` to apply schema changes
    - _Requirements: 18.1_
  
  - [x] 1.4 Implement adminAuthMiddleware
    - Create backend/src/admin/middleware/admin-auth.middleware.ts
    - Verify session using Better Auth
    - Check user role is one of: super_admin, moderator, finance_admin, support_admin, compliance_officer
    - Attach adminUser to request object
    - Return 401 if no session, 403 if not admin role
    - _Requirements: 1.1, 1.2, 2.1, 17.7, 17.10, 22.1, 22.2_
  
  - [x] 1.5 Implement requirePermission middleware
    - Create backend/src/admin/middleware/permissions.middleware.ts
    - Factory function accepting array of allowed roles
    - Check req.adminUser.role against allowed roles
    - Return 403 if role not in allowed list
    - _Requirements: 2.4, 17.8_
  
  - [x] 1.6 Implement AuditLogService
    - Create backend/src/admin/services/audit-log.service.ts
    - Implement createLog(adminId, action, targetType, targetId, metadata)
    - Implement getLogs(filters, pagination)
    - Use Prisma to write to AdminAuditLog table
    - _Requirements: 3.1, 3.2, 3.4_
  
  - [x] 1.7 Create admin router with route registration
    - Create backend/src/admin/routes/index.ts
    - Import and register all module routers
    - Apply requirePermission middleware to each route group
    - Export adminRouter
    - _Requirements: 17.6, 17.8_
  
  - [x] 1.8 Register admin routes in main Express app
    - In backend/src/index.ts, import adminRouter
    - Register with app.use('/api/admin', adminAuthMiddleware, adminRouter)
    - _Requirements: 17.6, 17.7_
  
  - [x] 1.9 Create admin auth routes and controller
    - Create backend/src/admin/routes/admin-auth.route.ts
    - Create backend/src/admin/controllers/admin-auth.controller.ts
    - Implement POST /api/admin/auth/sign-in endpoint
    - Implement POST /api/admin/auth/sign-out endpoint
    - Implement GET /api/admin/auth/session endpoint
    - Use Better Auth for session management
    - _Requirements: 1.1, 1.4, 1.5, 1.6_

- [ ]* 1.1 Write property tests for admin authentication
  - **Property 1: Admin Authentication Round-Trip**
  - **Validates: Requirements 1.1, 1.4**

- [ ]* 1.2 Write property tests for non-admin role rejection
  - **Property 2: Non-Admin Role Rejection**
  - **Validates: Requirements 1.2**

- [ ]* 1.3 Write property tests for authorization
  - **Property 4: Role-Based Authorization**
  - **Validates: Requirements 2.4**

- [ ]* 1.4 Write property tests for audit logging
  - **Property 6: Audit Log Round-Trip**
  - **Validates: Requirements 3.2, 3.10**

- [-] 2. Phase 1: Foundation - Frontend Infrastructure
  - [x] 2.1 Initialize admin-fe Vite project
    - Configure Vite for port 5174
    - _Requirements: 13.1_

  
  - [x] 2.3 Create adminAuthStore with Zustand
    - Create admin-fe/src/stores/adminAuthStore.ts
    - Define AdminUser interface with id, name, email, role
    - Implement state: user, isLoading, isAuthenticated
    - Implement actions: setUser, setLoading, logout
    - _Requirements: 1.7_
  
  - [x] 2.4 Implement useAdminAuth hook
    - Create admin-fe/src/hooks/useAdminAuth.ts
    - Implement initSession() to fetch /api/admin/auth/session
    - Implement signIn(email, password) to POST /api/admin/auth/sign-in
    - Implement signOut() to POST /api/admin/auth/sign-out
    - Update adminAuthStore on success
    - _Requirements: 1.8_
  
  - [x] 2.5 Create Axios client for admin API
    - Create admin-fe/src/lib/api/client.ts
    - Configure axios instance with baseURL from VITE_API_URL
    - Add response interceptor for error handling
    - Handle 401 → redirect to login, 403 → redirect to unauthorized
    - _Requirements: 21.1, 21.2, 21.3_
  
  - [x] 2.6 Implement ProtectedRoute component
    - Create admin-fe/src/router/ProtectedRoute.tsx
    - Check isAuthenticated from adminAuthStore
    - Show loading spinner if isLoading
    - Redirect to /login if not authenticated
    - _Requirements: 1.9_
  
  - [x] 2.7 Implement PermissionRoute component
    - Create admin-fe/src/router/PermissionRoute.tsx
    - Accept allowedRoles prop
    - Check user.role against allowedRoles
    - Redirect to /unauthorized if role not allowed
    - _Requirements: 2.6, 2.7_
  
  - [x] 2.8 Create permission matrix configuration
    - Create admin-fe/src/lib/permissions.ts
    - Define AdminRole type
    - Define NavItem interface with allowedRoles
    - Export NAV_ITEMS array with all navigation items
    - _Requirements: 2.3, 13.4_
  
  - [x] 2.9 Implement AdminLayout component
    - Create admin-fe/src/components/layout/AdminLayout.tsx
    - Use SidebarProvider from shadcn/ui
    - Include AppSidebar, TopBar, and Outlet for child routes
    - _Requirements: 13.2, 13.3_
  
  - [x] 2.10 Implement AppSidebar component
    - Create admin-fe/src/components/layout/AppSidebar.tsx
    - Use shadcn Sidebar components
    - Filter navigation items by user role
    - Implement collapsible nested groups
    - Highlight active route
    - Show user info in footer with sign out
    - _Requirements: 13.4, 13.5, 13.6, 13.7, 13.12, 13.14_
  
  - [x] 2.11 Implement TopBar component
    - Create admin-fe/src/components/layout/TopBar.tsx
    - Add SidebarTrigger for collapse toggle
    - Implement Breadcrumb navigation
    - Add notification bell (placeholder for now)
    - Add theme toggle with ModeToggle
    - _Requirements: 13.8, 13.9, 13.11_
  
  - [x] 2.12 Implement LoginPage
    - Create admin-fe/src/pages/auth/LoginPage.tsx
    - Use shadcn Card, Form, Input, Button components
    - Implement form with React Hook Form + Zod validation
    - Call useAdminAuth.signIn on submit
    - Show error toast on failure
    - Redirect to /dashboard on success
    - _Requirements: 1.9, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_
  
  - [x] 2.13 Set up React Router with basic routes
    - Create admin-fe/src/router/index.tsx
    - Define routes: /login, /, /dashboard, /unauthorized
    - Wrap authenticated routes with ProtectedRoute
    - Use AdminLayout for authenticated routes
    - _Requirements: 13.2_
  
  - [x] 2.14 Configure TanStack Query
    - Create admin-fe/src/lib/queryKeys.ts with query key factory
    - Set up QueryClient in admin-fe/src/main.tsx
    - Configure default staleTime and cacheTime
    - Wrap App with QueryClientProvider
    - _Requirements: 23.3, 23.4_
  
  - [x] 2.15 Initialize session on app mount
    - In admin-fe/src/App.tsx, call useAdminAuth.initSession on mount
    - Show loading spinner while initializing
    - _Requirements: 1.8_

- [x] 3. Phase 2: User Management - Backend Implementation
  - [x] 3.1 Create user management validation schemas
    - Create backend/src/admin/validations/user-mgmt.schema.ts
    - Define listUsersSchema with pagination, search, and filter parameters
    - Define freezeUserSchema with reason and optional expiresAt
    - Define banUserSchema with reason
    - Use Zod for all schemas
    - _Requirements: 17.5, 17.12_
  
  - [x] 3.2 Implement UserMgmtService
    - Create backend/src/admin/services/user-mgmt.service.ts
    - Implement listUsers(filters, pagination) with Prisma queries
    - Implement getUserById(id) with wallet and ban history
    - Implement freezeUser(id, reason, expiresAt, adminId) with transaction
    - Implement banUser(id, reason, adminId) with transaction
    - Implement disableChat(id, duration, adminId)
    - Implement resetPassword(id, adminId)
    - Create audit log entries for all actions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_
  
  - [x] 3.3 Implement UserMgmtController
    - Create backend/src/admin/controllers/user-mgmt.controller.ts
    - Implement listUsers handler with validation
    - Implement getUserById handler
    - Implement freezeUser handler
    - Implement banUser handler
    - Implement disableChat handler
    - Implement resetPassword handler
    - Handle errors and return appropriate status codes
    - _Requirements: 17.2, 17.11, 17.12, 17.13_
  
  - [x] 3.4 Create user management routes
    - Create backend/src/admin/routes/user-mgmt.route.ts
    - Define GET /api/admin/users
    - Define GET /api/admin/users/:id
    - Define PATCH /api/admin/users/:id/freeze
    - Define PATCH /api/admin/users/:id/ban
    - Define PATCH /api/admin/users/:id/chat-disable
    - Define POST /api/admin/users/:id/reset-password
    - _Requirements: 17.4_
  
  - [x] 3.5 Implement pagination support
    - Add pagination logic to listUsers service method
    - Calculate totalPages, hasNextPage, hasPreviousPage
    - Return PaginatedResponse format
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9_
  
  - [x] 3.6 Implement search and filter support
    - Add search by name, email, username using Prisma contains
    - Add filters for role, isSuspended, createdAt range
    - Combine filters with AND logic
    - _Requirements: 20.1, 20.2, 20.3, 20.4_


- [ ]* 3.1 Write property tests for user freeze/unfreeze
  - **Property 7: User Suspension State Transition**
  - **Validates: Requirements 4.5, 4.14**

- [x] 4. Phase 2: User Management - Frontend Implementation
  - [x] 4.1 Create users API client
    - Create admin-fe/src/lib/api/users.api.ts
    - Implement list(params) function
    - Implement getById(id) function
    - Implement freeze(id, data) function
    - Implement ban(id, data) function
    - Implement disableChat(id) function
    - Implement resetPassword(id) function
    - _Requirements: 4.10_
  
  - [x] 4.2 Implement DataTable component
    - Create admin-fe/src/components/common/DataTable.tsx
    - Use TanStack Table v8 and shadcn Table components
    - Support generic type parameters for data and columns
    - Implement column sorting with visual indicators
    - Implement pagination controls
    - Show loading skeletons when isLoading
    - Support row selection with checkboxes
    - Accept toolbar slot for filters
    - Show empty state when no data
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10, 14.11, 14.12_
  
  - [x] 4.3 Implement FilterBar component
    - Create admin-fe/src/components/common/FilterBar.tsx
    - Add debounced search Input (300ms)
    - Add filter Select components
    - Show active filter badges with clear buttons
    - Add "Clear all filters" button
    - _Requirements: 20.9, 20.10, 20.13_
  
  - [x] 4.4 Implement ConfirmDialog component
    - Create admin-fe/src/components/common/ConfirmDialog.tsx
    - Use shadcn AlertDialog
    - Accept title, description, confirmText, onConfirm props
    - Support destructive variant
    - _Requirements: 4.12_
  
  - [x] 4.5 Create UsersPage with DataTable
    - Create admin-fe/src/pages/users/UsersPage.tsx
    - Use TanStack Query to fetch users
    - Define column definitions for user table
    - Integrate DataTable component
    - Add FilterBar with search and filters
    - Implement pagination state management
    - Update URL query parameters on filter change
    - _Requirements: 4.10, 14.13, 20.11, 20.12_
  
  - [x] 4.6 Implement user action menu
    - Add ActionMenu component to each table row
    - Include actions: View Details, Freeze, Ban, Disable Chat, Reset Password
    - Filter actions based on user permissions
    - _Requirements: 4.11_
  
  - [x] 4.7 Create freeze user dialog
    - Create admin-fe/src/components/users/FreezeUserDialog.tsx
    - Use shadcn Dialog with Form
    - Add reason Textarea (required)
    - Add optional expiration date picker
    - Validate with Zod schema
    - Call usersApi.freeze on submit
    - Show success/error toast
    - Invalidate users query on success
    - _Requirements: 4.12, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_
  
  - [x] 4.8 Create ban user dialog
    - Create admin-fe/src/components/users/BanUserDialog.tsx
    - Use ConfirmDialog with reason input
    - Show warning about permanent action
    - Call usersApi.ban on confirm
    - Show success/error toast
    - Invalidate users query on success
    - _Requirements: 4.12, 4.13_
  
  - [x] 4.9 Create UserDetailPage
    - Create admin-fe/src/pages/users/UserDetailPage.tsx
    - Fetch user details with useQuery
    - Use shadcn Tabs for: Profile, Wallet, Activity History, Admin Notes
    - Display user information in Cards
    - Show wallet balance and transaction history
    - Show ban history and suspension status
    - Add action buttons in header
    - _Requirements: 4.13_
  
  - [x] 4.10 Add users routes to router
    - Add /users route with PermissionRoute guard
    - Add /users/:id route with PermissionRoute guard
    - Set allowedRoles to ['super_admin', 'support_admin', 'compliance_officer']
    - _Requirements: 2.6_

- [x] 5. Phase 3: Streamer Management - Backend Implementation
  - [x] 5.1 Create streamer management validation schemas
    - Create backend/src/admin/validations/streamer-mgmt.schema.ts
    - Define approveApplicationSchema
    - Define rejectApplicationSchema with reason
    - Define killStreamSchema with reason
    - Define warnStreamerSchema with message
    - _Requirements: 17.5_
  
  - [x] 5.2 Implement StreamerMgmtService
    - Create backend/src/admin/services/streamer-mgmt.service.ts
    - Implement listApplications(filters, pagination)
    - Implement getApplicationById(id)
    - Implement approveApplication(id, adminId) with transaction
    - Implement rejectApplication(id, reason, adminId)
    - Implement listLiveStreams()
    - Implement killStream(streamId, adminId) with LiveKit integration
    - Implement muteStreamer(streamId, adminId)
    - Implement disableStreamChat(streamId, adminId)
    - Implement warnStreamer(streamId, message, adminId)
    - Implement suspendStreamer(userId, reason, adminId) with transaction
    - Create audit log entries for all actions
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11_
  
  - [x] 5.3 Implement StreamerMgmtController
    - Create backend/src/admin/controllers/streamer-mgmt.controller.ts
    - Implement listApplications handler
    - Implement getApplicationById handler
    - Implement approveApplication handler
    - Implement rejectApplication handler
    - Implement listLiveStreams handler
    - Implement killStream handler
    - Implement muteStreamer handler
    - Implement disableStreamChat handler
    - Implement warnStreamer handler
    - Implement suspendStreamer handler
    - _Requirements: 17.2_
  
  - [x] 5.4 Create streamer management routes
    - Create backend/src/admin/routes/streamer-mgmt.route.ts
    - Define GET /api/admin/streamers/applications
    - Define GET /api/admin/streamers/applications/:id
    - Define PATCH /api/admin/streamers/applications/:id/approve
    - Define PATCH /api/admin/streamers/applications/:id/reject
    - Define GET /api/admin/streamers/live
    - Define POST /api/admin/streamers/:id/kill-stream
    - Define POST /api/admin/streamers/:id/mute
    - Define POST /api/admin/streamers/:id/disable-chat
    - Define POST /api/admin/streamers/:id/warn
    - Define PATCH /api/admin/streamers/:id/suspend
    - _Requirements: 17.4_
  
  - [x] 5.5 Integrate with LiveKit for stream control
    - Import LiveKit SDK in StreamerMgmtService
    - Implement room termination for killStream
    - Implement participant mute for muteStreamer
    - Handle LiveKit errors gracefully
    - _Requirements: 5.7_

- [ ]* 5.1 Write property tests for creator application approval
  - **Property 8: Creator Application Approval State Transition**
  - **Validates: Requirements 5.3, 5.17**

- [x] 6. Phase 3: Streamer Management - Frontend Implementation
  - [x] 6.1 Create streamers API client
    - Create admin-fe/src/lib/api/streamers.api.ts
    - Implement listApplications(params) function
    - Implement getApplicationById(id) function
    - Implement approveApplication(id) function
    - Implement rejectApplication(id, reason) function
    - Implement listLiveStreams() function
    - Implement killStream(id, reason) function
    - Implement muteStreamer(id) function
    - Implement disableStreamChat(id) function
    - Implement warnStreamer(id, message) function
    - Implement suspendStreamer(id, reason) function
    - _Requirements: 5.12_
  
  - [x] 6.2 Create ApplicationsPage
    - Create admin-fe/src/pages/streamers/ApplicationsPage.tsx
    - Use TanStack Query to fetch applications
    - Display applications in DataTable
    - Add filters for status and submission date
    - Show applicant name, submission date, status columns
    - Add action buttons: View, Approve, Reject
    - _Requirements: 5.12_
  
  - [x] 6.3 Create application review Sheet
    - Create admin-fe/src/components/streamers/ApplicationDetailSheet.tsx
    - Use shadcn Sheet component
    - Display full application details
    - Show identity verification documents
    - Show financial details
    - Show profile information
    - Add Approve and Reject buttons in footer
    - _Requirements: 5.13_
  
  - [x] 6.4 Create reject application dialog
    - Create admin-fe/src/components/streamers/RejectApplicationDialog.tsx
    - Use shadcn Dialog with Form
    - Add reason Textarea (required)
    - Validate with Zod schema
    - Call streamersApi.rejectApplication on submit
    - Show success/error toast
    - Invalidate applications query on success
    - _Requirements: 5.13_
  
  - [x] 6.5 Create LiveMonitorPage
    - Create admin-fe/src/pages/streamers/LiveMonitorPage.tsx
    - Use TanStack Query with refetchInterval: 10000 (10 seconds)
    - Display live streams in grid of cards
    - Show streamer name, title, viewer count, duration, category
    - Show thumbnail image
    - Add action menu for each stream
    - _Requirements: 5.14, 5.15, 16.1_
  
  - [x] 6.6 Create stream action menu
    - Create admin-fe/src/components/streamers/StreamActionMenu.tsx
    - Use shadcn DropdownMenu
    - Include actions: Kill Stream, Mute, Disable Chat, Warn, Suspend
    - Show confirmation dialog for destructive actions
    - Call appropriate API functions
    - Show success/error toasts
    - Invalidate live streams query on success
    - _Requirements: 5.16_
  
  - [x] 6.7 Add streamers routes to router
    - Add /streamers/applications route with PermissionRoute
    - Add /streamers/live route with PermissionRoute
    - Set allowedRoles appropriately for each route
    - _Requirements: 2.6_
  
  - [x] 6.8 Implement real-time polling
    - Configure TanStack Query refetchInterval for LiveMonitorPage
    - Stop polling when navigating away
    - Use staleTime and cacheTime for optimization
    - _Requirements: 16.1, 16.7, 16.8_

- [x] 7. Phase 4: Content Moderation - Backend Implementation
  - [x] 7.1 Create content moderation validation schemas
    - Create backend/src/admin/validations/content-mod.schema.ts
    - Define moderationActionSchema with action enum
    - Define warnAuthorSchema with message
    - Define removeContentSchema with reason
    - _Requirements: 17.5_
  
  - [x] 7.2 Implement ContentModService
    - Create backend/src/admin/services/content-mod.service.ts
    - Implement getModerationQueue(filters, pagination)
    - Implement getContentById(id, type)
    - Implement dismissFlags(contentId, adminId)
    - Implement warnAuthor(contentId, message, adminId)
    - Implement removeContent(contentId, reason, adminId)
    - Implement strikeAuthor(contentId, adminId)
    - Implement banAuthor(contentId, adminId) with transaction
    - Create audit log entries for all actions
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  
  - [x] 7.3 Implement ContentModController
    - Create backend/src/admin/controllers/content-mod.controller.ts
    - Implement getModerationQueue handler
    - Implement getContentById handler
    - Implement moderationAction handler (handles all action types)
    - Implement getShorts handler
    - Implement getPosts handler
    - _Requirements: 17.2_
  
  - [x] 7.4 Create content moderation routes
    - Create backend/src/admin/routes/content-mod.route.ts
    - Define GET /api/admin/moderation/queue
    - Define GET /api/admin/moderation/:contentId
    - Define PATCH /api/admin/moderation/:contentId/action
    - Define GET /api/admin/moderation/shorts
    - Define GET /api/admin/moderation/posts
    - _Requirements: 17.4_
  
  - [x] 7.5 Implement content filtering
    - Add filters for content type, category, flag count threshold, date range
    - Support sorting by flag count, creation date, last flagged date
    - _Requirements: 6.2, 6.3_

- [ ]* 7.1 Write property tests for content moderation idempotence
  - **Property 9: Content Moderation Idempotence**
  - **Validates: Requirements 6.5, 6.18**

- [ ]* 7.2 Write property tests for hidden content exclusion
  - **Property 10: Hidden Content Exclusion Invariant**
  - **Validates: Requirements 6.17**

- [x] 8. Phase 4: Reports Management - Backend Implementation
  - [x] 8.1 Create reports validation schemas
    - Create backend/src/admin/validations/reports.schema.ts
    - Define resolveReportSchema with action and notes
    - _Requirements: 17.5_
  
  - [x] 8.2 Implement ReportsService
    - Create backend/src/admin/services/reports.service.ts
    - Implement listReports(filters, pagination)
    - Implement getReportById(id) with reporter and reported user history
    - Implement resolveReport(id, action, notes, adminId)
    - Create audit log entries for resolutions
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [x] 8.3 Implement ReportsController
    - Create backend/src/admin/controllers/reports.controller.ts
    - Implement listReports handler
    - Implement getReportById handler
    - Implement resolveReport handler
    - Implement getAuditLog handler
    - _Requirements: 17.2_
  
  - [x] 8.4 Create reports routes
    - Create backend/src/admin/routes/reports.route.ts
    - Define GET /api/admin/reports
    - Define GET /api/admin/reports/:id
    - Define PATCH /api/admin/reports/:id/resolve
    - Define GET /api/admin/reports/audit-log
    - _Requirements: 17.4_
  
  - [x] 8.5 Implement report filtering
    - Add filters for reason category, status, reporter ID, reported user ID, date range
    - Support sorting by creation date, priority, report count
    - _Requirements: 7.2, 7.3_

- [ ]* 8.1 Write property tests for report status count invariant
  - **Property 11: Report Status Count Invariant**
  - **Validates: Requirements 7.16**

- [x] 9. Phase 4: Content Moderation & Reports - Frontend Implementation
  - [x] 9.1 Create moderation API client
    - Create admin-fe/src/lib/api/moderation.api.ts
    - Implement getQueue(params) function
    - Implement getContentById(id) function
    - Implement moderationAction(contentId, action, data) function
    - Implement getShorts(params) function
    - Implement getPosts(params) function
    - _Requirements: 6.12_
  
  - [x] 9.2 Create reports API client
    - Create admin-fe/src/lib/api/reports.api.ts
    - Implement list(params) function
    - Implement getById(id) function
    - Implement resolve(id, data) function
    - Implement getAuditLog(params) function
    - _Requirements: 7.10_
  
  - [x] 9.3 Create ModerationQueuePage
    - Create admin-fe/src/pages/moderation/ModerationQueuePage.tsx
    - Use TanStack Query with refetchInterval: 30000 (30 seconds)
    - Display content in DataTable
    - Add Tabs for: All Content, Shorts, Posts
    - Show content preview, author, type, flags, date columns
    - Add action buttons for each item
    - _Requirements: 6.12, 6.13, 16.2_
  
  - [x] 9.4 Create content preview component
    - Create admin-fe/src/components/moderation/ContentPreview.tsx
    - Support rendering images, videos, and text
    - Show content metadata
    - Display flag reasons and count
    - _Requirements: 6.14_
  
  - [x] 9.5 Create moderation action dialog
    - Create admin-fe/src/components/moderation/ModerationActionDialog.tsx
    - Use shadcn Dialog
    - Show content preview
    - Display flag details
    - Add action buttons: Dismiss, Warn, Remove, Strike, Ban
    - Show confirmation for Strike and Ban actions
    - Call moderationApi.moderationAction on submit
    - _Requirements: 6.14, 6.15, 6.16_
  
  - [x] 9.6 Create ReportsPage
    - Create admin-fe/src/pages/reports/ReportsPage.tsx
    - Use TanStack Query with refetchInterval for PENDING status
    - Display reports in DataTable
    - Add filters for category, status, date range
    - Show reporter, target, category, priority badge, report count columns
    - Use Badge components with color coding for priority
    - _Requirements: 7.10, 7.11, 16.3_
  
  - [x] 9.7 Create ReportDetailPage
    - Create admin-fe/src/pages/reports/ReportDetailPage.tsx
    - Fetch report details with useQuery
    - Display full report context
    - Show reporter information and history
    - Show reported user information and history
    - Show reported content preview
    - Add resolution form in footer
    - _Requirements: 7.12, 7.13_
  
  - [x] 9.8 Create resolve report dialog
    - Create admin-fe/src/components/reports/ResolveReportDialog.tsx
    - Use shadcn Dialog with Form
    - Add action Select dropdown with resolution options
    - Add admin notes Textarea
    - Validate with Zod schema
    - Call reportsApi.resolve on submit
    - Show success/error toast
    - _Requirements: 7.14, 7.15_
  
  - [x] 9.9 Add moderation and reports routes to router
    - Add /moderation route with PermissionRoute
    - Add /moderation/shorts and /moderation/posts routes
    - Add /reports and /reports/:id routes with PermissionRoute
    - Set allowedRoles appropriately
    - _Requirements: 2.6_

- [x] 10. Phase 5: Monetization - Backend Implementation
  - [x] 10.1 Create monetization validation schemas
    - Create backend/src/admin/validations/monetization.schema.ts
    - Define approveWithdrawalSchema
    - Define rejectWithdrawalSchema with reason
    - _Requirements: 17.5_
  
  - [x] 10.2 Implement MonetizationService
    - Create backend/src/admin/services/monetization.service.ts
    - Implement getCoinLedger(filters, pagination)
    - Implement getWithdrawals(filters, pagination)
    - Implement approveWithdrawal(id, adminId) with transaction
    - Implement rejectWithdrawal(id, reason, adminId)
    - Implement getGiftTransactions(filters, pagination)
    - Implement getWalletDetails(userId)
    - Create audit log entries for all actions
    - Use Prisma transactions for withdrawal approval
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 29.1, 29.2_
  
  - [x] 10.3 Implement transaction atomicity for withdrawal approval
    - In approveWithdrawal, use Prisma.$transaction
    - Update withdrawal status to APPROVED
    - Deduct coins from creator wallet
    - Create audit log entry
    - Rollback all changes if any step fails
    - _Requirements: 29.2, 29.11, 29.12, 29.15_
  
  - [x] 10.4 Implement MonetizationController
    - Create backend/src/admin/controllers/monetization.controller.ts
    - Implement getCoinLedger handler
    - Implement getWithdrawals handler
    - Implement approveWithdrawal handler
    - Implement rejectWithdrawal handler
    - Implement getGiftTransactions handler
    - Implement getWalletDetails handler
    - _Requirements: 17.2_
  
  - [x] 10.5 Create monetization routes
    - Create backend/src/admin/routes/monetization.route.ts
    - Define GET /api/admin/monetization/ledger
    - Define GET /api/admin/monetization/withdrawals
    - Define PATCH /api/admin/monetization/withdrawals/:id/approve
    - Define PATCH /api/admin/monetization/withdrawals/:id/reject
    - Define GET /api/admin/monetization/gifts
    - Define GET /api/admin/monetization/wallets/:userId
    - _Requirements: 17.4_
  
  - [x] 10.6 Implement monetization filtering
    - Add filters for ledger: user ID, date range, status, amount range, payment gateway
    - Add filters for withdrawals: status, user ID, date range, amount range
    - Add filters for gifts: date range, amount
    - _Requirements: 8.2, 8.6_

- [ ]* 10.1 Write property tests for withdrawal approval wallet balance
  - **Property 12: Withdrawal Approval Wallet Balance Invariant**
  - **Validates: Requirements 8.8, 8.19, 29.15**

- [ ]* 10.2 Write property tests for coin purchase wallet balance
  - **Property 13: Coin Purchase Wallet Balance Invariant**
  - **Validates: Requirements 8.20**

- [-] 11. Phase 5: Monetization - Frontend Implementation
  - [x] 11.1 Create monetization API client
    - Create admin-fe/src/lib/api/monetization.api.ts
    - Implement getLedger(params) function
    - Implement getWithdrawals(params) function
    - Implement approveWithdrawal(id) function
    - Implement rejectWithdrawal(id, reason) function
    - Implement getGifts(params) function
    - Implement getWalletDetails(userId) function
    - _Requirements: 8.13_
  
  - [x] 11.2 Create LedgerPage
    - Create admin-fe/src/pages/monetization/LedgerPage.tsx
    - Use TanStack Query to fetch coin purchases
    - Display ledger in DataTable
    - Show user, package, coins, amount, status, date columns
    - Add filters for date range, status, amount range
    - _Requirements: 8.13_
  
  - [x] 11.3 Create WithdrawalsPage
    - Create admin-fe/src/pages/monetization/WithdrawalsPage.tsx
    - Use TanStack Query with refetchInterval for PENDING status
    - Display withdrawals in DataTable
    - Add Tabs for: Pending, Approved, Rejected
    - Show creator, amount, bank details, request date, status columns
    - Add action buttons for pending withdrawals: Approve, Reject
    - _Requirements: 8.14, 16.4_
  
  - [x] 11.4 Create approve withdrawal dialog
    - Create admin-fe/src/components/monetization/ApproveWithdrawalDialog.tsx
    - Use shadcn AlertDialog
    - Show withdrawal details: creator, amount, bank details
    - Show confirmation warning
    - Call monetizationApi.approveWithdrawal on confirm
    - Show success/error toast
    - Invalidate withdrawals query on success
    - _Requirements: 8.16_
  
  - [x] 11.5 Create reject withdrawal dialog
    - Create admin-fe/src/components/monetization/RejectWithdrawalDialog.tsx
    - Use shadcn Dialog with Form
    - Add reason Textarea (required)
    - Validate with Zod schema
    - Call monetizationApi.rejectWithdrawal on submit
    - Show success/error toast
    - _Requirements: 8.17_
  
  - [-] 11.6 Create GiftsPage
    - Create admin-fe/src/pages/monetization/GiftsPage.tsx
    - Use TanStack Query to fetch gift transactions
    - Display gifts in DataTable
    - Show sender, receiver, gift name, coin amount, stream context, timestamp columns
    - Add filters for date range and amount
    - _Requirements: 8.18_
  
  - [ ] 11.7 Add monetization routes to router
    - Add /monetization/ledger route with PermissionRoute
    - Add /monetization/withdrawals route with PermissionRoute
    - Add /monetization/gifts route with PermissionRoute
    - Set allowedRoles appropriately
    - _Requirements: 2.6_

- [~] 12. Phase 6: Advertisements - Backend Implementation
  - [ ] 12.1 Create ads validation schemas
    - Create backend/src/admin/validations/ads.schema.ts
    - Define createAdSchema with all required fields
    - Define updateAdSchema with optional fields
    - Validate targetRegion array, CPM value, frequency cap
    - _Requirements: 17.5_
  
  - [ ] 12.2 Implement AdsService
    - Create backend/src/admin/services/ads.service.ts
    - Implement listAds(filters, pagination)
    - Implement createAd(data, adminId)
    - Implement updateAd(id, data, adminId)
    - Implement deleteAd(id, adminId) (sets isActive to false)
    - Implement getAdPerformance(id)
    - Create audit log entries for create, update, delete
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [ ] 12.3 Integrate with AWS S3 for ad uploads
    - Import AWS SDK in AdsService
    - Generate presigned URLs for uploads
    - Store S3 URLs in AdCreative.mediaUrl
    - Handle upload errors gracefully
    - _Requirements: 9.4, 9.12_
  
  - [ ] 12.4 Implement AdsController
    - Create backend/src/admin/controllers/ads.controller.ts
    - Implement listAds handler
    - Implement createAd handler
    - Implement updateAd handler
    - Implement deleteAd handler
    - Implement getAdPerformance handler
    - _Requirements: 17.2_
  
  - [ ] 12.5 Create ads routes
    - Create backend/src/admin/routes/ads.route.ts
    - Define GET /api/admin/ads
    - Define POST /api/admin/ads
    - Define PATCH /api/admin/ads/:id
    - Define DELETE /api/admin/ads/:id
    - Define GET /api/admin/ads/:id/performance
    - _Requirements: 17.4_
  
  - [ ] 12.6 Implement ad filtering
    - Add filters for status (active/inactive), target region, category, date range
    - Support sorting by creation date, CPM, impressions
    - _Requirements: 9.2, 9.3_

- [ ]* 12.1 Write property tests for ad campaign round-trip
  - **Property 14: Ad Campaign Round-Trip**
  - **Validates: Requirements 9.4**

- [ ]* 12.2 Write property tests for active ad eligibility
  - **Property 15: Active Ad Eligibility Invariant**
  - **Validates: Requirements 9.16**

- [ ] 13. Phase 6: Advertisements - Frontend Implementation
  - [ ] 13.1 Create ads API client
    - Create admin-fe/src/lib/api/ads.api.ts
    - Implement list(params) function
    - Implement create(data) function
    - Implement update(id, data) function
    - Implement delete(id) function
    - Implement getPerformance(id) function
    - Implement getPresignedUrl() function for S3 uploads
    - _Requirements: 9.9_
  
  - [ ] 13.2 Create AdsPage
    - Create admin-fe/src/pages/ads/AdsPage.tsx
    - Use TanStack Query to fetch ads
    - Display ads in DataTable
    - Show title, status badge, regions, CPM, created date columns
    - Add filters for status, regions, category, date range
    - Add "Create Ad" button navigating to /ads/new
    - _Requirements: 9.9_
  
  - [ ] 13.3 Create AdEditorPage
    - Create admin-fe/src/pages/ads/AdEditorPage.tsx
    - Use React Hook Form with Zod validation
    - Add form fields: title Input, creative file upload, target regions MultiSelect, target gender Select, category MultiSelect, CPM number Input, frequency cap number Input, active Switch
    - Support both create and edit modes
    - Pre-fill form in edit mode
    - _Requirements: 9.10, 9.11_
  
  - [ ] 13.4 Implement S3 upload flow
    - Create admin-fe/src/components/ads/MediaUpload.tsx
    - Request presigned URL from backend
    - Upload file directly to S3 using presigned URL
    - Show upload progress
    - Handle upload errors
    - _Requirements: 9.12_
  
  - [ ] 13.5 Create ad performance charts
    - Create admin-fe/src/components/ads/AdPerformanceChart.tsx
    - Use Recharts for visualizations
    - Display metrics: impressions, clicks, CTR, total spend, average CPM
    - Show charts in Card components
    - _Requirements: 9.15_
  
  - [ ] 13.6 Add ads routes to router
    - Add /ads route with PermissionRoute
    - Add /ads/new route with PermissionRoute
    - Add /ads/:id route with PermissionRoute
    - Set allowedRoles to ['super_admin', 'finance_admin']
    - _Requirements: 2.6_

- [ ] 14. Phase 7: Analytics - Backend Implementation
  - [ ] 14.1 Implement AnalyticsService
    - Create backend/src/admin/services/analytics.service.ts
    - Implement getOverview(dateRange) calculating DAU, MAU, revenue, concurrent users, conversion rate
    - Implement getTopStreamers(dateRange, limit) with revenue ranking
    - Implement getTopContent(dateRange, type) for shorts, posts, streams
    - Implement getConversionFunnel(dateRange) with viewer to gift buyer metrics
    - Use Prisma aggregations for calculations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  
  - [ ] 14.2 Implement query result caching
    - Add caching layer for expensive analytics queries
    - Use in-memory cache with TTL
    - Cache overview metrics for 5 minutes
    - Cache top streamers/content for 10 minutes
    - _Requirements: 23.11_
  
  - [ ] 14.3 Implement AnalyticsController
    - Create backend/src/admin/controllers/analytics.controller.ts
    - Implement getOverview handler with date range parameter
    - Implement getTopStreamers handler
    - Implement getTopContent handler
    - Implement getConversionFunnel handler
    - _Requirements: 17.2_
  
  - [ ] 14.4 Create analytics routes
    - Create backend/src/admin/routes/analytics.route.ts
    - Define GET /api/admin/analytics/overview
    - Define GET /api/admin/analytics/streamers
    - Define GET /api/admin/analytics/content
    - Define GET /api/admin/analytics/conversion
    - _Requirements: 17.4_
  
  - [ ] 14.5 Optimize analytics queries
    - Add database indexes for analytics queries
    - Use Prisma select to fetch only required fields
    - Implement efficient aggregation queries
    - _Requirements: 23.9, 23.10_

- [ ]* 14.1 Write property tests for revenue sum invariant
  - **Property 16: Analytics Revenue Sum Invariant**
  - **Validates: Requirements 10.16**

- [ ]* 14.2 Write property tests for DAU/MAU relationship
  - **Property 17: DAU/MAU Relationship Invariant**
  - **Validates: Requirements 10.17**

- [ ] 15. Phase 7: Analytics - Frontend Implementation
  - [ ] 15.1 Create analytics API client
    - Create admin-fe/src/lib/api/analytics.api.ts
    - Implement getOverview(dateRange) function
    - Implement getTopStreamers(dateRange) function
    - Implement getTopContent(dateRange, type) function
    - Implement getConversionFunnel(dateRange) function
    - _Requirements: 10.9_
  
  - [ ] 15.2 Create StatCard component
    - Create admin-fe/src/components/common/StatCard.tsx
    - Display metric value, label, change percentage, trend indicator
    - Use shadcn Card component
    - Support different variants for positive/negative trends
    - _Requirements: 10.9_
  
  - [ ] 15.3 Create AnalyticsPage
    - Create admin-fe/src/pages/analytics/AnalyticsPage.tsx
    - Use TanStack Query to fetch analytics data
    - Add date range Select with options: Today, Last 7 Days, Last 30 Days, Last 90 Days
    - Display overview metrics in StatCard grid
    - Refresh data when date range changes
    - _Requirements: 10.10, 10.15_
  
  - [ ] 15.4 Create DAU/MAU trend chart
    - Use Recharts AreaChart
    - Display daily active users over time
    - Show monthly active users as comparison
    - Add tooltips and legends
    - _Requirements: 10.11_
  
  - [ ] 15.5 Create revenue per streamer chart
    - Use Recharts BarChart
    - Display top 10 streamers by revenue
    - Show streamer name and revenue amount
    - Add tooltips
    - _Requirements: 10.12_
  
  - [ ] 15.6 Create top content charts
    - Use Recharts BarChart for each content type
    - Create separate charts for: top shorts by views, top posts by likes, top streams by peak viewers
    - Display in Card components
    - _Requirements: 10.13_
  
  - [ ] 15.7 Create conversion funnel visualization
    - Use StatCards or visual funnel representation
    - Show: total viewers, viewers who sent gifts, average gift value, conversion percentage
    - Display metrics in descending funnel shape
    - _Requirements: 10.14_
  
  - [ ] 15.8 Add analytics route to router
    - Add /analytics route with PermissionRoute
    - Set allowedRoles to ['super_admin', 'moderator', 'finance_admin', 'compliance_officer']
    - _Requirements: 2.6_

- [ ] 16. Phase 8: Compliance - Backend Implementation
  - [ ] 16.1 Implement ComplianceService
    - Create backend/src/admin/services/compliance.service.ts
    - Implement getAuditLog(filters, pagination)
    - Implement createGeoBlock(region, contentId, reason, adminId)
    - Implement exportUserData(userId, adminId) generating JSON export
    - Implement getTakedowns() returning content with legal removal reasons
    - Create audit log entries for all actions
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_
  
  - [ ] 16.2 Implement data export for GDPR compliance
    - In exportUserData, fetch all user data: profile, posts, comments, transactions, streams
    - Format as JSON conforming to GDPR and IT Rules requirements
    - Include all personal data associated with user
    - _Requirements: 11.6, 11.7_
  
  - [ ] 16.3 Implement ComplianceController
    - Create backend/src/admin/controllers/compliance.controller.ts
    - Implement getAuditLog handler
    - Implement createGeoBlock handler
    - Implement exportUserData handler
    - Implement getTakedowns handler
    - _Requirements: 17.2_
  
  - [ ] 16.4 Create compliance routes
    - Create backend/src/admin/routes/compliance.route.ts
    - Define GET /api/admin/compliance/audit-log
    - Define POST /api/admin/compliance/geo-block
    - Define GET /api/admin/compliance/export
    - Define GET /api/admin/compliance/takedowns
    - _Requirements: 17.4_
  
  - [ ] 16.5 Implement audit log filtering
    - Add filters for admin ID, action type, target type, date range
    - Support sorting by timestamp
    - _Requirements: 11.2_

- [ ]* 16.1 Write property tests for geo-block access denial
  - **Property 18: Geo-Block Access Denial**
  - **Validates: Requirements 11.5, 11.17**

- [ ]* 16.2 Write property tests for data export idempotence
  - **Property 19: Data Export Idempotence**
  - **Validates: Requirements 11.18**

- [ ] 17. Phase 8: Settings - Backend Implementation
  - [ ] 17.1 Implement SettingsService
    - Create backend/src/admin/services/settings.service.ts
    - Implement getSettings() returning all SystemSetting records organized by category
    - Implement updateSettings(updates, adminId) with validation
    - Implement listAdmins() returning users with admin roles
    - Implement createAdmin(data, adminId)
    - Implement updateAdminRole(id, role, adminId)
    - Implement deleteAdmin(id, adminId)
    - Create audit log entries for all actions
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10_
  
  - [ ] 17.2 Implement settings validation
    - Validate setting values against defined constraints
    - Support setting types: boolean, number, string, JSON
    - Validate enum values for specific settings
    - _Requirements: 12.4, 12.5_
  
  - [ ] 17.3 Implement SettingsController
    - Create backend/src/admin/controllers/settings.controller.ts
    - Implement getSettings handler
    - Implement updateSettings handler
    - Implement listAdmins handler
    - Implement createAdmin handler
    - Implement updateAdminRole handler
    - Implement deleteAdmin handler
    - _Requirements: 17.2_
  
  - [ ] 17.4 Create settings routes
    - Create backend/src/admin/routes/settings.route.ts
    - Define GET /api/admin/settings
    - Define PATCH /api/admin/settings
    - Define GET /api/admin/settings/admins
    - Define POST /api/admin/settings/admins
    - Define PATCH /api/admin/settings/admins/:id/role
    - Define DELETE /api/admin/settings/admins/:id
    - _Requirements: 17.4_

- [ ]* 17.1 Write property tests for settings update round-trip
  - **Property 20: Settings Update Round-Trip**
  - **Validates: Requirements 12.18**

- [ ]* 17.2 Write property tests for role change permission reflection
  - **Property 21: Role Change Permission Reflection**
  - **Validates: Requirements 12.19**

- [ ] 18. Phase 8: Compliance & Settings - Frontend Implementation
  - [ ] 18.1 Create compliance API client
    - Create admin-fe/src/lib/api/compliance.api.ts
    - Implement getAuditLog(params) function
    - Implement createGeoBlock(data) function
    - Implement exportUserData(userId) function
    - Implement getTakedowns(params) function
    - _Requirements: 11.10_
  
  - [ ] 18.2 Create settings API client
    - Create admin-fe/src/lib/api/settings.api.ts
    - Implement getSettings() function
    - Implement updateSettings(data) function
    - Implement listAdmins() function
    - Implement createAdmin(data) function
    - Implement updateAdminRole(id, role) function
    - Implement deleteAdmin(id) function
    - _Requirements: 12.11_
  
  - [ ] 18.3 Create AuditLogPage
    - Create admin-fe/src/pages/compliance/AuditLogPage.tsx
    - Use TanStack Query to fetch audit log
    - Display entries in DataTable
    - Show timestamp, admin name, action, target, details columns
    - Add filters for action type, admin, date range
    - _Requirements: 11.10, 11.11_
  
  - [ ] 18.4 Create CompliancePage
    - Create admin-fe/src/pages/compliance/CompliancePage.tsx
    - Add geo-block interface with region Select and optional content ID Input
    - Add data export interface with user search and export button
    - Display takedowns in DataTable with content preview and legal reason
    - _Requirements: 11.12, 11.13, 11.14, 11.15, 11.16_
  
  - [ ] 18.5 Implement geo-block form
    - Create admin-fe/src/components/compliance/GeoBlockForm.tsx
    - Use shadcn Form with region Select and content ID Input
    - Validate region against ISO country codes
    - Show confirmation dialog before creating block
    - Call complianceApi.createGeoBlock on submit
    - _Requirements: 11.12, 11.13_
  
  - [ ] 18.6 Implement data export flow
    - Create admin-fe/src/components/compliance/DataExportButton.tsx
    - Add user search input
    - Trigger download of JSON file on export
    - Show loading state during export
    - Handle errors gracefully
    - _Requirements: 11.14, 11.15_
  
  - [ ] 18.7 Create SettingsPage
    - Create admin-fe/src/pages/settings/SettingsPage.tsx
    - Use TanStack Query to fetch settings
    - Display settings in Form with sections for each category
    - Use appropriate input components: Switch for boolean, Input for number/string, Textarea for JSON
    - Validate with Zod schema before submission
    - Call settingsApi.updateSettings on submit
    - _Requirements: 12.11, 12.12, 12.13_
  
  - [ ] 18.8 Create AdminRolesPage
    - Create admin-fe/src/pages/settings/AdminRolesPage.tsx
    - Use TanStack Query to fetch admin users
    - Display admins in DataTable
    - Show name, email, role badge, created date columns
    - Add action buttons: Change Role, Delete
    - _Requirements: 12.14_
  
  - [ ] 18.9 Create admin management dialogs
    - Create admin-fe/src/components/settings/CreateAdminDialog.tsx with Form for name, email, role Select
    - Create admin-fe/src/components/settings/ChangeRoleDialog.tsx with role Select
    - Use shadcn Dialog and Form components
    - Validate with Zod schemas
    - Show confirmation for delete action
    - _Requirements: 12.15, 12.16, 12.17_
  
  - [ ] 18.10 Add compliance and settings routes to router
    - Add /compliance and /compliance/audit routes with PermissionRoute
    - Add /settings and /settings/roles routes with PermissionRoute
    - Set allowedRoles appropriately
    - _Requirements: 2.6_

- [ ] 19. Phase 9: Performance Optimization - Backend
  - [ ] 19.1 Optimize database queries
    - Review all Prisma queries for efficiency
    - Add missing database indexes
    - Use Prisma select to fetch only required fields
    - Implement query result caching for frequently accessed data
    - _Requirements: 23.9, 23.10, 23.11_
  
  - [ ] 19.2 Implement rate limiting
    - Add express-rate-limit middleware
    - Configure rate limits: 1000 requests per 15 minutes for admin routes
    - Configure stricter limits for auth routes: 5 attempts per 15 minutes
    - Skip rate limiting for super_admin in development
    - _Requirements: 22.8_
  
  - [ ] 19.3 Enhance logging
    - Implement structured logging with log levels: error, warn, info, debug
    - Log all admin actions with context
    - Log all API errors with stack traces
    - Log authentication and authorization failures
    - _Requirements: 28.1, 28.2, 28.5, 28.6, 28.7, 28.8_
  
  - [ ] 19.4 Implement health check endpoint
    - Create GET /api/admin/health endpoint
    - Check database connectivity
    - Return API status and timestamp
    - _Requirements: 28.3, 28.4_
  
  - [ ] 19.5 Configure database connection pooling
    - Configure Prisma connection pool size
    - Set appropriate timeout values
    - _Requirements: 23.12_

- [ ] 20. Phase 9: Performance Optimization - Frontend
  - [ ] 20.1 Implement code splitting
    - Use React.lazy for all page components
    - Wrap lazy components in Suspense with loading fallback
    - Split routes by feature modules
    - _Requirements: 23.1, 23.2_
  
  - [ ] 20.2 Configure TanStack Query caching
    - Set staleTime: 5 minutes for static data
    - Set staleTime: 30 seconds for dynamic data
    - Configure cacheTime appropriately
    - Implement prefetching for likely next navigation
    - _Requirements: 23.3, 23.4, 23.5_
  
  - [ ] 20.3 Add loading skeletons
    - Create LoadingSkeleton component
    - Add skeletons to all DataTable instances
    - Add skeletons to detail pages
    - Show skeletons during data fetching
    - _Requirements: 21.9_
  
  - [ ] 20.4 Optimize bundle size
    - Analyze bundle with vite-bundle-visualizer
    - Tree-shake unused code
    - Lazy load heavy dependencies
    - Minimize third-party library usage
    - _Requirements: 23.8_
  
  - [ ] 20.5 Implement error boundaries
    - Create ErrorBoundary component
    - Wrap App with ErrorBoundary
    - Display error page with reload option
    - Log errors to console with context
    - _Requirements: 21.11, 21.12, 28.9, 28.10_
  
  - [ ] 20.6 Add empty states
    - Create EmptyState component
    - Add empty states to all list views
    - Show helpful messages and suggested actions
    - _Requirements: 21.10_

- [ ] 21. Phase 9: Accessibility & Responsive Design
  - [ ] 21.1 Implement responsive layouts
    - Use mobile-first CSS with min-width media queries
    - Adapt layout for mobile (< 640px), tablet (640px - 1024px), desktop (> 1024px)
    - Collapse sidebar to icon-only mode on mobile
    - Stack form fields vertically on mobile
    - Use responsive DataTable with horizontal scroll on mobile
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_
  
  - [ ] 21.2 Ensure touch-friendly interactions
    - Use minimum 44x44px tap targets
    - Add appropriate spacing between interactive elements
    - Test on mobile devices
    - _Requirements: 24.6_
  
  - [ ] 21.3 Implement semantic HTML
    - Use semantic elements: header, nav, main, section, article
    - Ensure proper heading hierarchy
    - Use appropriate ARIA roles
    - _Requirements: 24.7_
  
  - [ ] 21.4 Add ARIA labels and attributes
    - Add aria-label to all interactive elements without visible text
    - Use aria-describedby for form field descriptions
    - Add aria-live regions for dynamic content updates
    - Ensure screen reader compatibility
    - _Requirements: 24.8, 24.12_
  
  - [ ] 21.5 Implement keyboard navigation
    - Ensure all functions accessible via keyboard
    - Implement focus management for modals and dialogs
    - Add visible focus indicators
    - Support Tab, Enter, Escape, Arrow keys
    - _Requirements: 24.9, 24.10, 24.15_
  
  - [ ] 21.6 Ensure color contrast
    - Verify all text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
    - Don't rely solely on color to convey information
    - Add text labels or icons alongside color indicators
    - _Requirements: 24.11, 24.13_
  
  - [ ] 21.7 Add text alternatives
    - Provide alt text for all images
    - Add aria-label for icon-only buttons
    - Ensure all non-text content has text alternative
    - _Requirements: 24.14_

- [ ] 22. Phase 10: Deployment Configuration
  - [ ] 22.1 Configure backend environment variables
    - Add ADMIN_FRONTEND_URL to .env
    - Configure CORS to include ADMIN_FRONTEND_URL
    - Set secure cookie flags in production
    - Configure rate limiting for production
    - _Requirements: 26.1, 26.2, 26.12_
  
  - [ ] 22.2 Configure frontend environment variables
    - Create .env.production file
    - Set VITE_API_URL to production backend URL
    - Configure production domain
    - _Requirements: 26.4, 26.9_
  
  - [ ] 22.3 Build frontend for production
    - Run `bun run build` to create production bundle
    - Verify dist/ directory contains optimized assets
    - Test production build locally
    - _Requirements: 26.6, 26.7_
  
  - [ ] 22.4 Set up frontend deployment
    - Choose deployment platform: Vercel, Netlify, AWS S3 + CloudFront, or Nginx
    - Configure deployment settings
    - Set up custom domain (admin.streamit.com)
    - Configure SSL certificate
    - _Requirements: 26.5, 26.8_
  
  - [ ] 22.5 Run database migrations in production
    - Execute `bun run db:migrate:deploy` on production database
    - Verify all admin models created successfully
    - _Requirements: 26.13_
  
  - [ ] 22.6 Configure monitoring and logging
    - Set up error tracking (Sentry, DataDog, or New Relic)
    - Configure structured logging in production
    - Set up metrics endpoint for Prometheus
    - _Requirements: 28.13, 28.14_
  
  - [ ] 22.7 Implement IP whitelisting or VPN access
    - Configure firewall rules to restrict admin panel access
    - Set up VPN for admin access if required
    - Document access procedures
    - _Requirements: 26.15_
  
  - [ ] 22.8 Create Docker configuration (optional)
    - Create Dockerfile for admin-fe
    - Configure docker-compose for local development
    - Test containerized deployment
    - _Requirements: 26.10_

- [ ] 23. Phase 10: Documentation
  - [ ] 23.1 Create backend API documentation
    - Add JSDoc comments to all public service functions
    - Document API endpoints with OpenAPI/Swagger annotations
    - Generate Swagger UI documentation
    - Create Postman collection for API testing
    - _Requirements: 27.1, 27.2, 27.13_
  
  - [ ] 23.2 Create backend README
    - Document setup instructions
    - List all environment variables with descriptions
    - Provide API overview with endpoint list
    - Document Permission_Matrix in code comments
    - _Requirements: 27.3, 27.14_
  
  - [ ] 23.3 Create frontend component documentation
    - Add JSDoc comments to all components with prop types
    - Document custom hooks with usage examples
    - Create Storybook documentation for reusable components
    - _Requirements: 27.4, 27.6, 27.12_
  
  - [ ] 23.4 Create frontend README
    - Document setup instructions
    - List all environment variables with descriptions
    - Provide component library overview
    - Document routing structure
    - _Requirements: 27.5_
  
  - [ ] 23.5 Create deployment guide
    - Document production deployment steps
    - Include database migration procedures
    - Document environment configuration
    - Provide troubleshooting guide
    - _Requirements: 27.3, 27.5_
  
  - [ ] 23.6 Create admin user guide
    - Document each admin role and permissions
    - Provide step-by-step guides for common tasks
    - Include screenshots of key interfaces
    - Document best practices
    - _Requirements: 27.15_
  
  - [ ] 23.7 Create developer guide
    - Document architecture and design decisions
    - Provide code organization guidelines
    - Document naming conventions
    - Include examples for adding new features
    - _Requirements: 27.7, 27.8, 27.9, 27.10, 27.11_

- [ ] 24. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties defined in the design document
- The implementation follows a 10-phase approach building from foundation to deployment
- All backend code extends the existing Express app under `backend/src/admin/`
- Frontend is a standalone Vite app in `admin-fe/` directory
- TypeScript is used throughout for type safety
