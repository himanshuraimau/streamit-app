import { Router } from 'express';
import { ContentModController } from '../controllers/content-mod.controller';

/**
 * Content moderation routes
 * 
 * All routes are protected by adminAuthMiddleware (applied at router level)
 * and requirePermission middleware (applied in main admin router)
 * 
 * Requirements: 17.4
 */

const router = Router();

/**
 * GET /api/admin/moderation/queue
 * Get moderation queue with filtering and pagination
 * Returns flagged content awaiting review
 */
router.get('/queue', ContentModController.getModerationQueue);

/**
 * GET /api/admin/moderation/shorts
 * Get shorts with filtering and pagination
 * Returns short-form video content
 */
router.get('/shorts', ContentModController.getShorts);

/**
 * GET /api/admin/moderation/posts
 * Get posts with filtering and pagination
 * Returns regular posts (non-shorts)
 */
router.get('/posts', ContentModController.getPosts);

/**
 * GET /api/admin/moderation/:contentId
 * Get content details by ID
 * Requires query parameter: type (post, short, or comment)
 */
router.get('/:contentId', ContentModController.getContentById);

/**
 * PATCH /api/admin/moderation/:contentId/action
 * Perform moderation action on content
 * Requires query parameter: type (post, short, or comment)
 * Body: { action, message?, reason? }
 * Actions: dismiss, warn, remove, strike, ban
 */
router.patch('/:contentId/action', ContentModController.moderationAction);

export default router;
