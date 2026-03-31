# Requirements Document: StreamIt Admin Panel

## Introduction

The StreamIt Admin Panel is a comprehensive administrative system for managing the StreamIt live streaming and social media platform. The system provides role-based access control for five distinct admin roles, enabling efficient platform moderation, user management, content oversight, financial operations, and legal compliance. The admin panel consists of a backend extension to the existing Express/Bun/Prisma API under `/api/admin/*` routes and a standalone React 19 frontend application (`admin-fe`) that uses shadcn/ui components throughout.

The admin panel enables platform administrators to monitor live streams, moderate content, manage user accounts, process financial transactions, handle creator applications, manage advertisements, analyze platform metrics, and ensure legal compliance. All administrative actions are logged for audit purposes, and access is strictly controlled through a permission matrix that maps specific capabilities to each admin role.

## Glossary

- **Admin_Panel**: The complete administrative system including backend API routes and frontend application
- **Admin_Backend**: The Express.js API extension under `/api/admin/*` routes that handles all administrative operations
- **Admin_Frontend**: The standalone React 19 application (`admin-fe`) that provides the administrative user interface
- **Better_Auth**: The existing authentication system used by both user and admin authentication
- **RBAC_System**: Role-Based Access Control system that enforces permissions based on admin roles
- **Super_Admin**: Admin role with full system access including role management and platform settings
- **Moderator**: Admin role focused on content moderation, reports, and stream control
- **Finance_Admin**: Admin role managing wallet operations, withdrawals, coin ledger, and ad billing
- **Support_Admin**: Admin role handling user management, account actions, and KYC status
- **Compliance_Officer**: Admin role managing legal requests, geo-blocking, audit logs, and data exports
- **Audit_Log**: System record of all administrative actions for compliance and accountability
- **Permission_Matrix**: Configuration mapping admin roles to allowed operations
- **Admin_Session**: Authenticated session for an admin user validated by Better_Auth
- **Content_Queue**: Collection of flagged content awaiting moderation review
- **Withdrawal_Request**: Creator request to convert earned coins to fiat currency
- **Creator_Application**: Multi-step verification process for users applying to become creators
- **Live_Monitor**: Real-time dashboard showing currently active live streams
- **Geo_Block**: Restriction preventing content access from specific geographic regions
- **Ad_Campaign**: Advertisement configuration with targeting and billing parameters
- **Platform_Settings**: System-wide configuration values managed by Super_Admin
- **shadcn_ui**: UI component library based on Radix UI primitives used throughout Admin_Frontend
- **TanStack_Query**: Data fetching and caching library used for server state management
- **Prisma**: ORM used for database operations in Admin_Backend
- **LiveKit**: Third-party service providing live streaming infrastructure
- **Coin**: Virtual currency unit used in the platform economy
- **Gift_Transaction**: Record of virtual gift sent from viewer to creator during stream
- **Report**: User-submitted complaint about content or behavior requiring admin review
- **Stream_Stats**: Analytics data for a live stream including viewers, likes, and gifts
- **Post**: Social media content including text, images, videos, or shorts
- **Short**: Short-form video content under 60 seconds
- **Ban_Action**: Permanent account suspension preventing all platform access
- **Freeze_Action**: Temporary account suspension with optional expiration date
- **Strike_Action**: Warning issued to user that counts toward potential ban
- **Chat_Disable**: Temporary restriction preventing user from participating in stream chat


## Requirements

### Requirement 1: Admin Authentication System

**User Story:** As a platform administrator, I want to authenticate using the existing Better Auth system with role verification, so that I can securely access admin functions appropriate to my role.

#### Acceptance Criteria

1. WHEN an admin submits valid credentials to `/api/admin/auth/sign-in`, THE Admin_Backend SHALL verify the credentials using Better_Auth
2. WHEN Better_Auth validates the credentials, THE Admin_Backend SHALL verify the user role is one of: super_admin, moderator, finance_admin, support_admin, or compliance_officer
3. IF the user role is not an admin role, THEN THE Admin_Backend SHALL return HTTP 403 Forbidden
4. WHEN authentication succeeds, THE Admin_Backend SHALL create an Admin_Session and return session data including user role
5. WHEN an admin requests `/api/admin/auth/session`, THE Admin_Backend SHALL return the current Admin_Session with role information
6. WHEN an admin requests `/api/admin/auth/sign-out`, THE Admin_Backend SHALL invalidate the Admin_Session
7. THE Admin_Frontend SHALL store Admin_Session data in Zustand state management
8. WHEN Admin_Frontend loads, THE Admin_Frontend SHALL request `/api/admin/auth/session` to rehydrate authentication state
9. WHEN an admin is not authenticated, THE Admin_Frontend SHALL redirect to the login page
10. THE Admin_Frontend SHALL use HTTP-only cookies for session token storage

### Requirement 2: Role-Based Access Control

**User Story:** As a system architect, I want all admin routes protected by role-based permissions, so that admins can only access functions appropriate to their role.

#### Acceptance Criteria

1. THE Admin_Backend SHALL apply authentication middleware to all `/api/admin/*` routes except `/api/admin/auth/*`
2. WHEN a request lacks a valid Admin_Session, THE Admin_Backend SHALL return HTTP 401 Unauthorized
3. THE Admin_Backend SHALL implement a Permission_Matrix mapping each route to allowed admin roles
4. WHEN a request is authenticated, THE Admin_Backend SHALL verify the admin role against the Permission_Matrix for the requested route
5. IF the admin role is not in the allowed roles list, THEN THE Admin_Backend SHALL return HTTP 403 Forbidden
6. THE Admin_Frontend SHALL implement PermissionRoute component that checks user role against allowed roles
7. WHEN an admin navigates to a route they lack permission for, THE Admin_Frontend SHALL redirect to an unauthorized page
8. THE Admin_Frontend SHALL filter sidebar navigation items based on the admin's role permissions
9. THE Admin_Frontend SHALL hide action buttons and UI elements for operations the admin lacks permission to perform
10. FOR ALL administrative actions, parsing the Permission_Matrix then checking permissions then executing the action SHALL produce the same authorization result as checking permissions alone (idempotence property)

### Requirement 3: Audit Logging System

**User Story:** As a compliance officer, I want all administrative actions logged with complete context, so that I can audit platform operations and investigate incidents.

#### Acceptance Criteria

1. WHEN an admin performs a destructive or sensitive action, THE Admin_Backend SHALL create an Audit_Log entry
2. THE Audit_Log entry SHALL include: admin ID, action type, target type, target ID, timestamp, and metadata JSON
3. THE Admin_Backend SHALL log the following action types: user_ban, user_freeze, user_unfreeze, stream_kill, content_remove, withdrawal_approve, withdrawal_reject, application_approve, application_reject, role_change, settings_update, geo_block_create
4. THE Admin_Backend SHALL store Audit_Log entries in the AdminAuditLog database table
5. WHEN a Compliance_Officer requests `/api/admin/compliance/audit-log`, THE Admin_Backend SHALL return paginated Audit_Log entries
6. THE Admin_Backend SHALL support filtering Audit_Log by: admin ID, action type, target type, date range
7. THE Admin_Backend SHALL support sorting Audit_Log by timestamp in ascending or descending order
8. THE Admin_Frontend SHALL display Audit_Log entries in a DataTable with columns: timestamp, admin name, action, target, details
9. THE Admin_Frontend SHALL provide filters for action type, admin, and date range
10. FOR ALL valid Audit_Log entries, writing then reading then writing again SHALL produce identical database state (idempotence property)



