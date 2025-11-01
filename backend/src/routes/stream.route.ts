import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireCreator } from '../middleware/creator.middleware';
import { StreamController } from '../controllers/stream.controller';

const router = Router();

/**
 * Stream Routes - Creator-only endpoints
 * All routes require authentication and creator approval
 */

// NEW FLOW: Create stream with metadata
router.post(
  '/create',
  requireAuth,
  requireCreator,
  StreamController.createStreamWithMetadata
);

// Get past streams
router.get(
  '/past',
  requireAuth,
  requireCreator,
  StreamController.getPastStreams
);

// Ingress management (stream key) - OLD FLOW (keeping for backward compatibility)
router.post(
  '/ingress',
  requireAuth,
  requireCreator,
  StreamController.createIngress
);

router.delete(
  '/ingress',
  requireAuth,
  requireCreator,
  StreamController.deleteIngress
);

// Stream information
router.get(
  '/info',
  requireAuth,
  requireCreator,
  StreamController.getStreamInfo
);

router.get(
  '/credentials',
  requireAuth,
  requireCreator,
  StreamController.getStreamCredentials
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

// Get creator token for viewing own stream
router.post(
  '/creator-token',
  requireAuth,
  requireCreator,
  StreamController.getCreatorToken
);

export default router;
