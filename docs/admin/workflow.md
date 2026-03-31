# StreamIt Admin Platform Workflow

Last updated: 2026-03-30
Status: Target workflow and implementation reference

## 1. Non-Negotiable Product Decisions

1. Admin frontend will be a separate application from the normal user frontend.
2. Admin frontend will use the same core stack as the normal frontend.
3. Backend will remain the same existing backend service, extended with admin modules.
4. Existing user and creator flows must continue to work without breaking changes.

## 2. Target System Topology

1. User frontend app and admin frontend app are deployed independently.
2. Both frontend apps call the same backend API service.
3. Admin capabilities are exposed under a dedicated backend namespace: `/api/admin/*`.
4. Backend enforces role-based access and logs every sensitive admin action.

Logical flow:

`User App` -> `Existing API routes`

`Admin App` -> `New /api/admin routes` -> `Same DB (Prisma)` -> `Admin audit and moderation models`

## 3. Dashboard Modules

Admin dashboard includes these modules:

1. User Management
2. Streamer Management
3. Content Moderation (Live + Shorts + Posts)
4. Reports and Complaints
5. Monetization and Wallet
6. Advertisements
7. Analytics
8. Legal and Compliance
9. Settings and Controls

## 4. Role-Based Access Model

Primary roles:

1. Super Admin
2. Moderator
3. Finance Admin
4. Support Admin
5. Compliance Officer

Permission baseline:

| Role | Can Access | Cannot Access |
| --- | --- | --- |
| Super Admin | All modules, role management, system settings | None |
| Moderator | User flags, content moderation, stream actions, reports | Finance operations, payout approvals |
| Finance Admin | Wallet, withdrawals, payment investigations, discount controls | User bans, legal actions |
| Support Admin | User account support, limited profile actions, ticket-linked actions | Hard bans, financial approvals |
| Compliance Officer | Legal requests, takedowns, geo-blocking, data export controls | Payment controls, business analytics config |

## 5. End-to-End Admin Workflows By Module

### 5.1 User Management

Workflow:

1. User events are ingested (new signup, suspicious behavior, repeated reports).
2. Risk score and moderation flags are shown in admin queue.
3. Admin reviews user profile, history, reports, and linked activity.
4. Admin takes action: warn, freeze, suspend (temporary or permanent), restrict chat, or clear.
5. System records action in `AdminActivityLog` and updates affected entities.

Admin actions supported:

1. View all users with filters.
2. See KYC and creator status.
3. See wallet and monetization activity.
4. Freeze account.
5. Permanent ban.
6. Temporary chat suspension.
7. Role changes (only by privileged roles).

### 5.2 Streamer Management (Creator Onboarding)

Workflow:

1. User submits creator application with identity, PAN, bank, selfie, and profile data.
2. Application enters review queue.
3. Admin validates identity and financial details.
4. Admin decision:

- Approve -> creator enabled for live streaming and monetization.
- Reject -> reason logged and user notified.

1. Re-apply cooldown policy is enforced.

Operational controls:

1. Monitor live creator sessions.
2. Issue warnings.
3. Disable creator chat for a period.
4. Force stop stream.
5. Temporarily suspend creator account.

### 5.3 Content Moderation (Live, Shorts, Posts)

Workflow:

1. Content enters platform (live stream, short, post).
2. Automated checks and report signals create moderation priority.
3. Moderator reviews contextual timeline and past violations.
4. Moderator action:

- Dismiss false positive.
- Hide/remove content.
- Add strike and warning.
- Escalate to account action.

1. Every action is audited and visible in moderation history.

### 5.4 Reports and Complaints

Workflow:

1. User submits report with reason and optional evidence.
2. System categorizes and prioritizes reports.
3. Queue is sorted by severity, volume, recency, and reporter trust score.
4. Moderator resolves with disposition: dismissed, warning, remove content, suspend user, legal escalation.
5. Reporter and affected user notification policy is applied.

Report reason groups:

1. Sexual content
2. Violence
3. Spam
4. Copyright
5. Hate speech
6. Harassment
7. Self-harm or safety risk

### 5.5 Monetization and Wallet

