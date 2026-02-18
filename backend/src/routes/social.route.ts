import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { SocialController } from '../controllers/social.controller';

const router = Router();

/**
 * @swagger
 * /api/social/follow/{userId}:
 *   post:
 *     summary: Follow a creator
 *     tags: [Social]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Now following the creator
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   delete:
 *     summary: Unfollow a creator
 *     tags: [Social]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unfollowed the creator
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Check if the current user follows a creator (public)
 *     tags: [Social]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Follow status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFollowing:
 *                   type: boolean
 */
router.post('/follow/:userId', requireAuth, SocialController.followUser);

router.delete('/follow/:userId', requireAuth, SocialController.unfollowUser);

router.get('/follow/:userId', SocialController.checkFollowing);

/**
 * @swagger
 * /api/social/followers/{userId}:
 *   get:
 *     summary: Get the followers list for a user (public)
 *     tags: [Social]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: List of followers
 */
router.get('/followers/:userId', SocialController.getFollowers);

/**
 * @swagger
 * /api/social/following/{userId}:
 *   get:
 *     summary: Get the list of creators a user is following (public)
 *     tags: [Social]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of followed creators
 */
router.get('/following/:userId', SocialController.getFollowing);

/**
 * @swagger
 * /api/social/following/live:
 *   get:
 *     summary: Get followed creators who are currently live
 *     tags: [Social]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: List of live followed creators
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/following/live', requireAuth, SocialController.getLiveFollowedCreators);

/**
 * @swagger
 * /api/social/block/{userId}:
 *   post:
 *     summary: Block a user
 *     tags: [Social]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User blocked
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   delete:
 *     summary: Unblock a user
 *     tags: [Social]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User unblocked
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/block/:userId', requireAuth, SocialController.blockUser);

router.delete('/block/:userId', requireAuth, SocialController.unblockUser);

/**
 * @swagger
 * /api/social/creators:
 *   get:
 *     summary: Get all approved creators (public)
 *     tags: [Social]
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
 *     responses:
 *       200:
 *         description: List of creators with follower counts
 */
router.get('/creators', SocialController.getCreators);

/**
 * @swagger
 * /api/social/creator/{username}:
 *   get:
 *     summary: Get a creator's public profile by username
 *     tags: [Social]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Creator profile including bio, follower count, stream info
 *       404:
 *         description: Creator not found
 */
router.get('/creator/:username', SocialController.getCreatorProfile);

export default router;