### Requirement 4: User Management Module

**User Story:** As a support admin, I want to view and manage user accounts, so that I can handle support requests and enforce platform policies.

#### Acceptance Criteria

1. WHEN a Support_Admin or Super_Admin requests `/api/admin/users`, THE Admin_Backend SHALL return a paginated list of users
2. THE Admin_Backend SHALL support filtering users by: role, suspension status, email, username, registration date range
3. THE Admin_Backend SHALL support sorting users by: registration date, last login date, username
4. WHEN a Support_Admin requests `/api/admin/users/:id`, THE Admin_Backend SHALL return complete user details including: profile, wallet balance, ban history, suspension status, last login IP, and admin notes
5. WHEN a Support_Admin submits a freeze request to `/api/admin/users/:id/freeze`, THE Admin_Backend SHALL update the user isSuspended status and record suspension details
6. THE Admin_Backend SHALL support optional suspension expiration dates for temporary freezes
7. WHEN a Support_Admin submits a ban request to `/api/admin/users/:id/ban`, THE Admin_Backend SHALL permanently suspend the account and create an Audit_Log entry
8. WHEN a Support_Admin submits a chat disable request to `/api/admin/users/:id/chat-disable`, THE Admin_Backend SHALL prevent the user from participating in stream chat for 24 hours
9. WHEN a Support_Admin requests password reset for `/api/admin/users/:id/reset-password`, THE Admin_Backend SHALL generate a password reset token and send it via email
10. THE Admin_Frontend SHALL display users in a DataTable with search, filters, and pagination
11. THE Admin_Frontend SHALL provide action menu for each user with: View Details, Freeze, Ban, Disable Chat, Reset Password
12. WHEN a Support_Admin clicks an action, THE Admin_Frontend SHALL display a confirmation dialog before executing
13. THE Admin_Frontend SHALL display user detail page with tabs for: Profile, Wallet, Activity History, Admin Notes
14. FOR ALL users, the count of users with isSuspended=true SHALL equal the count of users returned by a suspended users filter query (invariant property)

### Requirement 5: Streamer Management Module

**User Story:** As a moderator, I want to manage creator applications and monitor live streams, so that I can ensure quality creators and appropriate content.

#### Acceptance Criteria

1. WHEN a Moderator or Super_Admin requests `/api/admin/streamers/applications`, THE Admin_Backend SHALL return paginated creator applications with status PENDING or UNDER_REVIEW
2. WHEN a Moderator requests `/api/admin/streamers/applications/:id`, THE Admin_Backend SHALL return complete application details including: identity verification documents, financial details, profile information, and submission timestamp
3. WHEN a Moderator submits approval to `/api/admin/streamers/applications/:id/approve`, THE Admin_Backend SHALL update application status to APPROVED, update user role to CREATOR, and create an Audit_Log entry
4. WHEN a Moderator submits rejection to `/api/admin/streamers/applications/:id/reject` with a reason, THE Admin_Backend SHALL update application status to REJECTED, store the rejection reason, and create an Audit_Log entry
5. WHEN a Moderator requests `/api/admin/streamers/live`, THE Admin_Backend SHALL return all currently active streams with isLive=true
6. THE Admin_Backend SHALL include in live stream data: streamer name, title, viewer count, duration, category, and thumbnail
7. WHEN a Moderator submits kill stream request to `/api/admin/streamers/:id/kill-stream`, THE Admin_Backend SHALL terminate the LiveKit room, set isLive to false, and create an Audit_Log entry
8. WHEN a Moderator submits mute request to `/api/admin/streamers/:id/mute`, THE Admin_Backend SHALL disable the streamer's audio in the LiveKit room
9. WHEN a Moderator submits disable chat request to `/api/admin/streamers/:id/disable-chat`, THE Admin_Backend SHALL set isChatEnabled to false for the stream
10. WHEN a Moderator submits warning to `/api/admin/streamers/:id/warn`, THE Admin_Backend SHALL send a notification to the streamer and create an Audit_Log entry
11. WHEN a Moderator submits suspension to `/api/admin/streamers/:id/suspend`, THE Admin_Backend SHALL freeze the user account and terminate any active stream
12. THE Admin_Frontend SHALL display applications in a DataTable with columns: applicant name, submission date, status, and actions
13. WHEN a Moderator clicks an application row, THE Admin_Frontend SHALL open a Sheet component displaying full application details with uploaded documents
14. THE Admin_Frontend SHALL display live streams in a grid of cards with real-time viewer counts
15. THE Admin_Frontend SHALL refresh live stream data every 10 seconds using TanStack_Query refetchInterval
16. THE Admin_Frontend SHALL provide action menu for each live stream with: Kill Stream, Mute, Disable Chat, Warn, Suspend
17. FOR ALL creator applications, approving then checking user role SHALL return CREATOR, and rejecting then checking application status SHALL return REJECTED (state transition property)



### Requirement 6: Content Moderation Module

**User Story:** As a moderator, I want to review flagged content and take appropriate actions, so that I can maintain platform content standards.

#### Acceptance Criteria

1. WHEN a Moderator requests `/api/admin/moderation/queue`, THE Admin_Backend SHALL return paginated content with isFlagged=true or flagCount greater than 0
2. THE Admin_Backend SHALL support filtering Content_Queue by: content type (post, short, stream), category, flag count threshold, date range
3. THE Admin_Backend SHALL support sorting Content_Queue by: flag count, creation date, last flagged date
4. WHEN a Moderator requests `/api/admin/moderation/:contentId`, THE Admin_Backend SHALL return complete content details including: author, media URLs, flag reasons, flag count, and reporter information
5. WHEN a Moderator submits dismiss action to `/api/admin/moderation/:contentId/action`, THE Admin_Backend SHALL set isFlagged to false and reset flagCount to 0
6. WHEN a Moderator submits warn action, THE Admin_Backend SHALL send a warning notification to the content author and create an Audit_Log entry
7. WHEN a Moderator submits remove action, THE Admin_Backend SHALL set isHidden to true, record the removal reason, and create an Audit_Log entry
8. WHEN a Moderator submits strike action, THE Admin_Backend SHALL increment the author's strike count, send a notification, and create an Audit_Log entry
9. WHEN a Moderator submits ban action, THE Admin_Backend SHALL permanently suspend the author's account, hide all their content, and create an Audit_Log entry
10. WHEN a Moderator requests `/api/admin/moderation/shorts`, THE Admin_Backend SHALL return posts with isShort=true and type=VIDEO
11. WHEN a Moderator requests `/api/admin/moderation/posts`, THE Admin_Backend SHALL return posts with isShort=false
12. THE Admin_Frontend SHALL display Content_Queue in a DataTable with columns: content preview, author, type, flags, date, actions
13. THE Admin_Frontend SHALL provide Tabs for: All Content, Shorts, Posts, Streams
14. WHEN a Moderator clicks content, THE Admin_Frontend SHALL display a modal with content preview, flag details, and action buttons
15. THE Admin_Frontend SHALL provide action buttons: Dismiss, Warn, Remove, Strike, Ban
16. WHEN a Moderator selects Strike or Ban, THE Admin_Frontend SHALL display a confirmation AlertDialog
17. FOR ALL content with isHidden=true, the content SHALL NOT appear in public feeds (invariant property)
18. FOR ALL moderation actions, performing the same action twice SHALL produce the same final state as performing it once (idempotence property)

