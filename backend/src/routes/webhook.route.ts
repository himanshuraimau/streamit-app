import { Router } from 'express';
import { verifyLiveKitWebhook } from '../middleware/webhook.middleware';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

/**
 * @swagger
 * /api/webhook/livekit:
 *   post:
 *     summary: Receive LiveKit room/participant/egress events (server-to-server)
 *     tags: [Webhook]
 *     security: []
 *     description: >
 *       This endpoint is called by the LiveKit server, not by clients.
 *       Requests are verified via the `Authorization` header signed with the LiveKit API secret.
 *       Handles events: room_started, room_finished, participant_joined,
 *       participant_left, track_published, egress_started, egress_ended.
 *     requestBody:
 *       required: true
 *       content:
 *         application/webhook+json:
 *           schema:
 *             type: object
 *             description: LiveKit webhook event payload
 *     responses:
 *       200:
 *         description: Event processed
 *       401:
 *         description: Invalid or missing webhook signature
 */
router.post('/livekit', verifyLiveKitWebhook, WebhookController.handleLiveKitWebhook);

/**
 * @swagger
 * /api/webhook/livekit/health:
 *   get:
 *     summary: Webhook endpoint health check
 *     tags: [Webhook]
 *     security: []
 *     responses:
 *       200:
 *         description: Webhook system is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/livekit/health', WebhookController.webhookHealth);

export default router;
