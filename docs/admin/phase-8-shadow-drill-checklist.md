# Phase 8 Shadow Drill Checklist

Last updated: 2026-03-31
Owner: Admin Ops + Security + Platform On-Call

## Goal

Rehearse staged rollout controls and incident-response routing using live admin operations surfaces:

- rollout simulation and policy edits
- threshold alert relay dispatch
- weekly ops digest export
- rollback and recovery timing

## Preconditions

- Deploy includes:
  - backend rollout and ops endpoints
  - Security Ops page rollout and dispatch controls
- At least one SUPER_ADMIN account and one ADMIN account are available.
- Optional settings configured:
  - `admin.rollout.enabled`
  - `admin.rollout.superAdminBypass`
  - `admin.rollout.allowedRoles`
  - `admin.rollout.allowedCountries`
  - `admin.rollout.blockedMessage`
  - `admin.ops.alertWebhook.slack`
  - `admin.ops.alertWebhook.pagerduty`
- Incident channel owners are informed this is a controlled rehearsal.

## Drill Window

- Start time:
- End time:
- Drill commander:
- Observer(s):

## Scenario 1: Rollout Decision Safety

1. Capture baseline rollout status from Security Ops page (no policy edits yet).
2. Run simulation matrix in the Security Ops rollout card:
   - role: `SUPER_ADMIN`, country allowed
   - role: `ADMIN`, country allowed
   - role: `ADMIN`, country blocked/unlisted
3. Apply a restrictive policy change (example: limit to one country) with an explicit reason.
4. Validate expected behavior:
   - super-admin path remains recoverable (via bypass or explicit allow)
   - blocked admins receive policy message and denied response
5. Revert to baseline policy and verify access restoration.

## Scenario 2: Alert Routing Rehearsal

1. Use Security Ops alert relay panel with `dryRun=true` and both channels selected.
2. Confirm dry-run response includes channel delivery statuses and breached metrics list.
3. If rehearsal policy allows, run one live dispatch (`dryRun=false`) to designated rehearsal webhooks.
4. Confirm incident channels received payload and metadata:
   - queue counts
   - breached thresholds
   - runbook links

## Scenario 3: Weekly Digest Export

1. Trigger digest export from Security Ops weekly digest card.
2. Verify CSV content includes these sections:
   - `queue_pressure`
   - `privileged_actions`
   - `rollout_decisions`
3. Attach exported file to drill artifact record.

## Scenario 4: Incident Rehearsal Timeline

1. Simulate threshold breach acknowledgment in incident channel.
2. Assign response owner and publish first response update.
3. Confirm runbook links are actionable from payload/context.
4. Record time-to-detect and time-to-acknowledge.

## Rollback Validation

1. Restore original rollout settings.
2. Re-run rollout simulation to confirm baseline restored.
3. Perform one final dry-run alert dispatch.
4. Export final digest snapshot for postmortem attachment.

## Exit Criteria

- No admin lockout occurred for recovery roles.
- Alert relay payload is delivered (or dry-run validated) as expected.
- Digest export is complete and archived.
- Rollback completed successfully within target time.

## Sign-Off

- [ ] Admin Ops sign-off
- [ ] Security/Incident sign-off
- [ ] Platform sign-off
- [ ] Drill artifacts archived