### Requirement 7: Reports and Complaints Module

**User Story:** As a support admin, I want to review user reports and resolve complaints, so that I can address user concerns and enforce community guidelines.

#### Acceptance Criteria

1. WHEN a Support_Admin requests `/api/admin/reports`, THE Admin_Backend SHALL return paginated reports with status PENDING or UNDER_REVIEW
2. THE Admin_Backend SHALL support filtering reports by: reason category, status, reporter ID, reported user ID, date range
3. THE Admin_Backend SHALL support sorting reports by: creation date, priority, report count for same content
4. WHEN a Support_Admin requests `/api/admin/reports/:id`, THE Admin_Backend SHALL return complete report details including: reporter information, reported user information, reported content, reason, description, and submission timestamp
5. THE Admin_Backend SHALL include reporter history showing previous reports submitted by the same user
6. THE Admin_Backend SHALL include reported user history showing previous reports against the same user
7. WHEN a Support_Admin submits resolve action to `/api/admin/reports/:id/resolve`, THE Admin_Backend SHALL update status to RESOLVED, record the action taken, store admin notes, and create an Audit_Log entry
8. THE Admin_Backend SHALL support resolution actions: dismiss, warning_sent, content_removed, user_suspended, user_banned
9. WHEN a Support_Admin requests `/api/admin/reports/audit-log`, THE Admin_Backend SHALL return all report resolutions with admin actions and timestamps
10. THE Admin_Frontend SHALL display reports in a DataTable with columns: reporter, target, category, priority badge, report count, date, status
11. THE Admin_Frontend SHALL use Badge components with color coding for priority: high (red), medium (yellow), low (gray)
12. WHEN a Support_Admin clicks a report, THE Admin_Frontend SHALL navigate to a detail page showing full report context
13. THE Admin_Frontend SHALL display reported content preview with appropriate media rendering
14. THE Admin_Frontend SHALL provide action Select dropdown with resolution options and Textarea for admin notes
15. WHEN a Support_Admin submits resolution, THE Admin_Frontend SHALL display confirmation dialog and invalidate report queries
16. FOR ALL reports, the count of RESOLVED reports plus PENDING reports plus DISMISSED reports SHALL equal the total report count (invariant property)



### Requirement 8: Monetization and Wallet Module

**User Story:** As a finance admin, I want to manage coin transactions and process withdrawal requests, so that I can ensure accurate financial operations.

#### Acceptance Criteria

1. WHEN a Finance_Admin requests `/api/admin/monetization/ledger`, THE Admin_Backend SHALL return paginated coin purchase records from CoinPurchase table
2. THE Admin_Backend SHALL support filtering ledger by: user ID, date range, status, amount range, payment gateway
3. THE Admin_Backend SHALL support sorting ledger by: purchase date, amount, status
4. THE Admin_Backend SHALL include in ledger records: user name, package name, coins purchased, bonus coins, total amount, payment status, transaction ID, timestamp
5. WHEN a Finance_Admin requests `/api/admin/monetization/withdrawals`, THE Admin_Backend SHALL return paginated withdrawal requests from CreatorWithdrawalRequest table
6. THE Admin_Backend SHALL support filtering withdrawals by: status, creator ID, date range, amount range
7. THE Admin_Backend SHALL include in withdrawal records: creator name, amount in coins, converted amount in currency, bank details, request date, status
8. WHEN a Finance_Admin submits approval to `/api/admin/monetization/withdrawals/:id/approve`, THE Admin_Backend SHALL update status to APPROVED, record approval timestamp, deduct coins from creator wallet, and create an Audit_Log entry
9. WHEN a Finance_Admin submits rejection to `/api/admin/monetization/withdrawals/:id/reject` with a reason, THE Admin_Backend SHALL update status to REJECTED, record rejection reason, and create an Audit_Log entry
10. WHEN a Finance_Admin requests `/api/admin/monetization/gifts`, THE Admin_Backend SHALL return paginated gift transactions from GiftTransaction table
11. THE Admin_Backend SHALL include in gift records: sender name, receiver name, gift name, coin amount, quantity, stream context, timestamp
12. WHEN a Finance_Admin requests `/api/admin/monetization/wallets/:userId`, THE Admin_Backend SHALL return wallet details including: current balance, total earned, total spent, recent transactions
13. THE Admin_Frontend SHALL display ledger in a DataTable with columns: user, package, coins, amount, status, date
14. THE Admin_Frontend SHALL display withdrawals in a DataTable with Tabs for: Pending, Approved, Rejected
15. THE Admin_Frontend SHALL provide action buttons for pending withdrawals: Approve, Reject
16. WHEN a Finance_Admin clicks Approve, THE Admin_Frontend SHALL display AlertDialog confirmation showing withdrawal details
17. WHEN a Finance_Admin clicks Reject, THE Admin_Frontend SHALL display Dialog with Textarea for rejection reason
18. THE Admin_Frontend SHALL display gift transactions in a DataTable with filters for date range and amount
19. FOR ALL withdrawal approvals, the creator's wallet balance after approval SHALL equal the balance before approval minus the withdrawal amount (invariant property)
20. FOR ALL coin purchases with status COMPLETED, the user's wallet balance SHALL include the purchased coins (invariant property)

### Requirement 9: Advertisement Management Module

**User Story:** As a finance admin, I want to create and manage advertisement campaigns, so that I can monetize the platform through targeted advertising.

#### Acceptance Criteria

1. WHEN a Finance_Admin requests `/api/admin/ads`, THE Admin_Backend SHALL return paginated ad campaigns from AdCreative table
2. THE Admin_Backend SHALL support filtering ads by: status (active/inactive), target region, category, date range
3. THE Admin_Backend SHALL support sorting ads by: creation date, CPM, impressions
4. WHEN a Finance_Admin submits new ad to `/api/admin/ads`, THE Admin_Backend SHALL validate ad data, upload creative to S3, create AdCreative record, and return the created ad
5. THE Admin_Backend SHALL validate ad data includes: title, media file, target regions array, CPM value, frequency cap
6. WHEN a Finance_Admin submits update to `/api/admin/ads/:id`, THE Admin_Backend SHALL update the AdCreative record and create an Audit_Log entry
7. WHEN a Finance_Admin submits delete to `/api/admin/ads/:id`, THE Admin_Backend SHALL set isActive to false and create an Audit_Log entry
8. WHEN a Finance_Admin requests `/api/admin/ads/:id/performance`, THE Admin_Backend SHALL return analytics including: impressions, clicks, CTR, total spend, average CPM
9. THE Admin_Frontend SHALL display ads in a DataTable with columns: title, status badge, regions, CPM, created date, actions
10. WHEN a Finance_Admin clicks Create Ad, THE Admin_Frontend SHALL navigate to AdEditorPage with a Form
11. THE AdEditorPage Form SHALL include fields: title Input, creative file upload, target regions MultiSelect, target gender Select, category MultiSelect, CPM number Input, frequency cap number Input, active Switch
12. THE Admin_Frontend SHALL upload ad creative directly to S3 using presigned URL
13. WHEN a Finance_Admin submits the form, THE Admin_Frontend SHALL validate using Zod schema and POST to `/api/admin/ads`
14. WHEN a Finance_Admin clicks an ad row, THE Admin_Frontend SHALL navigate to edit mode with pre-filled form
15. THE Admin_Frontend SHALL display performance metrics in Card components with charts using Recharts
16. FOR ALL ads with isActive=true, the ad SHALL be eligible for serving in the ad delivery system (invariant property)



