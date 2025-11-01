import { Router } from 'express';
import { verifyLiveKitWebhook } from '../middleware/webhook.middleware';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

/**
 * Webhook Routes - Receive LiveKit events
 * These routes are called by LiveKit server, not by clients
 */

// Main webhook endpoint
// This endpoint is secured by signature verification, not by user auth
router.post(
  '/livekit',
  verifyLiveKitWebhook,
  WebhookController.handleLiveKitWebhook
);

// Health check endpoint (no auth required)
router.get(
  '/livekit/health',
  WebhookController.webhookHealth
);

export default router;
