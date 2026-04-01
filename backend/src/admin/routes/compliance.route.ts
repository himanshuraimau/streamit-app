import { Router } from 'express';
import { ComplianceController } from '../controllers/compliance.controller';

/**
 * Compliance and legal routes
 * Handles audit logs, geo-blocking, data exports, and takedowns
 * 
 * Requirements: 17.4
 */
const router = Router();

/**
 * GET /api/admin/compliance/audit-log
 * Get audit log with filtering and pagination
 * 
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20, max: 100)
 * - adminId: string (optional)
 * - action: string (optional)
 * - targetType: string (optional)
 * - dateFrom: date (optional)
 * - dateTo: date (optional)
 * 
 * Requirements: 11.1, 11.2
 */
router.get('/audit-log', ComplianceController.getAuditLog);

/**
 * POST /api/admin/compliance/geo-block
 * Create a geo-block to restrict content access by region
 * 
 * Body:
 * - region: string (required, 2-letter ISO country code)
 * - contentId: string (optional)
 * - reason: string (optional)
 * 
 * Requirements: 11.3, 11.4, 11.5
 */
router.post('/geo-block', ComplianceController.createGeoBlock);

/**
 * GET /api/admin/compliance/export
 * Export all user data for GDPR compliance
 * 
 * Query parameters:
 * - userId: string (required)
 * 
 * Returns JSON data export
 * 
 * Requirements: 11.6, 11.7, 11.8
 */
router.get('/export', ComplianceController.exportUserData);

/**
 * GET /api/admin/compliance/takedowns
 * Get all content that has been taken down for legal reasons
 * 
 * Returns list of content with legal removal reasons
 * 
 * Requirements: 11.9
 */
router.get('/takedowns', ComplianceController.getTakedowns);

export default router;
