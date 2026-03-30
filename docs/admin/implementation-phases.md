# Admin Frontend And Backend Phase Execution Docs

Last updated: 2026-03-30
Primary companion: `workflow.md`

## 1. Execution Objective

This document is the execution blueprint to build the admin platform in phases.

Rules to follow:

1. Admin frontend is a separate app from the user frontend.
2. Admin frontend uses the same frontend stack family as current user app.
3. Backend stays in the same existing backend service and is extended in-place.
4. Every admin action must be auditable.

## 2. Canonical Stack Baseline

### Frontend Stack (Admin App)

Use the same baseline as current frontend:

1. React 19
2. TypeScript 5
3. Vite 7
4. React Router 7
5. TanStack Query 5
6. Zustand 5
7. Tailwind CSS 4
8. Radix UI primitives
9. Better Auth client
10. Axios

Design direction:

1. Apple-style minimal interface.
2. Neutral dark and soft white shades.
3. Clean spacing, low-noise surfaces, clear hierarchy.

### Backend Stack (Same Existing Service)

Do not create a new backend service. Extend current backend with:

1. Bun runtime
2. Express 5
3. TypeScript
4. Prisma 6
5. PostgreSQL
6. Better Auth
7. LiveKit SDK
8. Dodo Payments SDK
9. AWS S3 SDK
10. Resend

## 3. Start Commands For Execution

### Backend (Bun)

```bash
cd backend
bun install
bun run db:generate
bun run db:migrate
bun run dev
```

Validation commands:

```bash
bun run typecheck
bun run lint
```

### Frontend (Current User Frontend)

```bash
cd frontend
npm install
npm run dev
```

Admin app should use the same workflow once scaffolded.

## 4. Phase Plan (Frontend Then Backend For Every Phase)

## Phase 1: Foundation, Auth, And Admin Shell

### Frontend Scope

1. Scaffold separate admin app (React + TypeScript + Vite).
2. Build admin auth flow and protected routing.
3. Create app shell: sidebar, topbar, content workspace.
4. Set Apple-style base tokens (minimal dark + soft white + restrained accent).
5. Add dashboard landing page with module cards.

### Backend Scope

1. Create admin authorization middleware (`requireAdmin`, role guard).
2. Create admin route namespace (`/api/admin/*`).
3. Build `GET /api/admin/me` and `GET /api/admin/dashboard/summary`.
4. Add shared admin audit logging helper.
5. Add CORS and auth origin support for separate admin app.

### Exit Criteria

1. Admin can sign in and open dashboard shell.
2. Non-admin users cannot access admin APIs.
3. Admin requests are audited.

## Phase 2: User Management And Creator Application Review

### Frontend Scope

1. Build users list page with filters, search, and pagination.
2. Build user detail panel (status, notes, moderation timeline).
3. Build creator application queue page.
4. Build review UI with approve/reject and required reason inputs.

### Backend Scope

1. Add users listing and detail endpoints for admins.
2. Add user actions endpoints (suspend, unsuspend, chat restriction, notes).
3. Add creator application queue endpoint.
4. Add approve/reject endpoints with reason and cooldown handling.
5. Log all actions in audit log.

### Exit Criteria

1. Creator application review works end to end.
2. User moderation actions work with role constraints.
3. Rejection reason and re-apply cooldown are enforced.

## Phase 3: Content Moderation And Reports

### Frontend Scope

1. Build moderation queue for posts, shorts, streams, comments.
2. Build report detail page with evidence and action history.
3. Build one-click moderator actions with confirmation patterns.
4. Build moderation metrics widget (pending, overdue, resolved).

### Backend Scope

1. Build unified report listing endpoint with severity and state filters.
2. Build report action endpoints (dismiss, hide/remove, strike, suspend, escalate).
3. Build moderation state transitions with SLA timestamps.
4. Build stream-specific report review endpoints.
5. Audit every moderation decision.

### Exit Criteria

1. Reports can be triaged and resolved in the admin UI.
2. Actions update user/content state correctly.
3. Full moderation history is searchable.

## Phase 4: Finance, Wallet, And Withdrawals

### Frontend Scope

1. Build finance dashboard (wallet totals, pending settlements, anomalies).
2. Build withdrawal queue and review panel.
3. Build transaction investigation screen.
4. Build decision capture UX (approve/reject/hold with reason).

### Backend Scope

1. Build wallet and transaction admin endpoints.
2. Build withdrawal lifecycle endpoints and state machine.
3. Build fraud hold and release operations.
4. Build commission configuration endpoint with strict role checks.
5. Build payout reconciliation query endpoints.

### Exit Criteria

1. Withdrawal review and resolution is fully operational.
2. Finance actions are limited to authorized roles.
3. Reconciliation checks pass.

## Phase 5: Advertisement Controls And Analytics

### Frontend Scope

1. Build ad campaign management UI.
2. Build targeting and scheduling screens.
3. Build analytics dashboards (DAU, MAU, revenue, conversion).
4. Build export controls for authorized users.

### Backend Scope

1. Build campaign CRUD and campaign status transitions.
2. Build targeting validation and delivery configuration.
3. Build campaign performance endpoints (impressions, CTR, spend, CPM).
4. Build founder KPI endpoints and trend summaries.

### Exit Criteria

1. Ad lifecycle is manageable from admin app.
2. Analytics dashboards are populated from backend APIs.
3. Export controls are role-safe.

## Phase 6: Compliance, Legal, And Settings

### Frontend Scope

1. Build legal case workspace.
2. Build takedown and geo-block operations UI.
3. Build system settings and announcements manager.
4. Build change history view for sensitive operations.

### Backend Scope

1. Build legal case endpoints and status transitions.
2. Build takedown, geo-block, and legal export actions.
3. Build settings and announcement APIs with versioning metadata.
4. Build rollback support for critical settings.

### Exit Criteria

1. Compliance operations are auditable and structured.
2. High-risk actions are protected by strict permissions.
3. Settings changes are reversible in staging.

## Phase 7: Hardening, QA, And Production Rollout

### Frontend Scope

1. Accessibility pass for all major admin screens.
2. Responsive pass for common operations viewports.
3. Error-state and empty-state consistency pass.
4. Final UX polish pass for Apple-style clarity and minimalism.

### Backend Scope

1. Performance optimization for admin list and analytics endpoints.
2. Rate limits for high-risk endpoints.
3. Security audit for authz gaps and privilege escalation paths.
4. Observability dashboards and production alerts.

### Exit Criteria

1. UAT sign-off across moderation, finance, and compliance.
2. Runbooks and on-call alerting are active.
3. Controlled rollout and rollback are validated.

## 5. Dependency Order

1. Phase 1 must complete before all other phases.
2. Phase 2 and Phase 3 can run in parallel after Phase 1 APIs are stable.
3. Phase 4 depends on Phase 2 role model and audit logging.
4. Phase 5 depends on Phase 1 dashboard and Phase 4 finance data quality.
5. Phase 6 depends on core authz and audit baselines from Phase 1.
6. Phase 7 depends on completion of all previous phases.

## 6. Immediate Execution Checklist (Week 1 Kickoff)

1. Finalize admin app folder location and naming.
2. Implement backend admin middleware and `/api/admin/me`.
3. Scaffold admin app shell and auth guard.
4. Implement dashboard summary endpoint and UI widgets.
5. Set up CI checks for Bun backend typecheck and lint.
