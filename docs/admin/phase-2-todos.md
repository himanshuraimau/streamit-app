# Phase 2 Todos

Last updated: 2026-03-30
Scope: user management and creator application review

## Completed

- [x] Backend: list users endpoint with filters and pagination.
- [x] Backend: user detail endpoint.
- [x] Backend: suspend/unsuspend user endpoint with reason validation.
- [x] Backend: list creator applications endpoint.
- [x] Backend: approve creator application endpoint.
- [x] Backend: reject creator application endpoint with reason validation.
- [x] Backend: audit logging for suspension and creator decisions.
- [x] Frontend: route-based admin shell for phased modules.
- [x] Frontend: users management screen wired to backend APIs.
- [x] Frontend: creator applications review screen wired to backend APIs.
- [x] Frontend: React Query integration for list/detail/mutation flows.
- [x] Validation: backend typecheck using Bun.
- [x] Validation: admin frontend build using Bun.

## Bun Commands Used

- [x] `bun add react-router-dom @tanstack/react-query` (admin frontend)
- [x] `bun run typecheck` (backend)
- [x] `bun run build` (admin frontend)

## Next Phase Candidate (Phase 3)

- [ ] Backend: unified reports queue endpoint with severity sorting.
- [ ] Backend: report action endpoints (dismiss/hide/escalate).
- [ ] Backend: stream report review endpoints for moderation.
- [ ] Frontend: moderation queue page.
- [ ] Frontend: report detail and action panel.
- [ ] Add tests for new admin controller operations.
