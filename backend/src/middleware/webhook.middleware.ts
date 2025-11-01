import type { Request, Response, NextFunction } from 'express';
import { WebhookService } from '../services/webhook.service';

/**
 * Middleware to verify LiveKit webhook signatures
 * Validates that webhook requests are actually from LiveKit
 */
export const verifyLiveKitWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get signature from header
    const signature = req.headers['authorization'];

    if (!signature) {
      console.warn('[WebhookMiddleware] Missing authorization header');
      return res.status(401).json({
        success: false,
        error: 'Missing webhook signature',
      });
    }

    // Get raw body as string for signature verification
    // Note: We need to preserve the raw body for webhook verification
    const rawBody = JSON.stringify(req.body);

    try {
      // Validate and parse the webhook event
      const event = await WebhookService.validateAndParse(rawBody, signature);
      
      // Attach validated event to request for use in controller
      (req as any).webhookEvent = event;
      
      next();
    } catch (error) {
      console.error('[WebhookMiddleware] Invalid webhook signature:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
      });
    }
  } catch (error) {
    console.error('[WebhookMiddleware] Error verifying webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
