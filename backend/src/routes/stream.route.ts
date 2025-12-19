import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireCreator } from '../middleware/creator.middleware';
import { StreamController } from '../controllers/stream.controller';

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

export default router;
