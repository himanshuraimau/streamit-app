import { Router } from 'express';
import { UserMgmtController } from '../controllers/user-mgmt.controller';

/**
 * User management routes
 * All routes are protected by adminAuthMiddleware and requirePermission middleware
 * Applied at the router level in admin/routes/index.ts
 * 
 * Requirements: 17.4
 */
const router = Router();

/**
 * GET /api/admin/users
 * List users with filtering, search, and pagination
 * 
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20, max: 100)
 * - search: string (optional)
 * - role: UserRole (optional)
 * - isSuspended: boolean (optional)
 * - email: string (optional)
 * - username: string (optional)
 * - createdFrom: date (optional)
 * - createdTo: date (optional)
 * - sortBy: 'createdAt' | 'lastLoginAt' | 'username' (default: 'createdAt')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 * 
 * Allowed roles: super_admin, support_admin, compliance_officer
 */
router.get('/', UserMgmtController.listUsers);

/**
 * GET /api/admin/users/:id
 * Get complete user details by ID
 * 
 * Returns:
 * - User profile information
 * - Wallet balance and transaction history
 * - Ban history from audit logs
 * - Admin notes
 * 
 * Allowed roles: super_admin, support_admin, compliance_officer
 */
router.get('/:id', UserMgmtController.getUserById);

/**
 * PATCH /api/admin/users/:id/freeze
 * Freeze user account (temporary suspension)
 * 
 * Body:
 * - reason: string (required, min 10 chars)
 * - expiresAt: date (optional, null = permanent)
 * - adminNotes: string (optional)
 * 
 * Allowed roles: super_admin, support_admin
 */
router.patch('/:id/freeze', UserMgmtController.freezeUser);

/**
 * PATCH /api/admin/users/:id/unfreeze
 * Unfreeze user account (remove suspension)
 * 
 * Allowed roles: super_admin, support_admin
 */
router.patch('/:id/unfreeze', UserMgmtController.unfreezeUser);

/**
 * PATCH /api/admin/users/:id/ban
 * Ban user account (permanent suspension)
 * 
 * Body:
 * - reason: string (required, min 10 chars)
 * - adminNotes: string (optional)
 * 
 * Allowed roles: super_admin, support_admin
 */
router.patch('/:id/ban', UserMgmtController.banUser);

/**
 * PATCH /api/admin/users/:id/chat-disable
 * Disable chat for user (24-hour restriction by default)
 * 
 * Body:
 * - reason: string (required, min 10 chars)
 * - duration: number (optional, default 24 hours)
 * 
 * Allowed roles: super_admin, support_admin, moderator
 */
router.patch('/:id/chat-disable', UserMgmtController.disableChat);

/**
 * POST /api/admin/users/:id/reset-password
 * Reset user password (admin-initiated)
 * 
 * Body:
 * - sendEmail: boolean (optional, default true)
 * 
 * Returns password reset token
 * 
 * Allowed roles: super_admin, support_admin
 */
router.post('/:id/reset-password', UserMgmtController.resetPassword);

export default router;
