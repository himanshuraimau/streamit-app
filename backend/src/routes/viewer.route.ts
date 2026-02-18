import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { ViewerController } from '../controllers/viewer.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

/**
 * @swagger
 * /api/viewer/me:
 *   get:
 *     summary: Get the currently authenticated user's info
 *     tags: [Viewer]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: User object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', requireAuth, ViewerController.getCurrentUser);

/**
 * @swagger
 * /api/viewer/profile:
 *   get:
 *     summary: Get the authenticated user's full profile
 *     tags: [Viewer]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Full profile object including bio, avatar, etc.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   patch:
 *     summary: Update the authenticated user's profile
 *     tags: [Viewer]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated profile
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile', requireAuth, ViewerController.getProfile);

router.patch('/profile', requireAuth, ViewerController.updateProfile);

/**
 * @swagger
 * /api/viewer/avatar:
 *   post:
 *     summary: Upload a new profile avatar image
 *     tags: [Viewer]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: New avatar URL
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/avatar', requireAuth, upload.single('avatar'), ViewerController.uploadAvatar);

/**
 * @swagger
 * /api/viewer/password:
 *   patch:
 *     summary: Change the authenticated user's password
 *     tags: [Viewer]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch('/password', requireAuth, ViewerController.changePassword);

/**
 * @swagger
 * /api/viewer/stream/{username}:
 *   get:
 *     summary: Get a creator's stream page by username (public)
 *     tags: [Viewer]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stream details and creator info
 *       404:
 *         description: Creator not found
 */
router.get('/stream/:username', ViewerController.getStreamByUsername);

/**
 * @swagger
 * /api/viewer/token:
 *   post:
 *     summary: Get a LiveKit viewer token to join a stream
 *     tags: [Viewer]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hostIdentity]
 *             properties:
 *               hostIdentity:
 *                 type: string
 *                 description: The stream host's user ID
 *     responses:
 *       200:
 *         description: LiveKit access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       404:
 *         description: Stream not found or not live
 */
router.post('/token', optionalAuth, ViewerController.getViewerToken);

/**
 * @swagger
 * /api/viewer/live:
 *   get:
 *     summary: Get all currently live streams (public)
 *     tags: [Viewer]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of live streams with viewer counts
 */
router.get('/live', ViewerController.getLiveStreams);

/**
 * @swagger
 * /api/viewer/recommended:
 *   get:
 *     summary: Get recommended streams (public, enhanced when authenticated)
 *     tags: [Viewer]
 *     security: []
 *     responses:
 *       200:
 *         description: List of recommended streams
 */
router.get('/recommended', ViewerController.getRecommendedStreams);

/**
 * @swagger
 * /api/viewer/following:
 *   get:
 *     summary: Get live streams from followed creators
 *     tags: [Viewer]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: List of live streams from followed creators
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/following', requireAuth, ViewerController.getFollowedStreams);

/**
 * @swagger
 * /api/viewer/search:
 *   get:
 *     summary: Search streams (public)
 *     tags: [Viewer]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', ViewerController.searchStreams);

export default router;