### Requirement 10: Analytics and Reporting Module

**User Story:** As a super admin, I want to view platform analytics and metrics, so that I can monitor platform health and make data-driven decisions.

#### Acceptance Criteria

1. WHEN a Super_Admin requests `/api/admin/analytics/overview` with a date range parameter, THE Admin_Backend SHALL return aggregate metrics for the specified period
2. THE Admin_Backend SHALL calculate and return: DAU (daily active users), MAU (monthly active users), concurrent live viewers, total revenue, conversion rate (viewers to gift buyers)
3. THE Admin_Backend SHALL support date range parameters: today, 7days, 30days, 90days, custom
4. WHEN a Super_Admin requests `/api/admin/analytics/streamers`, THE Admin_Backend SHALL return top streamers ranked by revenue with earnings data
5. THE Admin_Backend SHALL include for each streamer: name, total revenue, gift count, average viewers, stream hours
6. WHEN a Super_Admin requests `/api/admin/analytics/content`, THE Admin_Backend SHALL return top performing content ranked by engagement
7. THE Admin_Backend SHALL include metrics for: top shorts by views, top posts by likes, top streams by peak viewers
8. WHEN a Super_Admin requests `/api/admin/analytics/conversion`, THE Admin_Backend SHALL return funnel data showing: total viewers, viewers who sent gifts, average gift value, conversion percentage
9. THE Admin_Frontend SHALL display overview metrics in StatCard components showing: metric value, change percentage, trend indicator
10. THE Admin_Frontend SHALL provide date range Select with options: Today, Last 7 Days, Last 30 Days, Last 90 Days
11. THE Admin_Frontend SHALL display DAU/MAU trend using Recharts AreaChart
12. THE Admin_Frontend SHALL display revenue per streamer using Recharts BarChart showing top 10 streamers
13. THE Admin_Frontend SHALL display top content using Recharts BarChart with separate charts for shorts, posts, and streams
14. THE Admin_Frontend SHALL display conversion funnel using visual funnel representation or stat cards
15. THE Admin_Frontend SHALL refresh analytics data when date range changes
16. FOR ALL analytics queries, the sum of individual user revenues SHALL equal the total platform revenue (invariant property)
17. FOR ALL date ranges, DAU SHALL be less than or equal to MAU (invariant property)

### Requirement 11: Compliance and Legal Module

**User Story:** As a compliance officer, I want to manage legal requests and compliance operations, so that I can ensure platform adherence to regulations.

#### Acceptance Criteria

1. WHEN a Compliance_Officer requests `/api/admin/compliance/audit-log`, THE Admin_Backend SHALL return paginated Audit_Log entries with all administrative actions
2. THE Admin_Backend SHALL support filtering audit log by: admin ID, action type, target type, date range
3. WHEN a Compliance_Officer submits geo-block request to `/api/admin/compliance/geo-block`, THE Admin_Backend SHALL create a GeoBlock record with region and optional content ID
4. THE Admin_Backend SHALL validate region parameter against ISO country codes
5. WHEN a geo-block is created, THE Admin_Backend SHALL prevent content access from the specified region
6. WHEN a Compliance_Officer requests `/api/admin/compliance/export` with user ID, THE Admin_Backend SHALL generate a complete data export including: user profile, posts, comments, transactions, streams
7. THE Admin_Backend SHALL format data export as JSON conforming to GDPR and IT Rules requirements
8. THE Admin_Backend SHALL create an Audit_Log entry for each data export request
9. WHEN a Compliance_Officer requests `/api/admin/compliance/takedowns`, THE Admin_Backend SHALL return all content with isHidden=true and hiddenReason containing legal keywords
10. THE Admin_Frontend SHALL display audit log in a DataTable with columns: timestamp, admin, action, target, details
11. THE Admin_Frontend SHALL provide comprehensive filters for audit log: action type Select, admin Select, date range picker
12. THE Admin_Frontend SHALL display geo-block interface with region Select and optional content ID Input
13. WHEN a Compliance_Officer submits geo-block, THE Admin_Frontend SHALL display confirmation dialog and create the block
14. THE Admin_Frontend SHALL display data export interface with user search and export button
15. WHEN a Compliance_Officer requests export, THE Admin_Frontend SHALL trigger download of JSON file
16. THE Admin_Frontend SHALL display takedowns in a DataTable with content preview and legal reason
17. FOR ALL geo-blocks, content access from blocked regions SHALL return access denied (invariant property)
18. FOR ALL data exports, re-exporting the same user data SHALL produce equivalent JSON structure (idempotence property)



### Requirement 12: Platform Settings Module

**User Story:** As a super admin, I want to configure platform-wide settings, so that I can control system behavior and features.

#### Acceptance Criteria

1. WHEN a Super_Admin requests `/api/admin/settings`, THE Admin_Backend SHALL return all SystemSetting records
2. THE Admin_Backend SHALL organize settings by category: general, moderation, monetization, streaming, compliance
3. WHEN a Super_Admin submits update to `/api/admin/settings`, THE Admin_Backend SHALL validate setting values, update SystemSetting records, record updatedBy admin ID, and create an Audit_Log entry
4. THE Admin_Backend SHALL validate setting values against defined constraints for each setting key
5. THE Admin_Backend SHALL support setting types: boolean, number, string, JSON
6. THE Admin_Backend SHALL include settings for: minimum withdrawal amount, platform fee percentage, maximum stream duration, content flag threshold, auto-ban strike count
7. WHEN a Super_Admin requests `/api/admin/settings/admins`, THE Admin_Backend SHALL return all users with admin roles
8. WHEN a Super_Admin submits create admin to `/api/admin/settings/admins`, THE Admin_Backend SHALL create a new user account with specified admin role and send credentials via email
9. WHEN a Super_Admin submits role change to `/api/admin/settings/admins/:id/role`, THE Admin_Backend SHALL update the user role and create an Audit_Log entry
10. WHEN a Super_Admin submits delete to `/api/admin/settings/admins/:id`, THE Admin_Backend SHALL remove admin role or delete account and create an Audit_Log entry
11. THE Admin_Frontend SHALL display settings in a Form with sections for each category
12. THE Admin_Frontend SHALL use appropriate input components: Switch for boolean, Input for number/string, Textarea for JSON
13. WHEN a Super_Admin modifies settings, THE Admin_Frontend SHALL validate using Zod schema before submission
14. THE Admin_Frontend SHALL display admin roles in a DataTable with columns: name, email, role badge, created date, actions
15. WHEN a Super_Admin clicks Create Admin, THE Admin_Frontend SHALL display Dialog with Form for: name, email, role Select
16. WHEN a Super_Admin clicks change role, THE Admin_Frontend SHALL display Dialog with role Select
17. WHEN a Super_Admin clicks delete admin, THE Admin_Frontend SHALL display AlertDialog confirmation
18. FOR ALL settings updates, reading the setting after update SHALL return the updated value (state consistency property)
19. FOR ALL admin role changes, the user's permissions SHALL immediately reflect the new role (invariant property)

