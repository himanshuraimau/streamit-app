# Phase 1 Todos

Last updated: 2026-03-30
Scope: foundation, auth, and admin shell

## Completed

- [x] Add backend admin middleware for role-protected access.
- [x] Add admin profile endpoint.
- [x] Add admin dashboard summary endpoint.
- [x] Mount admin route namespace in backend server.
- [x] Create initial admin frontend shell page.
- [x] Wire admin frontend to call admin profile and summary APIs.
- [x] Run backend typecheck.
- [x] Run admin frontend production build validation.

## Next Immediate Todos

- [ ] Add admin permissions matrix helper (module-level permissions).
- [ ] Add dedicated unauthorized page and session-expired flow in admin frontend.
- [ ] Add React Router based route structure in admin frontend.
- [ ] Add TanStack Query and API client abstraction in admin frontend.
- [ ] Add dashboard widgets for queue shortcuts (applications, reports, withdrawals).
- [ ] Add automated tests for admin middleware and controller guards.

## API Endpoints Implemented In This Phase

- [x] GET /api/admin/me
- [x] GET /api/admin/dashboard/summary
