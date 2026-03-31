# StreamIt Admin Dashboard Guide

## Overview
The StreamIt Admin Dashboard is a comprehensive control plane for managing users, content moderation, financial operations, advertising campaigns, compliance, and system settings.

## Access & Authentication

### Promoting Users to Admin

Before accessing the admin dashboard, you need to promote a user to admin role:

**Option 1: Promote Existing User**
```bash
# Navigate to backend directory
cd backend

# Promote user to ADMIN role
bun run admin:promote user@example.com

# Promote user to SUPER_ADMIN role
bun run admin:promote user@example.com SUPER_ADMIN
```

**Option 2: Create New Test Admin User**
```bash
# Navigate to backend directory
cd backend

# Create test admin with ADMIN role
bun run admin:promote --create admin@test.com password123

# Create test admin with SUPER_ADMIN role
bun run admin:promote --create admin@test.com password123 SUPER_ADMIN
```

The script will:
- Find the user by email (or create new user with --create)
- Update their role in the database
- Display confirmation with user details and login credentials
- Show the admin dashboard URL

### How to Access
1. **URL**: Navigate to `http://localhost:5174` (development) or your deployed admin URL
2. **Login**: Click "Sign In with StreamIt Account" - redirects to main app OAuth flow
3. **Requirements**: Account must have `ADMIN` or `SUPER_ADMIN` role
4. **Session**: Uses HTTP-only cookies for secure session management

### Environment Setup
```bash
# admin-frontend/.env
VITE_API_URL=http://localhost:3000  # Backend API URL
```

**Note**: Admin frontend runs on port **5174** (different from main frontend on 5173)

### First Time Setup
```bash
cd admin-frontend
bun install
bun run dev  # Starts on http://localhost:5174
```

## Dashboard Structure

### Main Navigation (Left Sidebar)
- **Dashboard** - Operations snapshot and quick links
- **Users** - User management and suspension controls
- **Creator Applications** - Review and approve/reject creator requests
- **Moderation** - Content and stream report queues
- **Finance** - Wallet, transactions, withdrawals, reconciliation
- **Advertising** - Campaign management and analytics
- **Legal & Compliance** - Legal cases, takedowns, geo-blocks
- **Settings** - System configuration and announcements
- **Audit History** - Compliance change tracking
- **Permissions** - Admin scope management
- **Security** - Monitoring and rollout policies

## Key Features by Section

### 1. Dashboard (`/`)
- Real-time metrics: users, creators, reports, streams
- Quick access to pending queues
- Admin session info

### 2. Users (`/users`)
- Search and filter users by role/status
- View user details, wallet balance, creator status
- Suspend/unsuspend users with reason tracking

### 3. Creator Applications (`/creators/applications`)
- Review pending creator applications
- View identity, financial, and profile verification
- Approve or reject with reason

### 4. Moderation (`/moderation/reports`)
- **Content Reports**: Review reported posts/comments/users
- **Stream Reports**: Handle live stream violations
- Actions: Dismiss, resolve, hide content, suspend users

### 5. Finance (`/finance/wallet`, `/finance/withdrawals`)
- **Summary**: Platform financial health metrics
- **Transactions**: Purchase, gift, withdrawal history with CSV export
- **Withdrawals**: Review and approve/reject/hold withdrawal requests
- **Commission Config**: Update platform commission rates
- **Reconciliation**: Financial reconciliation reports with CSV export

### 6. Advertising (`/ads/campaigns`, `/analytics/founder`)
- **Campaigns**: Create, manage, pause/resume ad campaigns
- **Analytics**: Campaign performance metrics (impressions, CTR, spend)
- **Founder KPIs**: Platform-wide growth and monetization metrics
- **Alerts**: Low CTR and overspend warnings

### 7. Legal & Compliance
- **Legal Cases** (`/compliance/legal-cases`): Track copyright, policy, regulatory cases
- **Takedowns** (`/compliance/takedowns`): Execute content takedown orders
- **Geo-Blocks** (`/compliance/geoblocks`): Manage geographic content restrictions

### 8. Settings (`/settings/system`, `/settings/announcements`)
- **System Settings**: Key-value config with version history and rollback
- **Announcements**: Platform-wide announcements with role targeting and scheduling

### 9. Audit History (`/compliance/audit-history`)
- Complete audit trail of sensitive admin actions
- Filter by action type, target, admin
- Secure CSV export with signed tokens

### 10. Permissions (`/permissions/scopes`)
- Manage admin analytics and compliance scopes
- Granular access control per admin

### 11. Security (`/ops/security-summary`)
- Monitor pending queues and admin activity
- Configure rollout policies by role/country
- Alert dispatch to Slack/PagerDuty

## Common Workflows

### Approve a Creator
1. Navigate to **Creator Applications**
2. Filter by "Pending/Under Review"
3. Click application to review details
4. Click **Approve** or **Reject** (with reason)

### Handle Content Report
1. Navigate to **Moderation** → **Content Reports**
2. Review report details and reported content
3. Choose action: Dismiss, Resolve, Hide Content, or Suspend User
4. Add resolution note (optional)

### Process Withdrawal
1. Navigate to **Finance** → **Withdrawals**
2. Filter by "Pending" status
3. Review withdrawal details and user info
4. Click **Approve**, **Reject**, **Hold**, or **Mark Paid**
5. Add reason/payout reference

### Create Announcement
1. Navigate to **Settings** → **Announcements**
2. Fill in title, content, type
3. Set target role (optional) and schedule window
4. Toggle active/pinned status
5. Click **Create Announcement**

### Export Audit History
1. Navigate to **Audit History**
2. Set date range and filters
3. Click **Generate Signed Export**
4. Click **Download Export** (token expires in configured minutes)

## Technical Architecture

### Frontend Stack
- **React 19** + **TypeScript** + **Vite**
- **TanStack Query** for data fetching
- **React Router** for navigation
- **Tailwind CSS** + **shadcn/ui** components

### Modular Page Structure
Each page follows a consistent pattern:
```
src/pages/<feature>/
├── types.ts              # TypeScript interfaces
├── constants.ts          # Static data and enums
├── utils.ts              # Helper functions
├── use<Feature>PageController.ts  # State and business logic
├── <Feature>Page.tsx     # Main orchestration component
└── components/           # Feature-specific components
    ├── <Section>.tsx
    └── <Dialog>.tsx
```

### Shared Components
- `AdminSectionCard` - Consistent section layout
- `AdminNotice` - Inline notifications
- `AdminPaginationControls` - Pagination UI
- `AdminMetricCard` - Metric display

### API Integration
All API calls go through `src/lib/admin-api.ts` with:
- Type-safe request/response interfaces
- Automatic cookie-based authentication
- Consistent error handling

## Security Features
- **Session-based auth** with HTTP-only cookies
- **Role-based access** (ADMIN/SUPER_ADMIN)
- **Audit logging** for all sensitive actions
- **CSRF protection** via SameSite cookies
- **Signed export tokens** for data downloads

## Development Tips
- Use `bunx tsc -b` to check TypeScript errors
- All pages preserve TanStack Query behavior
- No `window.prompt/alert/confirm` - use dialogs
- Reuse shared admin components for consistency
- Follow established modular architecture pattern

## Support
For issues or questions, contact the development team or check the main repository documentation.
