# Phase 7 Todos

Last updated: 2026-03-30
Scope: hardening, QA readiness, and production operations safeguards

## Completed

- [x] Backend: add high-risk admin endpoint rate limits (suspension, withdrawal review, finance config, compliance mutations).
- [x] Backend: enforce granular compliance scopes across legal, takedown, geoblock, settings, audit, and export endpoints.
- [x] Backend: add security operations summary endpoint for privileged-action observability.
- [x] Frontend: add Security Ops page with queue health, action breakdown, and top-admin activity panels.
- [x] Frontend: wire permissions and security ops routes/navigation into admin shell.
- [x] Validation: run backend typecheck with Bun.
- [x] Validation: run admin frontend build with Bun.

## Remaining

- [ ] Frontend: complete full accessibility pass across all major admin screens (keyboard flow, labels, contrast checks).
- [ ] Frontend: complete responsive QA pass on common moderation/finance/compliance workflows.
- [ ] Backend: optimize heavy list endpoints with profiling-backed query/index tuning where needed.
- [ ] Operations: wire production alerts and runbook links for security summary queues and anomaly thresholds.
- [ ] QA/UAT: execute cross-module sign-off scenarios and controlled rollback drill.

## Bun Commands Used

- [x] `bun run typecheck` (backend)
- [x] `bun run build` (admin-frontend)
