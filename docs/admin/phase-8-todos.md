# Phase 8 Todos

Last updated: 2026-03-31
Scope: post-rollout automation, release governance, and ongoing operations maturity

## Completed

- [x] Backend: add rollout status endpoint with role/country simulation support (`GET /api/admin/ops/rollout-status`).
- [x] Frontend: add rollout simulation controls in Security Ops page for role and country dry-runs.
- [x] Backend: add super-admin rollout policy update endpoint with strict validation and audit metadata (`PATCH /api/admin/ops/rollout-policy`).
- [x] Frontend: add rollout policy editor UI (safe-guarded with confirmation + impact preview).
- [x] Operations: integrate alert-routing hooks for breached security thresholds (`POST /api/admin/ops/security-alerts/dispatch` + Security Ops relay controls).
- [x] Operations: add weekly ops digest CSV export for queue pressure, privileged actions, and rollout decisions (`GET /api/admin/ops/security-digest/export`).
- [x] Docs: prepare Phase 8 shadow-drill and incident rehearsal runbook (`docs/admin/phase-8-shadow-drill-checklist.md`).
- [x] Docs: define Phase 8 execution scope and kick off implementation tracker.

## Remaining

- [ ] QA/UAT: execute `docs/admin/phase-8-shadow-drill-checklist.md` and collect sign-offs.

## Bun Commands Used

- [x] `bun run typecheck` (backend)
- [x] `bun run build` (admin-frontend)
