# Phase 1 Todos

Last updated: 2026-03-31
Scope: foundation, auth, and admin shell

## Completed

- [x] Add backend admin middleware for role-protected access.
- [x] Add admin profile endpoint.
- [x] Add admin dashboard summary endpoint.
- [x] Mount admin route namespace in backend server.
- [x] Create initial admin frontend shell page.
- [x] Add React Router based route structure in admin frontend.
- [x] Add TanStack Query and API client abstraction in admin frontend.
- [x] Add admin permissions matrix helper (module-level permissions UI + API).
- [x] Add dedicated unauthorized page and session-expired flow in admin frontend.
- [x] Add dashboard widgets for queue shortcuts (applications, reports, withdrawals).
- [x] Wire admin frontend to call admin profile and summary APIs.
- [x] Run backend typecheck.
- [x] Run admin frontend production build validation.

## Remaining

- [x] Test backlog deferred for this delivery track (per current no-tests execution directive).

## API Endpoints Implemented In This Phase

- [x] GET /api/admin/me
- [x] GET /api/admin/dashboard/summary
