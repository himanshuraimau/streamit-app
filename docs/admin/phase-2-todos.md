# Phase 2 Todos

Last updated: 2026-03-31
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

## Cross-Phase Follow-Through

- [x] Backend: unified reports queue endpoint with severity sorting.
- [x] Backend: report action endpoints (dismiss/hide/escalate).
- [x] Backend: stream report review endpoints for moderation.
- [x] Frontend: moderation queue page.
- [x] Frontend: report detail and action panel.
- [x] Test backlog deferred for this delivery track (per current no-tests execution directive).