Workflow:

1. Coin purchase webhook confirms payment.
2. Coins are credited and ledger is updated.
3. Gifts and commissions are reconciled to creator earnings.
4. Withdrawal requests enter finance review queue.
5. Finance admin approves or rejects with reason.
6. Final settlement and payout state is recorded.

Finance controls:

1. Manual transaction investigation.
2. Fraud hold and release.
3. Commission and policy config (with strict audit trail).
4. Reward and discount code lifecycle controls.

### 5.6 Advertisements

Workflow:

1. Ad campaign is created with creative assets.
2. Audience targeting is configured (region, demographic, category).
3. Budget, CPM, pacing, and frequency cap are set.
4. Campaign goes through review and activation.
5. Delivery and performance are tracked; underperforming campaigns are paused or adjusted.

### 5.7 Analytics

Founder and ops analytics must expose:

1. DAU and MAU.
2. Live concurrent users.
3. Revenue by creator and category.
4. Top shorts and posts.
5. Conversion funnel (viewer to payer).
6. Moderation throughput and SLA metrics.
7. Withdrawal processing time and failure rate.

### 5.8 Legal and Compliance

Workflow:

1. Legal request or policy violation is received.
2. Compliance officer validates scope and legal basis.
3. Action is executed: takedown, geo-block, user data export, retention hold.
4. Case artifacts and approvals are stored.
5. Closure summary is published in compliance ledger.

Controls:

1. Age gate policy enforcement.
2. Community guidelines versioning.
3. Takedown and grievance handling.
4. Data access and export logs.

### 5.9 Settings and Controls

Workflow:

1. Authorized admin proposes setting change.
2. Policy validation and impact review.
3. Change is published with optional scheduled activation.
4. Audit log entry stores old value and new value.
5. Rollback path is available for critical settings.

Settings scope examples:

1. Feature flags.
2. Moderation thresholds.
3. Commission rates.
4. Regional restrictions.
5. Announcement lifecycle.

## 6. Current Backend Reality (Already Present)

The current backend already includes strong foundation pieces:

1. `User.role` with `USER`, `CREATOR`, `ADMIN`, `SUPER_ADMIN`.
2. Admin and moderation data models: `Report`, `AdminActivityLog`, `SystemSetting`, `Announcement`.
3. Creator application workflow and related identity and financial models.
4. Stream reporting pipeline (`StreamReport`) and stream moderation signals.

## 7. Gaps To Close In Backend (Extend Same Backend)

The following must be added in the existing backend codebase:

1. Admin auth middleware (`requireAdmin`, `requireAdminRole`, permission guard).
2. Admin route layer (`/api/admin/*`) and module controllers/services.
3. Report review endpoints and moderation action endpoints.
4. Creator application decision endpoints (approve, reject, re-review).
5. User suspension and restriction APIs with reason and expiry.
6. Withdrawal and finance operation APIs.
7. Centralized admin audit logging utility used by all admin operations.
8. Admin-focused analytics query layer and KPI endpoints.

## 8. Admin Frontend App Strategy (Separate App, Same Stack)

### 8.1 Required Stack

Use the same baseline as the existing normal user frontend:

1. React 19 + TypeScript + Vite.
2. React Router.
3. TanStack Query for server state.
4. Zustand for cross-screen UI state.
5. Tailwind CSS + Radix UI primitives.
6. Axios and Better Auth client integration.

### 8.2 Apple-Style UI Direction (Minimal White and Dark Shades)

Visual principles:

1. Clean hierarchy, high legibility, low visual noise.
2. Neutral palette first, accent colors used sparingly for actions only.
3. Soft elevation and subtle borders instead of bright gradients.
4. Dense data tables balanced with generous whitespace in detail views.

Recommended design tokens:

1. Backgrounds: `#0F0F10`, `#151517`, `#1C1C1F`.
2. Surfaces: `#242428`, `#2C2C31`.
3. Text: `#F5F5F7`, `#D2D2D7`, `#8E8E93`.
4. Accent: `#0A84FF` (primary action), `#30D158` (success), `#FF453A` (danger).

Typography direction:

