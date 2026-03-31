import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { AdminComplianceController } from '../controllers/admin-compliance.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdminRolloutAccess } from '../middleware/admin-rollout.middleware';
import { requireComplianceScopes } from '../middleware/admin-compliance-scope.middleware';
import { requireAdmin, requireSuperAdmin } from '../middleware/admin.middleware';
import {
  adminComplianceExportRateLimiter,
  adminHighRiskActionRateLimiter,
} from '../middleware/rate-limit.middleware';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/ops/rollout-status', requireSuperAdmin, AdminController.getRolloutStatus);
router.patch(
  '/ops/rollout-policy',
  requireSuperAdmin,
  adminHighRiskActionRateLimiter,
  AdminController.updateRolloutPolicy
);
router.post(
  '/ops/security-alerts/dispatch',
  requireSuperAdmin,
  adminHighRiskActionRateLimiter,
  AdminController.dispatchSecurityAlerts
);
router.get(
  '/ops/security-digest/export',
  requireSuperAdmin,
  adminComplianceExportRateLimiter,
  AdminController.exportSecurityOpsDigestCsv
);

router.use(requireAdminRolloutAccess);

/**
 * @swagger
 * /api/admin/me:
 *   get:
 *     summary: Get currently authenticated admin profile
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Admin profile data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/me', AdminController.getAdminMe);

/**
 * @swagger
 * /api/admin/dashboard/summary:
 *   get:
 *     summary: Get admin dashboard counters and operational summary
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/dashboard/summary', AdminController.getDashboardSummary);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List users for admin operations
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated users list
 */
router.get('/users', AdminController.listUsers);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   get:
 *     summary: Get detailed user profile for admin review
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: User detail
 */
router.get('/users/:userId', AdminController.getUserDetail);

/**
 * @swagger
 * /api/admin/users/{userId}/suspension:
 *   patch:
 *     summary: Suspend or unsuspend a user
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Suspension state updated
 */
router.patch(
  '/users/:userId/suspension',
  adminHighRiskActionRateLimiter,
  AdminController.updateUserSuspension
);

router.get('/permissions/admin-scopes', requireSuperAdmin, AdminController.listAdminPermissions);
router.patch(
  '/permissions/admin-scopes/:adminId',
  requireSuperAdmin,
  adminHighRiskActionRateLimiter,
  AdminController.updateAdminPermissions
);
router.get('/ops/security-summary', requireSuperAdmin, AdminController.getSecuritySummary);

/**
 * @swagger
 * /api/admin/creators/applications:
 *   get:
 *     summary: List creator applications for review
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated creator applications list
 */
router.get('/creators/applications', AdminController.listCreatorApplications);

/**
 * @swagger
 * /api/admin/creators/applications/{applicationId}/approve:
 *   post:
 *     summary: Approve creator application
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Creator application approved
 */
router.post(
  '/creators/applications/:applicationId/approve',
  AdminController.approveCreatorApplication
);

/**
 * @swagger
 * /api/admin/creators/applications/{applicationId}/reject:
 *   post:
 *     summary: Reject creator application
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Creator application rejected
 */
router.post(
  '/creators/applications/:applicationId/reject',
  AdminController.rejectCreatorApplication
);

/**
 * @swagger
 * /api/admin/moderation/reports:
 *   get:
 *     summary: List content reports for moderation queue
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated reports list
 */
router.get('/moderation/reports', AdminController.listReports);

/**
 * @swagger
 * /api/admin/moderation/reports/{reportId}/review:
 *   post:
 *     summary: Review and action a content report
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Report reviewed and updated
 */
router.post('/moderation/reports/:reportId/review', AdminController.reviewReport);

/**
 * @swagger
 * /api/admin/moderation/stream-reports:
 *   get:
 *     summary: List stream reports for moderation queue
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated stream reports list
 */
router.get('/moderation/stream-reports', AdminController.listStreamReports);

