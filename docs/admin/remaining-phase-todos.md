# Remaining Phase Todos

Last updated: 2026-03-31
Scope: only open tasks after Phase 1 to Phase 8 implementation

## Manual Sign-Off Tasks

- [ ] Phase 7: execute QA/UAT and rollback checklist (`docs/admin/phase-7-uat-checklist.md`).
- [ ] Phase 8: execute rollout shadow drill and incident rehearsal checklist (`docs/admin/phase-8-shadow-drill-checklist.md`).

## Deferred (Non-Blocking For This Delivery Track)

- [x] Test/fixture backlog from phases 1 to 4 is deferred per current no-tests execution directive.

## Completed In This Pass

- [x] Added finance transactions CSV export endpoint (`GET /api/admin/finance/transactions/export`).
- [x] Added finance reconciliation CSV export endpoint (`GET /api/admin/finance/reconciliation/export`).
- [x] Added frontend finance export actions in admin finance screen.
- [x] Added explicit unauthorized/session-expired route and admin session guard flow.
- [x] Reconciled stale phase todo docs so completed items are no longer listed as pending.
