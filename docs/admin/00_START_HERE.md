# Admin Execution Start Here

Last updated: 2026-03-30

If you are starting implementation now, use docs in this order:

1. `workflow.md` - Product workflow, module boundaries, role model, and target operating model.
2. `implementation-phases.md` - Phase-by-phase execution with Frontend first and Backend second.

## Project Architecture Rules

1. Admin frontend is a separate app.
2. Admin frontend uses the same stack family as the existing user frontend.
3. Backend remains the same existing backend service and is extended in-place.
4. Admin APIs must be exposed under `/api/admin/*`.

## Canonical Stack

### Frontend (Admin App)

1. React 19
2. TypeScript 5
3. Vite 7
4. React Router 7
5. TanStack Query 5
6. Zustand 5
7. Tailwind CSS 4
8. Radix UI
9. Better Auth client
10. Axios

### Backend (Existing Service)

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

## Start Commands

### Backend (Bun)

```bash
cd backend
bun install
bun run db:generate
bun run db:migrate
bun run dev
```

### Frontend (Current User App Baseline)

```bash
cd frontend
npm install
npm run dev
```

Use the same frontend workflow for the separate admin app once scaffolded.

## Implementation Order

1. Phase 1 foundation and auth.
2. Phase 2 user and creator ops.
3. Phase 3 moderation and reports.
4. Phase 4 finance and withdrawals.
5. Phase 5 ads and analytics.
6. Phase 6 compliance and settings.
7. Phase 7 hardening and rollout.

## UI Direction Reminder

1. Apple-style minimal visual system.
2. Neutral dark and soft white shades.
3. Clean, sparse surfaces with high legibility.
4. Restrained accent usage for action states only.
