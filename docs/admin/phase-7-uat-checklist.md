# Phase 7 QA and Rollback Checklist

Last updated: 2026-03-31
Owner: Admin Ops + Platform

## Goal

Validate that Phase 7 hardening changes are safe for production:

- scope-enforced compliance access
- signed compliance exports
- security summary thresholding and runbook links
- accessibility and responsive behavior for major admin workflows

## Preflight

- Confirm backend deploy includes latest admin controller and route changes.
- Confirm admin frontend deploy includes latest security and accessibility updates.
- Confirm system settings exist (optional but recommended):
  - `admin.ops.alertThreshold.pendingWithdrawals`
  - `admin.ops.alertThreshold.actionRequiredLegalCases`
  - `admin.ops.alertThreshold.pendingTakedowns`
  - `admin.ops.alertThreshold.activeGeoBlocks`
  - `admin.ops.alertThreshold.monitoredActions`
  - `admin.ops.runbook.security`
  - `admin.ops.runbook.compliance`
  - `admin.ops.runbook.finance`

## UAT Scenarios

1. Permission Scope Guarding

- Log in as a scoped admin account.
- Verify compliance routes are blocked when required scope is missing.
- Verify allowed routes continue to work and return expected data.

1. Signed Audit Export

- Generate signed compliance export token from Audit History.
- Download export with valid token.
- Verify invalid or expired token is rejected.

1. Security Ops Thresholding

- Open Security Ops page for 1, 7, and 30 day windows.
- Verify queue cards display count, threshold, and breach state.
- Verify monitored action alert row updates as activity changes.

1. Runbook Links

- Verify each runbook card opens configured URL in a new tab.
- Verify missing runbook settings show "Not configured" safely.

1. Accessibility Spot Checks

- Keyboard-only navigation from shell nav to page controls.
- Skip-link reaches main content.
- Filter controls are announced with meaningful labels.

1. Responsive Spot Checks

- Validate at ~360px, ~768px, and desktop widths.
- Confirm table-heavy pages remain scrollable without layout breakage.
- Confirm mobile nav remains usable and does not overlap content.

## Rollback Drill

1. Backend rollback

- Deploy previous backend artifact.
- Verify `/api/admin/ops/security-summary` still responds.

1. Frontend rollback

- Deploy previous admin frontend artifact.
- Verify core admin pages render and route correctly.

1. Setting rollback

- If threshold settings were modified, roll back via Settings history.

1. Exit criteria

- No 5xx spikes from admin APIs.
- No authz regressions in compliance routes.
- Security summary and audit export remain operable.

## Sign-off

- [ ] Admin Ops sign-off
- [ ] Compliance sign-off
- [ ] Platform sign-off
- [ ] Rollback rehearsal sign-off
