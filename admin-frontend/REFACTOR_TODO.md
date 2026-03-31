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

- [x] Phase 6: `SettingsAnnouncementsPage`
  - Split into `src/pages/settings-announcements/`
  - Replaced all `window.prompt` and `window.alert` with proper dialogs
  - Created modular components for settings and announcements management
  - Added controller hook with proper state management
  - Reused shared admin components (AdminSectionCard, AdminNotice, AdminPaginationControls)

## Next Priority

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
