import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireCreator } from '../middleware/creator.middleware';
import { StreamController } from '../controllers/stream.controller';
import { streamReportRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

/**
 * Stream Routes - Creator-only endpoints for WebRTC streaming
 * All routes require authentication and creator approval
 */

// WebRTC streaming flow
router.post(
  '/setup',
  requireAuth,
  requireCreator,
  StreamController.setupStream
);

router.post(
  '/go-live',
  requireAuth,
  requireCreator,
  StreamController.goLive
);

router.post(
  '/end-stream',
  requireAuth,
  requireCreator,
  StreamController.endStream
);

// Stream information
router.get(
  '/info',
  requireAuth,
  requireCreator,
  StreamController.getStreamInfo
);

router.put(
  '/info',
  requireAuth,
  requireCreator,
  StreamController.updateStreamInfo
);

// Chat settings
router.put(
  '/chat-settings',
  requireAuth,
  requireCreator,
  StreamController.updateChatSettings
);

// Stream status
router.get(
  '/status',
  requireAuth,
  requireCreator,
  StreamController.getStreamStatus
);

// Get past streams
router.get(
  '/past',
  requireAuth,
  requireCreator,
  StreamController.getPastStreams
);

/**
 * Stream Report - Viewer endpoint for reporting streams
 * Requires authentication and rate limiting (5 reports/hour per user)
 * Requirements: 2.3, 2.4
 */
router.post(
  '/report',
  requireAuth,
  streamReportRateLimiter,
  StreamController.reportStream
);

/**
 * Stream Summary - Get stream statistics
 * Public endpoint (no authentication required)
 * Requirements: 9.2, 9.3
 */
router.get(
  '/:streamId/summary',
  StreamController.getStreamSummary
);

export default router;
