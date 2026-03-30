# Phase 6 Todos

Last updated: 2026-03-30
Scope: compliance, legal operations, settings, announcements, and change history

## Completed

- [x] Backend: add legal case, takedown, geoblock, and setting-version Prisma schema.
- [x] Backend: add migration for Phase 6 compliance and settings metadata models.
- [x] Backend: add compliance/legal endpoints with status transitions and audit logs.
- [x] Backend: add takedown execution/appeal and geoblock CRUD endpoints.
- [x] Backend: add settings APIs with version history and rollback support.
- [x] Backend: add announcements CRUD endpoints with admin audit tracking.
- [x] Backend: add compliance audit-history endpoint for sensitive actions.
- [x] Frontend: add legal case workspace page.
- [x] Frontend: add takedown and geoblock operations page.
- [x] Frontend: add settings and announcements manager page.
- [x] Frontend: add change history page for sensitive operations.
- [x] Frontend: wire new compliance/settings routes and navigation entries.
- [x] Validation: run backend typecheck with Bun.
- [x] Validation: run admin frontend build with Bun.

## Bun Commands Used

- [x] `bun run db:generate` (backend)
- [x] `bun run typecheck` (backend)
- [x] `bun run build` (admin-frontend)

## Follow-Up

- [x] Add granular role-permission editor UI for assigning analytics/compliance scopes.
- [x] Add compliance export file generation and signed-download support.
