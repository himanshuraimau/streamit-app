import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';

/**
 * Platform settings and admin user management routes
 * All routes are protected by adminAuthMiddleware and requirePermission middleware
 * Applied at the router level in admin/routes/index.ts
 * 
 * Requirements: 17.4
 */
const router = Router();

/**
 * GET /api/admin/settings
 * Get all system settings organized by category
 * 
 * Returns settings grouped by:
 * - general: Platform-wide settings
 * - moderation: Content moderation settings
 * - monetization: Financial and wallet settings
 * - streaming: Live stream settings
 * - compliance: Legal and compliance settings
 * 
 * Allowed roles: super_admin
 */
router.get('/', SettingsController.getSettings);

/**
 * PATCH /api/admin/settings
 * Update system settings
 * 
 * Body:
 * - updates: Array<{ key: string, value: string }>
 * 
 * Validates setting values based on type and constraints:
 * - Boolean settings: 'true' or 'false'
 * - Number settings: Valid numeric values with min/max constraints
 * - String settings: Any string value
 * - JSON settings: Valid JSON format
 * 
 * Allowed roles: super_admin
 */
router.patch('/', SettingsController.updateSettings);

/**
 * GET /api/admin/settings/admins
 * List all admin users
 * 
 * Returns all users with admin roles:
 * - SUPER_ADMIN
 * - MODERATOR
 * - ADMIN (support_admin)
 * - FINANCE_ADMIN
 * - COMPLIANCE_OFFICER
 * 
 * Allowed roles: super_admin
 */
router.get('/admins', SettingsController.listAdmins);

/**
 * POST /api/admin/settings/admins
 * Create a new admin user
 * 
 * Body:
 * - name: string (required, min 2 chars)
 * - email: string (required, valid email)
 * - password: string (required, min 8 chars)
 * - role: AdminRole (required)
 * 
 * Creates user account with admin role and sends credentials via email
 * 
 * Allowed roles: super_admin
 */
router.post('/admins', SettingsController.createAdmin);

/**
 * PATCH /api/admin/settings/admins/:id/role
 * Update admin user role
 * 
 * Body:
 * - role: AdminRole (required)
 * 
 * Changes user role to specified admin role
 * Creates audit log entry for role change
 * 
 * Allowed roles: super_admin
 */
router.patch('/admins/:id/role', SettingsController.updateAdminRole);

/**
 * DELETE /api/admin/settings/admins/:id
 * Delete admin user (remove admin role)
 * 
 * Removes admin role from user account (downgrades to USER role)
 * Prevents self-deletion
 * Creates audit log entry
 * 
 * Allowed roles: super_admin
 */
router.delete('/admins/:id', SettingsController.deleteAdmin);

export default router;
