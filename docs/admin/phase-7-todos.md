# Phase 7 Todos

Last updated: 2026-03-31
Scope: hardening, QA readiness, and production operations safeguards

## Completed

- [x] Backend: add high-risk admin endpoint rate limits (suspension, withdrawal review, finance config, compliance mutations).
- [x] Backend: enforce granular compliance scopes across legal, takedown, geoblock, settings, audit, and export endpoints.
- [x] Backend: add security operations summary endpoint for privileged-action observability.
- [x] Frontend: add Security Ops page with queue health, action breakdown, and top-admin activity panels.
- [x] Frontend: wire permissions and security ops routes/navigation into admin shell.
- [x] Frontend: complete accessibility pass for major admin workflows (explicit labels, keyboard selection, skip-link/landmarks).
- [x] Frontend: improve responsive behavior for heavy operational tables and mobile nav overflow.
- [x] Backend: optimize security summary aggregation using database group-by queries (replacing large in-memory log scans).
- [x] Operations: expose configurable queue thresholds and runbook URLs in security summary API + security ops UI.
- [x] Operations: add monitored-action threshold status to security ops board.
- [x] Operations: add staged rollout middleware for admin APIs with role and country gates (`admin.rollout.*` settings).
- [x] Operations: add super-admin rollout status endpoint and security-ops visibility card.
- [x] Validation: run backend typecheck with Bun.
- [x] Validation: run admin frontend build with Bun.

## Remaining

- [ ] QA/UAT: execute cross-module sign-off scenarios and controlled rollback drill using `docs/admin/phase-7-uat-checklist.md`.

## Bun Commands Used

- [x] `bun run typecheck` (backend)
- [x] `bun run build` (admin-frontend)
