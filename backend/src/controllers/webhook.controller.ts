import type { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';
import { PaymentService } from '../services/payment.service';
import { Webhook } from 'standardwebhooks';

/**
 * Webhook Controller - Handles LiveKit and Dodo Payment webhook events
 */
export class WebhookController {
  /**
   * Handle LiveKit webhook events
   * POST /api/webhook/livekit
   * 
   * This endpoint receives events from LiveKit server:
   * - ingress_started: When a stream starts
   * - ingress_ended: When a stream ends
   * - room_finished: When a room is closed
   * - participant_joined: When a viewer joins
   * - participant_left: When a viewer leaves
   */
  static async handleLiveKitWebhook(req: Request, res: Response) {
    try {
      // The webhook event is attached to req by the middleware after validation
      const event = (req as any).webhookEvent;

      if (!event) {
        console.error('[WebhookController] No webhook event found in request');
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook event',
        });
      }

      console.log(
        `[WebhookController] Processing webhook event: ${event.event}`
      );

      // Process the event through the webhook service
      await WebhookService.processEvent(event);

      // Always return 200 OK to acknowledge receipt
      // LiveKit will retry if we don't respond with 200
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        eventType: event.event,
      });
    } catch (error) {
      console.error('[WebhookController] Error processing webhook:', error);

      // Still return 200 to prevent retries for errors we can't fix
      // Log the error for manual investigation
      res.status(200).json({
        success: false,
        error: 'Error processing webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Health check endpoint for webhook
   * GET /api/webhook/livekit/health
   */
  static async webhookHealth(req: Request, res: Response) {
    res.json({
      success: true,
      message: 'LiveKit webhook endpoint is ready',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle Dodo Payments webhook events
   * POST /api/webhook/dodo
   * 
   * This endpoint receives payment notifications from Dodo Payments:
   * - payment.succeeded: When a payment is successfully completed
   * - payment.failed: When a payment fails
   */
  static async handleDodoWebhook(req: Request, res: Response) {
    try {
      const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.error('[WebhookController] DODO_WEBHOOK_SECRET not configured');
        return res.status(500).json({
          success: false,
          error: 'Webhook secret not configured',
        });
      }

      const webhook = new Webhook(webhookSecret);
      
      // Get raw body and headers for verification
      const rawBody = req.body.toString();
      const headers = {
        'webhook-id': req.headers['webhook-id'] as string,
        'webhook-signature': req.headers['webhook-signature'] as string,
        'webhook-timestamp': req.headers['webhook-timestamp'] as string,
      };

      // Verify webhook signature
      try {
        await webhook.verify(rawBody, headers);
      } catch (error) {
        console.error('[WebhookController] Webhook verification failed:', error);
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook signature',
        });
      }

      // Parse and process the payload
      const payload = JSON.parse(rawBody);
      console.log('[WebhookController] Processing Dodo webhook:', payload.event_type);
      console.log('[WebhookController] Full payload:', JSON.stringify(payload, null, 2));

      await PaymentService.processWebhook(payload);

      res.json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      console.error('[WebhookController] Error processing Dodo webhook:', error);
      
      res.status(500).json({
        success: false,
        error: 'Error processing webhook',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
