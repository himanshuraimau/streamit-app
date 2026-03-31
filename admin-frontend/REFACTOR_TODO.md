# Admin Frontend Refactor Todo

This file tracks the modular admin refactor so the remaining work stays ordered and consistent.

## Completed

- [x] Phase 4: `FinancePage`
  - Split into `src/pages/finance/`
  - Added feature controller hook
  - Replaced native `window.prompt` / `window.alert` flows with dialog and notice UI
  - Introduced shared formatting and file export helpers

- [x] Phase 5: `AdsAnalyticsPage`
  - Split into `src/pages/ads/`
  - Reuse shared section, metric, pagination, and notice components
  - Replace campaign status prompt flow with dialog-based review

## Next Priority

- [ ] Phase 6: `SettingsAnnouncementsPage`
  - Highest remaining page size
  - Multiple native prompt / alert flows
  - Needs dialog-based edit / rollback / announcement actions

- [ ] Phase 6: `TakedownsGeoBlocksPage`
  - Large moderation/compliance surface
  - Several action prompts and validation alerts

- [ ] Phase 6: `SecurityHardeningPage`
  - High-complexity form state
  - Should move to shared form sections and notice patterns

- [ ] Phase 6: `LegalCasesPage`
  - Prompt-based status and assignment actions
  - Good candidate for controlled dialogs and detail subcomponents

## Follow-Up Cleanup

- [ ] `UsersPage`
  - Replace suspension prompt with dialog flow

- [ ] `ModerationReportsPage`
  - Replace resolution / dismissal prompts

- [ ] `CreatorApplicationsPage`
  - Replace rejection prompt with dialog

- [ ] `PermissionsPage`
  - Replace alert-only validation with inline form messaging / notices

- [ ] `ComplianceAuditHistoryPage`
  - Replace alert-only export errors with notice UI