### Requirement 13: Admin Frontend Layout and Navigation

**User Story:** As an admin user, I want a consistent layout with role-based navigation, so that I can efficiently access the functions I need.

#### Acceptance Criteria

1. THE Admin_Frontend SHALL use shadcn_ui Sidebar component for navigation
2. THE Admin_Frontend SHALL implement AdminLayout component wrapping all authenticated routes
3. THE AdminLayout SHALL include: AppSidebar, TopBar, and main content area
4. THE AppSidebar SHALL display navigation items filtered by the admin's role permissions
5. THE AppSidebar SHALL use Collapsible components for nested navigation groups
6. THE AppSidebar SHALL highlight the active route using SidebarMenuButton isActive prop
7. THE AppSidebar SHALL display admin user information in SidebarFooter with sign out option
8. THE TopBar SHALL display breadcrumb navigation using shadcn_ui Breadcrumb component
9. THE TopBar SHALL include SidebarTrigger for collapsing/expanding sidebar
10. THE TopBar SHALL display notification bell showing count of pending items (reports, withdrawals)
11. THE TopBar SHALL include theme toggle using ModeToggle component
12. THE Admin_Frontend SHALL support collapsible sidebar with icon-only mode
13. THE Admin_Frontend SHALL persist sidebar collapsed state in localStorage
14. THE Admin_Frontend SHALL use SidebarProvider to manage sidebar state
15. THE Admin_Frontend SHALL implement responsive layout adapting to mobile, tablet, and desktop viewports
16. FOR ALL navigation items, clicking an item SHALL navigate to the corresponding route (state transition property)



### Requirement 14: Data Table Component System

**User Story:** As a frontend developer, I want a reusable DataTable component, so that I can consistently display tabular data across all admin modules.

#### Acceptance Criteria

1. THE Admin_Frontend SHALL implement a DataTable component using TanStack Table v8 and shadcn_ui Table components
2. THE DataTable component SHALL accept generic type parameters for data and column definitions
3. THE DataTable component SHALL support column sorting with visual indicators
4. THE DataTable component SHALL support pagination with configurable page size
5. THE DataTable component SHALL display loading skeletons when isLoading prop is true
6. THE DataTable component SHALL support row selection with checkbox column
7. THE DataTable component SHALL accept toolbar slot for search and filter controls
8. THE DataTable component SHALL display empty state when data array is empty
9. THE DataTable component SHALL support custom cell renderers via column definitions
10. THE DataTable component SHALL integrate with TanStack_Query for server-side pagination
11. THE DataTable component SHALL call onPaginationChange callback when page changes
12. THE DataTable component SHALL display page information showing current range and total count
13. THE Admin_Frontend SHALL use DataTable component in: UsersPage, ApplicationsPage, ReportsPage, ModerationQueuePage, WithdrawalsPage, LedgerPage, GiftTransactionsPage, AdsPage, AuditLogPage
14. FOR ALL DataTable instances, the displayed row count SHALL match the length of the data array (invariant property)

### Requirement 15: Form Handling and Validation

**User Story:** As a frontend developer, I want consistent form handling with validation, so that I can ensure data quality and provide good user experience.

#### Acceptance Criteria

1. THE Admin_Frontend SHALL use React Hook Form for all form state management
2. THE Admin_Frontend SHALL use Zod schemas for form validation
3. THE Admin_Frontend SHALL use shadcn_ui Form components: Form, FormField, FormItem, FormLabel, FormControl, FormMessage
4. WHEN a form field has validation errors, THE Admin_Frontend SHALL display error messages using FormMessage component
5. THE Admin_Frontend SHALL disable submit buttons while form submission is in progress
6. WHEN form submission succeeds, THE Admin_Frontend SHALL display success toast using Sonner
7. WHEN form submission fails, THE Admin_Frontend SHALL display error toast with error message
8. THE Admin_Frontend SHALL implement forms in: LoginPage, AdEditorPage, SettingsPage, CreateAdminDialog, RejectApplicationDialog, ResolveReportDialog
9. THE Admin_Frontend SHALL validate required fields, email formats, number ranges, and string lengths
10. THE Admin_Frontend SHALL provide real-time validation feedback as users type
11. FOR ALL forms, submitting invalid data SHALL display validation errors without making API requests (error condition property)

### Requirement 16: Real-Time Updates and Polling

**User Story:** As a moderator, I want real-time updates for live streams and pending items, so that I can respond quickly to platform events.

#### Acceptance Criteria

1. WHEN viewing LiveMonitorPage, THE Admin_Frontend SHALL poll `/api/admin/streamers/live` every 10 seconds using TanStack_Query refetchInterval
2. WHEN viewing ModerationQueuePage, THE Admin_Frontend SHALL poll `/api/admin/moderation/queue` every 30 seconds
3. WHEN viewing ReportsPage with status filter PENDING, THE Admin_Frontend SHALL poll `/api/admin/reports` every 30 seconds
4. WHEN viewing WithdrawalsPage with status filter PENDING, THE Admin_Frontend SHALL poll `/api/admin/monetization/withdrawals` every 60 seconds
5. THE Admin_Frontend SHALL display notification bell badge count based on: pending reports count plus pending withdrawals count
6. THE Admin_Frontend SHALL update notification count every 60 seconds
7. WHEN an admin navigates away from a page, THE Admin_Frontend SHALL stop polling for that page's data
8. THE Admin_Frontend SHALL use TanStack_Query staleTime and cacheTime to optimize polling behavior
9. FOR ALL polling queries, the data SHALL reflect the current server state within the polling interval (eventual consistency property)



### Requirement 17: Backend API Architecture

**User Story:** As a backend developer, I want a modular admin API architecture, so that I can maintain and extend admin functionality efficiently.

#### Acceptance Criteria

1. THE Admin_Backend SHALL organize all admin code in `backend/src/admin/` directory
2. THE Admin_Backend SHALL implement separate controller files for each module: admin-auth.controller.ts, user-mgmt.controller.ts, streamer-mgmt.controller.ts, content-mod.controller.ts, reports.controller.ts, monetization.controller.ts, ads.controller.ts, analytics.controller.ts, compliance.controller.ts, settings.controller.ts
3. THE Admin_Backend SHALL implement separate service files for each module containing business logic
4. THE Admin_Backend SHALL implement separate route files for each module defining API endpoints
5. THE Admin_Backend SHALL implement validation schemas using Zod for all request payloads
6. THE Admin_Backend SHALL register all admin routes under `/api/admin/*` prefix in index.ts
7. THE Admin_Backend SHALL apply adminAuthMiddleware to all `/api/admin/*` routes except auth routes
8. THE Admin_Backend SHALL apply requirePermission middleware to each route group with appropriate role arrays
9. THE Admin_Backend SHALL use Prisma client from `lib/db.ts` for all database operations
10. THE Admin_Backend SHALL use Better_Auth from `lib/auth.ts` for session validation
11. THE Admin_Backend SHALL implement error handling middleware returning consistent error response format
12. THE Admin_Backend SHALL validate all request parameters and body data before processing
13. THE Admin_Backend SHALL return appropriate HTTP status codes: 200 for success, 400 for validation errors, 401 for authentication errors, 403 for authorization errors, 404 for not found, 500 for server errors
14. FOR ALL admin routes, requests without valid Admin_Session SHALL return 401 Unauthorized (security property)

