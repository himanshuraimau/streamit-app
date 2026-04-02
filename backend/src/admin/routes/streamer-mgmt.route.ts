import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { StreamerMgmtController } from '../controllers/streamer-mgmt.controller';
import { requirePermission } from '../middleware/permissions.middleware';

/**
 * Streamer management routes
 * All routes are protected by adminAuthMiddleware and requirePermission middleware
 * Applied at the router level in admin/routes/index.ts
 *
 * Requirements: 17.4
 */
const router = Router();

/**
 * GET /api/admin/streamers/applications
 * List creator applications with filtering and pagination
 *
 * Query parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 20, max: 100)
 * - status: ApplicationStatus (optional)
 * - submittedFrom: date (optional)
 * - submittedTo: date (optional)
 * - sortBy: 'submittedAt' | 'reviewedAt' (default: 'submittedAt')
 * - sortOrder: 'asc' | 'desc' (default: 'desc')
 *
 * Allowed roles: super_admin, moderator, support_admin
 */
router.get('/applications', StreamerMgmtController.listApplications);

/**
 * GET /api/admin/streamers/applications/:id
 * Get complete application details by ID
 *
 * Returns:
 * - Application information
 * - Identity verification documents
 * - Financial details
 * - Creator profile information
 *
 * Allowed roles: super_admin, moderator, support_admin
 */
router.get('/applications/:id', StreamerMgmtController.getApplicationById);

/**
 * PATCH /api/admin/streamers/applications/:id/approve
 * Approve a creator application
 *
 * Updates application status to APPROVED and upgrades user role to CREATOR
 *
 * Allowed roles: super_admin, moderator
 */
router.patch(
	'/applications/:id/approve',
	requirePermission([UserRole.SUPER_ADMIN, UserRole.MODERATOR]),
	StreamerMgmtController.approveApplication
);

/**
 * PATCH /api/admin/streamers/applications/:id/reject
 * Reject a creator application
 *
 * Body:
 * - reason: string (required, min 10 chars)
 *
 * Allowed roles: super_admin, moderator
 */
router.patch(
	'/applications/:id/reject',
	requirePermission([UserRole.SUPER_ADMIN, UserRole.MODERATOR]),
	StreamerMgmtController.rejectApplication
);

/**
 * POST /api/admin/streamers/applications/:id/notes
 * Add internal review notes for a creator application
 */
router.post(
	'/applications/:id/notes',
	requirePermission([UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.ADMIN]),
	StreamerMgmtController.addApplicationNote
);

/**
 * POST /api/admin/streamers/applications/:id/send-email
 * Send a manual communication email to the creator application owner
 */
router.post(
	'/applications/:id/send-email',
	requirePermission([UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.ADMIN]),
	StreamerMgmtController.sendApplicationEmail
);

/**
 * GET /api/admin/streamers/live
 * List all currently active live streams
 *
 * Returns all streams with isLive=true including:
 * - Stream information
 * - Streamer details
 * - Viewer statistics
 *
 * Allowed roles: super_admin, moderator, support_admin
 */
router.get('/live', StreamerMgmtController.listLiveStreams);

/**
 * POST /api/admin/streamers/:id/kill-stream
 * Terminate a live stream
 *
 * Body:
 * - reason: string (required, min 10 chars)
 *
 * Terminates the LiveKit room and sets isLive to false
 *
 * Allowed roles: super_admin, moderator
 */
router.post('/:id/kill-stream', StreamerMgmtController.killStream);

/**
 * POST /api/admin/streamers/:id/mute
 * Mute a streamer's audio
 *
 * Disables the streamer's audio in the LiveKit room
 *
 * Allowed roles: super_admin, moderator
 */
router.post('/:id/mute', StreamerMgmtController.muteStreamer);

/**
 * POST /api/admin/streamers/:id/disable-chat
 * Disable chat for a stream
 *
 * Sets isChatEnabled to false for the stream
 *
 * Allowed roles: super_admin, moderator
 */
router.post('/:id/disable-chat', StreamerMgmtController.disableStreamChat);

/**
 * POST /api/admin/streamers/:id/warn
 * Send a warning to a streamer
 *
 * Body:
 * - message: string (required, min 10 chars)
 *
 * Sends a notification to the streamer and creates an audit log entry
 *
 * Allowed roles: super_admin, moderator
 */
router.post('/:id/warn', StreamerMgmtController.warnStreamer);

/**
 * PATCH /api/admin/streamers/:id/suspend
 * Suspend a streamer account
 *
 * Body:
 * - reason: string (required, min 10 chars)
 * - expiresAt: date (optional)
 * - adminNotes: string (optional)
 *
 * Freezes the user account and terminates any active stream
 *
 * Allowed roles: super_admin, moderator
 */
router.patch('/:id/suspend', StreamerMgmtController.suspendStreamer);

export default router;
