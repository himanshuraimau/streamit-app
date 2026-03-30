# Phase 3 Todos

Last updated: 2026-03-30
Scope: moderation queue and report action workflows

## Completed

- [x] Backend: content reports listing endpoint (`/api/admin/moderation/reports`).
- [x] Backend: content report review endpoint (`/api/admin/moderation/reports/:reportId/review`).
- [x] Backend: stream reports listing endpoint (`/api/admin/moderation/stream-reports`).
- [x] Backend: stream report review endpoint (`/api/admin/moderation/stream-reports/:streamReportId/review`).
- [x] Backend: moderation decisions wired for dismiss, resolve, hide post, hide comment, suspend reported user.
- [x] Backend: audit logging added for moderation actions.
- [x] Frontend: moderation queue page added.
- [x] Frontend: content report actions wired to review API.
- [x] Frontend: stream report actions wired to review API.
- [x] Frontend: moderation route added to admin navigation.
- [x] Validation: backend typecheck with Bun passed.
- [x] Validation: admin frontend build with Bun passed.

## Bun Commands Used

- [x] `bun run typecheck` (backend)
- [x] `bun run build` (admin-frontend)

## Next Phase Candidate (Phase 4)

- [ ] Backend: finance dashboard endpoints.
- [ ] Backend: withdrawal queue and decision APIs.
- [ ] Backend: reconciliation and anomaly endpoints.
- [ ] Frontend: finance dashboard page.
- [ ] Frontend: withdrawals review page.
- [ ] Add tests for moderation actions and permission edge cases.