### Requirement 18: Database Schema Extensions

**User Story:** As a database administrator, I want proper schema extensions for admin features, so that I can support all admin operations with data integrity.

#### Acceptance Criteria

1. THE Admin_Backend SHALL use AdminAuditLog model with fields: id, adminId, action, targetType, targetId, metadata, createdAt
2. THE Admin_Backend SHALL use AdCreative model with fields: id, title, mediaUrl, targetRegion, targetGender, category, cpm, frequencyCap, isActive, createdAt, updatedAt
3. THE Admin_Backend SHALL use GeoBlock model with fields: id, region, contentId, reason, createdAt
4. THE Admin_Backend SHALL extend User model with admin fields: role, isSuspended, suspendedReason, suspendedBy, suspendedAt, suspensionExpiresAt, adminNotes, lastLoginAt, lastLoginIp
5. THE Admin_Backend SHALL use existing CreatorApplication model for application management
6. THE Admin_Backend SHALL use existing Report model for report management
7. THE Admin_Backend SHALL use existing CreatorWithdrawalRequest model for withdrawal management
8. THE Admin_Backend SHALL use existing SystemSetting model for platform settings
9. THE Admin_Backend SHALL create database indexes on: User.role, User.isSuspended, AdminAuditLog.adminId, AdminAuditLog.action, AdminAuditLog.createdAt, Report.status, CreatorWithdrawalRequest.status
10. THE Admin_Backend SHALL enforce foreign key constraints for: AdminAuditLog.adminId references User.id, GeoBlock.contentId references Post.id
11. FOR ALL database operations, concurrent updates to the same record SHALL use transactions to prevent race conditions (concurrency property)

### Requirement 19: API Response Pagination

**User Story:** As a backend developer, I want consistent pagination for all list endpoints, so that I can handle large datasets efficiently.

#### Acceptance Criteria

1. THE Admin_Backend SHALL support pagination query parameters: page (default 1), pageSize (default 20)
2. THE Admin_Backend SHALL validate page is a positive integer
3. THE Admin_Backend SHALL validate pageSize is between 1 and 100
4. THE Admin_Backend SHALL return paginated response format with fields: data, pagination
5. THE pagination object SHALL include: currentPage, pageSize, totalCount, totalPages, hasNextPage, hasPreviousPage
6. THE Admin_Backend SHALL calculate totalPages as ceiling of totalCount divided by pageSize
7. THE Admin_Backend SHALL set hasNextPage to true when currentPage is less than totalPages
8. THE Admin_Backend SHALL set hasPreviousPage to true when currentPage is greater than 1
9. THE Admin_Backend SHALL apply pagination to endpoints: `/api/admin/users`, `/api/admin/streamers/applications`, `/api/admin/moderation/queue`, `/api/admin/reports`, `/api/admin/monetization/ledger`, `/api/admin/monetization/withdrawals`, `/api/admin/monetization/gifts`, `/api/admin/ads`, `/api/admin/compliance/audit-log`
10. FOR ALL paginated responses, the sum of items across all pages SHALL equal totalCount (invariant property)



### Requirement 20: Search and Filtering

**User Story:** As an admin user, I want to search and filter data in all list views, so that I can quickly find specific records.

#### Acceptance Criteria

1. THE Admin_Backend SHALL support search query parameter for text-based searching
2. THE Admin_Backend SHALL implement case-insensitive search using Prisma contains or search mode
3. THE Admin_Backend SHALL support filtering by multiple criteria using query parameters
4. WHEN filtering users, THE Admin_Backend SHALL support filters: role, isSuspended, email, username, createdAt range
5. WHEN filtering applications, THE Admin_Backend SHALL support filters: status, submittedAt range
6. WHEN filtering reports, THE Admin_Backend SHALL support filters: reason, status, reporterId, reportedUserId, createdAt range
7. WHEN filtering withdrawals, THE Admin_Backend SHALL support filters: status, userId, requestedAt range, amountCoins range
8. WHEN filtering audit log, THE Admin_Backend SHALL support filters: adminId, action, targetType, createdAt range
9. THE Admin_Frontend SHALL implement FilterBar component with shadcn_ui Input for search and Select components for filters
10. THE Admin_Frontend SHALL debounce search input by 300ms before triggering query
11. THE Admin_Frontend SHALL update URL query parameters when filters change
12. THE Admin_Frontend SHALL restore filter state from URL query parameters on page load
13. THE Admin_Frontend SHALL display active filter badges with clear buttons
14. WHEN filters are cleared, THE Admin_Frontend SHALL reset to default unfiltered view
15. FOR ALL search queries, the results SHALL include only records matching all active filter criteria (filter composition property)

### Requirement 21: Error Handling and User Feedback

**User Story:** As an admin user, I want clear error messages and feedback, so that I understand what happened and can take appropriate action.

#### Acceptance Criteria

1. WHEN an API request fails with 400 status, THE Admin_Frontend SHALL display validation error messages from response
2. WHEN an API request fails with 401 status, THE Admin_Frontend SHALL redirect to login page
3. WHEN an API request fails with 403 status, THE Admin_Frontend SHALL redirect to unauthorized page
4. WHEN an API request fails with 404 status, THE Admin_Frontend SHALL display "Resource not found" message
5. WHEN an API request fails with 500 status, THE Admin_Frontend SHALL display "Server error occurred" message
6. WHEN a mutation succeeds, THE Admin_Frontend SHALL display success toast with action description
7. WHEN a mutation fails, THE Admin_Frontend SHALL display error toast with error message
8. THE Admin_Frontend SHALL use Sonner toast library for all notifications
9. THE Admin_Frontend SHALL display loading states using shadcn_ui Skeleton components
10. THE Admin_Frontend SHALL display empty states with helpful messages and suggested actions
11. THE Admin_Frontend SHALL implement error boundaries to catch React errors
12. WHEN an error boundary catches an error, THE Admin_Frontend SHALL display error page with option to reload
13. THE Admin_Backend SHALL return error responses with format: { error: string, details?: object }
14. THE Admin_Backend SHALL log all 500 errors to console with stack traces
15. FOR ALL user actions, the system SHALL provide feedback within 200ms (responsiveness property)

### Requirement 22: Security and Access Control

**User Story:** As a security engineer, I want comprehensive security measures, so that I can protect admin functions from unauthorized access.

#### Acceptance Criteria

1. THE Admin_Backend SHALL validate all admin sessions using Better_Auth session verification
2. THE Admin_Backend SHALL verify admin role on every request to `/api/admin/*` routes
3. THE Admin_Backend SHALL use HTTP-only cookies for session tokens
4. THE Admin_Backend SHALL set secure flag on cookies in production environment
5. THE Admin_Backend SHALL implement CORS policy allowing only ADMIN_FRONTEND_URL origin
6. THE Admin_Backend SHALL validate and sanitize all user input to prevent injection attacks
7. THE Admin_Backend SHALL use Prisma parameterized queries to prevent SQL injection
8. THE Admin_Backend SHALL rate limit admin API endpoints to prevent abuse
9. THE Admin_Backend SHALL log all failed authentication attempts
10. THE Admin_Backend SHALL implement session timeout of 24 hours
11. THE Admin_Frontend SHALL clear session data on logout
12. THE Admin_Frontend SHALL not store sensitive data in localStorage
13. THE Admin_Frontend SHALL implement Content Security Policy headers
14. THE Admin_Frontend SHALL validate all user input before submission
15. FOR ALL admin operations, the system SHALL verify both authentication and authorization before execution (security invariant)