/**
 * @swagger
 * /api/admin/moderation/stream-reports/{streamReportId}/review:
 *   post:
 *     summary: Review and update stream report status
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Stream report reviewed and updated
 */
router.post(
  '/moderation/stream-reports/:streamReportId/review',
  AdminController.reviewStreamReport
);

/**
 * @swagger
 * /api/admin/finance/summary:
 *   get:
 *     summary: Get finance dashboard summary for admin investigation
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Finance summary payload
 */
router.get('/finance/summary', AdminController.getFinanceSummary);

/**
 * @swagger
 * /api/admin/finance/transactions:
 *   get:
 *     summary: List finance transactions by type for investigation
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated transactions list
 */
router.get('/finance/transactions', AdminController.listFinanceTransactions);
router.get(
  '/finance/transactions/export',
  adminComplianceExportRateLimiter,
  AdminController.exportFinanceTransactionsCsv
);

/**
 * @swagger
 * /api/admin/finance/withdrawals:
 *   get:
 *     summary: List creator withdrawal requests
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated withdrawal queue
 */
router.get('/finance/withdrawals', AdminController.listWithdrawals);

/**
 * @swagger
 * /api/admin/finance/withdrawals/{withdrawalId}/review:
 *   post:
 *     summary: Review and transition withdrawal state
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Updated withdrawal request
 */
router.post(
  '/finance/withdrawals/:withdrawalId/review',
  adminHighRiskActionRateLimiter,
  AdminController.reviewWithdrawal
);

/**
 * @swagger
 * /api/admin/finance/config/commission:
 *   get:
 *     summary: Get finance commission configuration
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Finance commission config
 */
router.get('/finance/config/commission', AdminController.getCommissionConfig);

/**
 * @swagger
 * /api/admin/finance/config/commission:
 *   patch:
 *     summary: Update finance commission configuration (SUPER_ADMIN only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Updated finance commission config
 */
router.patch(
  '/finance/config/commission',
  requireSuperAdmin,
  adminHighRiskActionRateLimiter,
  AdminController.updateCommissionConfig
);

/**
 * @swagger
 * /api/admin/finance/reconciliation:
 *   get:
 *     summary: Get finance reconciliation summary over a date range
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Reconciliation summary
 */
router.get('/finance/reconciliation', AdminController.getFinanceReconciliation);
router.get(
  '/finance/reconciliation/export',
  adminComplianceExportRateLimiter,
  AdminController.exportFinanceReconciliationCsv
);

/**
 * @swagger
 * /api/admin/ads/campaigns:
 *   get:
 *     summary: List ad campaigns with aggregate metrics
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated campaign list
 *   post:
 *     summary: Create a new ad campaign
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       201:
 *         description: Campaign created
 */
router.get('/ads/campaigns', AdminController.listAdCampaigns);
router.post('/ads/campaigns', AdminController.createAdCampaign);

/**
 * @swagger
 * /api/admin/ads/campaigns/{campaignId}/status:
 *   patch:
 *     summary: Update ad campaign status with transition rules
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Campaign status updated
 */
router.patch('/ads/campaigns/:campaignId/status', AdminController.updateAdCampaignStatus);

/**
 * @swagger
 * /api/admin/ads/campaigns/{campaignId}/analytics:
 *   get:
 *     summary: Get campaign-level analytics summary and daily trend
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Campaign analytics payload
 */
router.get('/ads/campaigns/:campaignId/analytics', AdminController.getAdCampaignAnalytics);

/**
 * @swagger
 * /api/admin/ads/campaigns/{campaignId}/analytics/export:
 *   get:
 *     summary: Export campaign analytics daily metrics as CSV
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: CSV export payload
 */
router.get(
  '/ads/campaigns/:campaignId/analytics/export',
  AdminController.exportAdCampaignAnalyticsCsv
);

