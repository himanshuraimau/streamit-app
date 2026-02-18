import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireCreator } from '../middleware/creator.middleware';
import { StreamController } from '../controllers/stream.controller';
import { streamReportRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

/**
 * @swagger
 * /api/stream/setup:
 *   post:
 *     summary: Set up a new stream session (get ingress credentials)
 *     tags: [Stream]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Stream ingress details (server URL, stream key)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     ingressId:
 *                       type: string
 *                     serverUrl:
 *                       type: string
 *                     streamKey:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/setup', requireAuth, requireCreator, StreamController.setupStream);

/**
 * @swagger
 * /api/stream/go-live:
 *   post:
 *     summary: Start a live stream session
 *     tags: [Stream]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stream started
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/go-live', requireAuth, requireCreator, StreamController.goLive);

/**
 * @swagger
 * /api/stream/end-stream:
 *   post:
 *     summary: End the current live stream
 *     tags: [Stream]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Stream ended successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post('/end-stream', requireAuth, requireCreator, StreamController.endStream);

/**
 * @swagger
 * /api/stream/info:
 *   get:
 *     summary: Get the creator's stream information
 *     tags: [Stream]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Stream info object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *   put:
 *     summary: Update the creator's stream information
 *     tags: [Stream]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *               price:
 *                 type: number
 *               isMature:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Stream info updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/info', requireAuth, requireCreator, StreamController.getStreamInfo);

router.put('/info', requireAuth, requireCreator, StreamController.updateStreamInfo);

/**
 * @swagger
 * /api/stream/chat-settings:
 *   put:
 *     summary: Update chat settings for the stream
 *     tags: [Stream]
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
 *               chatEnabled:
 *                 type: boolean
 *               chatFollowersOnly:
 *                 type: boolean
 *               chatSubscribersOnly:
 *                 type: boolean
 *               slowMode:
 *                 type: boolean
 *               slowModeDelay:
 *                 type: integer
 *                 description: Delay in seconds between messages
 *     responses:
 *       200:
 *         description: Chat settings updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/chat-settings', requireAuth, requireCreator, StreamController.updateChatSettings);

/**
 * @swagger
 * /api/stream/status:
 *   get:
 *     summary: Get the current live status of the creator's stream
 *     tags: [Stream]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Live status and viewer count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isLive:
 *                   type: boolean
 *                 viewerCount:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/status', requireAuth, requireCreator, StreamController.getStreamStatus);

/**
 * @swagger
 * /api/stream/past:
 *   get:
 *     summary: Get the creator's past (ended) streams
 *     tags: [Stream]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
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
 *         description: List of past streams
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/past', requireAuth, requireCreator, StreamController.getPastStreams);

/**
 * @swagger
 * /api/stream/report:
 *   post:
 *     summary: Report a live stream (rate limited to 5 per hour)
 *     tags: [Stream]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [streamId, reason]
 *             properties:
 *               streamId:
 *                 type: string
 *               reason:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report submitted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       429:
 *         description: Too many reports — rate limit exceeded
 */
router.post('/report', requireAuth, streamReportRateLimiter, StreamController.reportStream);

/**
 * @swagger
 * /api/stream/{streamId}/summary:
 *   get:
 *     summary: Get aggregate statistics for a past stream
 *     tags: [Stream]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: streamId
 *         required: true
 *         schema:
 *           type: string
 *         description: The stream ID
 *     responses:
 *       200:
 *         description: Stream summary stats (peak viewers, duration, revenue, etc.)
 *       404:
 *         description: Stream not found
 */
router.get('/:streamId/summary', StreamController.getStreamSummary);

export default router;