### Requirement 23: Performance Optimization

**User Story:** As a platform user, I want the admin panel to load quickly and respond smoothly, so that I can work efficiently.

#### Acceptance Criteria

1. THE Admin_Frontend SHALL implement code splitting using React.lazy for all page components
2. THE Admin_Frontend SHALL wrap lazy-loaded components in Suspense with loading fallback
3. THE Admin_Frontend SHALL use TanStack_Query caching to minimize redundant API requests
4. THE Admin_Frontend SHALL set appropriate staleTime values: 5 minutes for static data, 30 seconds for dynamic data
5. THE Admin_Frontend SHALL prefetch data for likely next navigation using TanStack_Query prefetchQuery
6. THE Admin_Frontend SHALL implement virtual scrolling for lists exceeding 100 items
7. THE Admin_Frontend SHALL optimize images using appropriate formats and lazy loading
8. THE Admin_Frontend SHALL minimize bundle size by tree-shaking unused code
9. THE Admin_Backend SHALL implement database query optimization using appropriate indexes
10. THE Admin_Backend SHALL use Prisma select to fetch only required fields
11. THE Admin_Backend SHALL implement query result caching for expensive analytics queries
12. THE Admin_Backend SHALL use database connection pooling
13. THE Admin_Backend SHALL implement pagination for all list queries to limit result set size
14. WHEN loading initial page, THE Admin_Frontend SHALL display content within 2 seconds on standard connection
15. FOR ALL list queries, response time SHALL be under 500ms for datasets under 10000 records (performance property)

### Requirement 24: Responsive Design and Accessibility

**User Story:** As an admin user, I want the admin panel to work on different devices and be accessible, so that I can work from anywhere and all users can access it.

#### Acceptance Criteria

1. THE Admin_Frontend SHALL implement responsive layout adapting to viewport widths: mobile (< 640px), tablet (640px - 1024px), desktop (> 1024px)
2. THE Admin_Frontend SHALL use mobile-first CSS approach with min-width media queries
3. THE Admin_Frontend SHALL collapse sidebar to icon-only mode on mobile viewports
4. THE Admin_Frontend SHALL stack form fields vertically on mobile viewports
5. THE Admin_Frontend SHALL use responsive DataTable with horizontal scroll on mobile
6. THE Admin_Frontend SHALL implement touch-friendly tap targets with minimum 44x44px size
7. THE Admin_Frontend SHALL use semantic HTML elements for proper document structure
8. THE Admin_Frontend SHALL provide ARIA labels for all interactive elements
9. THE Admin_Frontend SHALL support keyboard navigation for all functions
10. THE Admin_Frontend SHALL implement focus management for modals and dialogs
11. THE Admin_Frontend SHALL provide sufficient color contrast meeting WCAG AA standards
12. THE Admin_Frontend SHALL support screen readers with appropriate ARIA attributes
13. THE Admin_Frontend SHALL not rely solely on color to convey information
14. THE Admin_Frontend SHALL provide text alternatives for all non-text content
15. FOR ALL interactive elements, keyboard navigation SHALL provide equivalent functionality to mouse interaction (accessibility property)

### Requirement 25: Testing and Quality Assurance

**User Story:** As a quality engineer, I want comprehensive testing capabilities, so that I can ensure system reliability and correctness.

#### Acceptance Criteria

1. THE Admin_Backend SHALL support property-based testing for all service functions
2. THE Admin_Backend SHALL implement round-trip property tests for: audit log write/read, settings update/read, user ban/unban
3. THE Admin_Backend SHALL implement invariant property tests for: wallet balance calculations, report status transitions, permission checks
4. THE Admin_Backend SHALL implement idempotence property tests for: freeze user, approve withdrawal, dismiss report
5. THE Admin_Backend SHALL implement metamorphic property tests for: filtered queries return subset of unfiltered queries, paginated results sum to total count
6. THE Admin_Frontend SHALL support component testing using React Testing Library
7. THE Admin_Frontend SHALL test user interactions: form submission, button clicks, navigation
8. THE Admin_Frontend SHALL test error states and loading states
9. THE Admin_Frontend SHALL test permission-based rendering
10. THE Admin_Frontend SHALL implement integration tests for critical user flows: login, user management, withdrawal approval
11. THE Admin_Backend SHALL achieve minimum 80% code coverage for service layer
12. THE Admin_Backend SHALL implement API endpoint tests for all routes
13. THE Admin_Backend SHALL test authentication and authorization middleware
14. THE Admin_Backend SHALL test error handling and validation
15. FOR ALL critical operations, property-based tests SHALL verify correctness properties hold for randomly generated inputs (correctness property)



### Requirement 26: Deployment and Environment Configuration

**User Story:** As a DevOps engineer, I want clear deployment configuration, so that I can deploy the admin panel to production environments.

#### Acceptance Criteria

1. THE Admin_Backend SHALL read ADMIN_FRONTEND_URL from environment variables
2. THE Admin_Backend SHALL include ADMIN_FRONTEND_URL in CORS allowed origins
3. THE Admin_Backend SHALL use existing backend deployment process without separate server
4. THE Admin_Frontend SHALL read VITE_API_URL from environment variables
5. THE Admin_Frontend SHALL support separate deployment from user frontend
6. THE Admin_Frontend SHALL build production bundle using `bun run build`
7. THE Admin_Frontend SHALL serve static files from `dist/` directory
8. THE Admin_Frontend SHALL support deployment to: Vercel, Netlify, AWS S3 + CloudFront, Nginx
9. THE Admin_Frontend SHALL configure production environment with: production API URL, production domain
10. THE Admin_Frontend SHALL implement Docker configuration for containerized deployment
11. THE Admin_Frontend SHALL use environment-specific configuration files
12. THE Admin_Backend SHALL support production deployment with: DATABASE_URL, BETTER_AUTH_SECRET, AWS credentials, LiveKit credentials
13. THE Admin_Backend SHALL run database migrations before deployment using `bun run db:migrate:deploy`
14. THE Admin_Backend SHALL use production-grade logging in production environment
15. FOR ALL deployments, the admin panel SHALL be accessible only from authorized IP addresses or VPN in production (security property)

### Requirement 27: Documentation and Developer Experience

**User Story:** As a developer, I want comprehensive documentation, so that I can understand and extend the admin panel.

#### Acceptance Criteria