1. Prefer SF Pro Display and SF Pro Text style typography.
2. Tight vertical rhythm for tables and moderate spacing for forms.
3. Clear heading ladder and consistent numeric formatting.

### 8.3 App Structure

Core route groups for admin app:

1. `/login`
2. `/dashboard`
3. `/users`
4. `/creators/applications`
5. `/moderation/content`
6. `/moderation/reports`
7. `/finance/wallet`
8. `/finance/withdrawals`
9. `/ads/campaigns`
10. `/analytics`
11. `/compliance/cases`
12. `/settings`

## 9. Phased Delivery Plan

### Phase 0: Architecture and Security Foundation

1. Freeze access matrix and approval model.
2. Define admin API contracts and error schema.
3. Set CORS/auth configuration for separate admin frontend origin.

Exit criteria:

1. API contract doc approved.
2. Role and permission matrix approved.
3. Environment and deployment topology approved.

### Phase 1: Backend Admin Core

1. Implement admin middleware and authorization guards.
2. Implement admin route scaffolding with shared audit logger.
3. Build dashboard summary endpoints.

Exit criteria:

1. Unauthorized role access is blocked.
2. All admin actions emit audit events.
3. Admin health and summary endpoints are live.

### Phase 2: User and Creator Operations

1. User management APIs (suspend, unsuspend, chat restrictions, notes).
2. Creator application review APIs (approve, reject, reason, cooldown).
3. Admin UI screens for users and creator queue.

Exit criteria:

1. End-to-end application review works from admin app.
2. Rejection reason and cooldown are enforced.
3. Actions are visible in audit timeline.

### Phase 3: Moderation and Reports

1. Unified moderation queue for posts, shorts, and streams.
2. Report review actions and escalation states.
3. Evidence panel and action history in UI.

Exit criteria:

1. Reports move cleanly through states.
2. Moderator actions update target content and users correctly.
3. SLA and queue health metrics available.

### Phase 4: Monetization and Withdrawals

1. Finance investigation endpoints and ledger views.
2. Withdrawal review and payout state machine.
3. UI for payouts, holds, and decision audit.

Exit criteria:

1. Withdrawal approval flow is operational.
2. Finance actions are permission scoped.
3. Reconciliation checks pass for sample payout cycles.

### Phase 5: Ads and Analytics

1. Ad campaign CRUD, targeting, and status transitions.
2. Founder analytics APIs and dashboards.
3. KPI exports and scheduled reports.

Exit criteria:

1. Campaign lifecycle is fully manageable from admin app.
2. Analytics dashboard matches agreed KPI definitions.
3. Data export path works for authorized roles.

### Phase 6: Compliance and Settings

1. Legal request case management.
2. Geo-block and takedown controls.
3. System settings and announcement management with rollback.

Exit criteria:

1. Compliance case workflow is auditable.
2. Policy and settings changes are versioned.
3. High-risk actions require stricter role checks.

### Phase 7: Hardening and Rollout

1. Security testing, rate limits, and abuse prevention.
2. Production observability dashboards and alerts.
3. Staged rollout by admin role and region.

Exit criteria:

1. Critical path UAT sign-off completed.
2. Error budgets and on-call runbooks are ready.
3. Rollback plan tested.

### Phase 8: Post-Rollout Automation

1. Automate rollout policy management and dry-run simulation workflows.
2. Integrate threshold breach notifications with incident channels.
3. Produce recurring operational digests for finance, moderation, and compliance leads.

Exit criteria:

1. Rollout policy updates are auditable and safe to execute from admin controls.
2. Threshold breaches can notify incident channels without manual polling.
3. Weekly operational summaries are generated from live admin telemetry.

## 10. Definition Of Done For Admin Platform

1. Separate admin frontend is live and uses the same core stack as the user frontend.
2. Backend remains single service and supports new `/api/admin/*` capabilities.
3. Role-based access is enforced everywhere in admin APIs.
4. Every sensitive action is auditable and traceable.
5. Moderator, finance, and compliance workflows are production-ready.
6. Dashboards expose operational and business KPIs.
7. Documentation stays synced with implementation across all phases.
