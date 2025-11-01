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
    // The body is a Buffer when using express.raw()
    let rawBody: string;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf-8');
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else {
      // Fallback: body was already parsed as JSON
      rawBody = JSON.stringify(req.body);
    }

    console.log('[WebhookMiddleware] Received webhook, signature:', signature.substring(0, 20) + '...');
    console.log('[WebhookMiddleware] Body length:', rawBody.length);

    try {
      // Validate and parse the webhook event
      const event = await WebhookService.validateAndParse(rawBody, signature);
      
      console.log('[WebhookMiddleware] Webhook validated successfully:', event.event);
      
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