1. THE Admin_Backend SHALL include JSDoc comments for all public service functions
2. THE Admin_Backend SHALL document API endpoints using OpenAPI/Swagger annotations
3. THE Admin_Backend SHALL provide README with: setup instructions, environment variables, API overview
4. THE Admin_Frontend SHALL include component documentation with prop types and usage examples
5. THE Admin_Frontend SHALL provide README with: setup instructions, environment variables, component library
6. THE Admin_Frontend SHALL document custom hooks with usage examples
7. THE Admin_Frontend SHALL use TypeScript for type safety and IDE support
8. THE Admin_Backend SHALL use TypeScript for type safety and IDE support
9. THE Admin_Backend SHALL export shared types for frontend consumption
10. THE Admin_Frontend SHALL use consistent naming conventions: PascalCase for components, camelCase for functions
11. THE Admin_Backend SHALL use consistent naming conventions: kebab-case for files, camelCase for functions
12. THE Admin_Frontend SHALL provide Storybook documentation for reusable components
13. THE Admin_Backend SHALL provide Postman collection for API testing
14. THE Admin_Backend SHALL document Permission_Matrix in code comments
15. FOR ALL public APIs, documentation SHALL include: description, parameters, return types, example usage (documentation property)

### Requirement 28: Monitoring and Observability

**User Story:** As a platform operator, I want monitoring and logging capabilities, so that I can track system health and diagnose issues.

#### Acceptance Criteria

1. THE Admin_Backend SHALL log all admin actions to console with: timestamp, admin ID, action type, target
2. THE Admin_Backend SHALL log all API errors with: error message, stack trace, request context
3. THE Admin_Backend SHALL implement health check endpoint at `/api/admin/health`
4. THE Admin_Backend SHALL include in health check: database connectivity, API status, timestamp
5. THE Admin_Backend SHALL track API response times for performance monitoring
6. THE Admin_Backend SHALL implement structured logging with log levels: error, warn, info, debug
7. THE Admin_Backend SHALL log authentication failures with: attempted email, IP address, timestamp
8. THE Admin_Backend SHALL log authorization failures with: admin ID, attempted route, timestamp
9. THE Admin_Frontend SHALL implement error tracking using error boundaries
10. THE Admin_Frontend SHALL log client-side errors to console with: error message, component stack, user context
11. THE Admin_Frontend SHALL track user interactions for analytics: page views, button clicks, form submissions
12. THE Admin_Frontend SHALL implement performance monitoring for: page load time, API request duration, render time
13. THE Admin_Backend SHALL support integration with monitoring services: Sentry, DataDog, New Relic
14. THE Admin_Backend SHALL expose metrics endpoint for Prometheus scraping
15. FOR ALL production errors, the system SHALL log sufficient context to reproduce and diagnose the issue (observability property)



### Requirement 29: Data Integrity and Consistency

**User Story:** As a database administrator, I want data integrity guarantees, so that I can ensure consistent and reliable data.

#### Acceptance Criteria

1. THE Admin_Backend SHALL use database transactions for multi-step operations
2. WHEN approving a withdrawal, THE Admin_Backend SHALL execute in a transaction: update withdrawal status, deduct wallet balance, create audit log
3. WHEN banning a user, THE Admin_Backend SHALL execute in a transaction: update user status, hide all content, terminate active streams, create audit log
4. WHEN approving creator application, THE Admin_Backend SHALL execute in a transaction: update application status, update user role, create audit log
5. THE Admin_Backend SHALL implement optimistic locking for concurrent updates using Prisma version fields
6. THE Admin_Backend SHALL validate foreign key references before creating related records
7. THE Admin_Backend SHALL enforce database constraints: NOT NULL, UNIQUE, CHECK constraints
8. THE Admin_Backend SHALL validate enum values against defined enum types
9. THE Admin_Backend SHALL implement cascading deletes for dependent records
10. THE Admin_Backend SHALL prevent deletion of records referenced by audit logs
11. THE Admin_Backend SHALL validate data consistency before committing transactions
12. WHEN a transaction fails, THE Admin_Backend SHALL rollback all changes
13. THE Admin_Backend SHALL log transaction failures with: operation, error, affected records
14. THE Admin_Backend SHALL implement retry logic for transient database errors
15. FOR ALL multi-step operations, either all steps SHALL complete successfully or all changes SHALL be rolled back (atomicity property)

### Requirement 30: Scalability and Future Extensions

**User Story:** As a system architect, I want the admin panel designed for scalability, so that I can add new features without major refactoring.

#### Acceptance Criteria

1. THE Admin_Backend SHALL organize code by feature modules with clear boundaries
2. THE Admin_Backend SHALL implement service layer abstraction separating business logic from controllers
3. THE Admin_Backend SHALL use dependency injection for service dependencies
4. THE Admin_Backend SHALL implement repository pattern for database access
5. THE Admin_Backend SHALL support adding new admin roles by updating Permission_Matrix configuration
6. THE Admin_Backend SHALL support adding new modules by creating new controller/service/route files
7. THE Admin_Frontend SHALL implement feature-based folder structure
8. THE Admin_Frontend SHALL use composition pattern for reusable UI components
9. THE Admin_Frontend SHALL implement plugin architecture for extending functionality
10. THE Admin_Frontend SHALL support adding new routes by updating router configuration
11. THE Admin_Frontend SHALL support adding new navigation items by updating NAV_ITEMS configuration
12. THE Admin_Backend SHALL implement API versioning strategy for backward compatibility
13. THE Admin_Backend SHALL support horizontal scaling with stateless API design
14. THE Admin_Backend SHALL implement caching layer for frequently accessed data
15. FOR ALL new features, adding functionality SHALL NOT require modifying existing feature code (open/closed principle)

---

## Correctness Properties Summary

This section summarizes the key correctness properties that should be verified through property-based testing:

### Invariant Properties
- User wallet balance = total earned - total spent - total withdrawn
- Content with isHidden=true does not appear in public feeds
- DAU ≤ MAU for all time periods
- Sum of individual revenues = total platform revenue
- Suspended users count = count of users with isSuspended=true
- Resolved + Pending + Dismissed reports = total reports

### Round-Trip Properties
- Write audit log → read audit log → write again produces identical state
- Update setting → read setting returns updated value
- Ban user → check status returns banned → unban → check status returns active

### Idempotence Properties
- Freezing a frozen account produces same state
- Approving an approved withdrawal produces same state
- Dismissing a dismissed report produces same state
- Applying same filter twice returns same results

### Metamorphic Properties
- Filtered query results ⊆ unfiltered query results
- Sum of paginated results = total count
- Sorted results contain same items as unsorted results

### State Transition Properties
- Approve application → user role becomes CREATOR
- Reject application → application status becomes REJECTED
- Ban user → user cannot authenticate
- Approve withdrawal → wallet balance decreases by withdrawal amount

### Error Condition Properties
- Invalid credentials → authentication fails
- Insufficient permissions → authorization fails
- Invalid input → validation error returned
- Missing required fields → 400 Bad Request

### Concurrency Properties
- Concurrent wallet updates use transactions to prevent race conditions
- Concurrent withdrawal approvals prevent double-spending
- Concurrent role changes maintain consistency

---

## Notes

This requirements document defines the complete functional requirements for the StreamIt Admin Panel. All requirements follow EARS patterns and INCOSE quality rules for clarity, testability, and completeness. The system is designed to extend the existing StreamIt backend and provide a comprehensive administrative interface for platform management.

The requirements emphasize:
- Role-based access control with five distinct admin roles
- Comprehensive audit logging for compliance
- Modular architecture for maintainability and scalability
- Property-based testing for correctness verification
- Security and data integrity throughout
- Consistent user experience using shadcn/ui components
- Performance optimization and responsive design

Implementation should proceed in phases, starting with core authentication and RBAC, then building out individual modules while maintaining the architectural principles defined in these requirements.
