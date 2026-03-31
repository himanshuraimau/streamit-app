import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';

/**
 * Reports and complaints management routes
 * All routes are protected by adminAuthMiddleware and requirePermission middleware
 * Applied at the router level in admin/routes/index.ts
 * 
 * Requirements: 17.4
 */
const router = Router();

/**
 * GET /api/admin/reports
 * List reports with filtering, sorting, and pagination
 * 
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20, max: 100)
 * - reason: ReportReason (optional)
 * - status: ReportStatus (optional)
 * - reporterId: string (optional)
 * - reportedUserId: string (optional)
 * - dateFrom: date (optional)
 * - dateTo: date (optional)
 * - sortBy: 'createdAt' | 'priority' | 'reportCount' (default: 'createdAt')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * 
 * Allowed roles: super_admin, moderator, support_admin, compliance_officer
 */
router.get('/', ReportsController.listReports);

/**
 * GET /api/admin/reports/audit-log
 * Get audit log for report resolutions
 * 
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20, max: 100)
 * - adminId: string (optional)
 * - dateFrom: date (optional)
 * - dateTo: date (optional)
 * 
 * Note: This route must be defined before /:id to avoid route conflicts
 * 
 * Allowed roles: super_admin, moderator, support_admin, compliance_officer
 */
router.get('/audit-log', ReportsController.getAuditLog);

/**
 * GET /api/admin/reports/:id
 * Get complete report details by ID
 * 
 * Returns:
 * - Report information
 * - Reporter information and history
 * - Reported user information and history
 * - Reported content preview
 * - Resolution details
 * 
 * Allowed roles: super_admin, moderator, support_admin, compliance_officer
 */
router.get('/:id', ReportsController.getReportById);

/**
 * PATCH /api/admin/reports/:id/resolve
 * Resolve a report with action and admin notes
 * 
 * Body:
 * - action: 'dismiss' | 'warning_sent' | 'content_removed' | 'user_suspended' | 'user_banned'
 * - notes: string (required, min 10 chars)
 * 
 * Allowed roles: super_admin, moderator, support_admin
 */
router.patch('/:id/resolve', ReportsController.resolveReport);

export default router;