/**
 * @swagger
 * /api/admin/ads/kpis/summary:
 *   get:
 *     summary: Get founder KPI summary for ads and monetization
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Founder KPI summary payload
 */
router.get('/ads/kpis/summary', AdminController.getFounderKpiSummary);

router.get(
  '/compliance/legal-cases',
  requireComplianceScopes(['LEGAL_CASES']),
  AdminComplianceController.listLegalCases
);
router.post(
  '/compliance/legal-cases',
  requireComplianceScopes(['LEGAL_CASES']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.createLegalCase
);
router.get(
  '/compliance/legal-cases/:legalCaseId',
  requireComplianceScopes(['LEGAL_CASES']),
  AdminComplianceController.getLegalCaseDetail
);
router.patch(
  '/compliance/legal-cases/:legalCaseId',
  requireComplianceScopes(['LEGAL_CASES']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.updateLegalCase
);

router.get(
  '/compliance/takedowns',
  requireComplianceScopes(['TAKEDOWNS']),
  AdminComplianceController.listTakedowns
);
router.post(
  '/compliance/takedowns',
  requireComplianceScopes(['TAKEDOWNS']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.createTakedown
);
router.post(
  '/compliance/takedowns/:takedownId/action',
  requireSuperAdmin,
  requireComplianceScopes(['TAKEDOWNS']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.applyTakedownAction
);

router.get(
  '/compliance/geoblocks',
  requireComplianceScopes(['GEOBLOCKS']),
  AdminComplianceController.listGeoBlocks
);
router.post(
  '/compliance/geoblocks',
  requireSuperAdmin,
  requireComplianceScopes(['GEOBLOCKS']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.createGeoBlock
);
router.patch(
  '/compliance/geoblocks/:geoBlockId',
  requireSuperAdmin,
  requireComplianceScopes(['GEOBLOCKS']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.updateGeoBlock
);
router.delete(
  '/compliance/geoblocks/:geoBlockId',
  requireSuperAdmin,
  requireComplianceScopes(['GEOBLOCKS']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.removeGeoBlock
);

router.get(
  '/settings/system',
  requireComplianceScopes(['SETTINGS']),
  AdminComplianceController.listSystemSettings
);
router.patch(
  '/settings/system/:settingKey',
  requireSuperAdmin,
  requireComplianceScopes(['SETTINGS']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.updateSystemSetting
);
router.get(
  '/settings/system/:settingKey/history',
  requireComplianceScopes(['SETTINGS']),
  AdminComplianceController.getSystemSettingHistory
);
router.post(
  '/settings/system/rollback',
  requireSuperAdmin,
  requireComplianceScopes(['SETTINGS']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.rollbackSystemSetting
);

router.get(
  '/settings/announcements',
  requireComplianceScopes(['SETTINGS']),
  AdminComplianceController.listAnnouncements
);
router.post(
  '/settings/announcements',
  requireSuperAdmin,
  requireComplianceScopes(['SETTINGS']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.createAnnouncement
);
router.patch(
  '/settings/announcements/:announcementId',
  requireSuperAdmin,
  requireComplianceScopes(['SETTINGS']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.updateAnnouncement
);
router.delete(
  '/settings/announcements/:announcementId',
  requireSuperAdmin,
  requireComplianceScopes(['SETTINGS']),
  adminHighRiskActionRateLimiter,
  AdminComplianceController.deleteAnnouncement
);

router.get(
  '/compliance/audit-history',
  requireComplianceScopes(['AUDIT']),
  AdminComplianceController.listComplianceAuditHistory
);
router.post(
  '/compliance/audit-history/export',
  requireComplianceScopes(['EXPORTS']),
  adminComplianceExportRateLimiter,
  AdminComplianceController.generateComplianceAuditExport
);
router.get(
  '/compliance/audit-history/export/download',
  requireComplianceScopes(['EXPORTS']),
  adminComplianceExportRateLimiter,
  AdminComplianceController.downloadComplianceAuditExport
);

export default router;
