import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireCreator } from '../middleware/creator.middleware';
import { StreamController } from '../controllers/stream.controller';

const router = Router();

/**
 * Stream Routes - Creator-only endpoints
 * All routes require authentication and creator approval
 */

// Ingress management (stream key)
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

export default router;
