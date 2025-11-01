import type { Request, Response } from 'express';
import { WebhookService } from '../services/webhook.service';

/**
 * Webhook Controller - Handles LiveKit webhook events
 * Processes stream status updates and other LiveKit events
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
}
