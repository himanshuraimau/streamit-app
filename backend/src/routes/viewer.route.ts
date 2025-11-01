import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { ViewerController } from '../controllers/viewer.controller';

const router = Router();

/**
 * Viewer Routes - For users watching streams
 * Most routes are public, some require authentication
 */

// Get stream by username (public)
router.get(
  '/stream/:username',
  ViewerController.getStreamByUsername
);

// Get viewer token for joining a stream (public, but better with auth)
router.post(
  '/token',
  ViewerController.getViewerToken
);

// Get all live streams (public)
router.get(
  '/live',
  ViewerController.getLiveStreams
);

// Get recommended streams (public, enhanced with auth)
router.get(
  '/recommended',
  ViewerController.getRecommendedStreams
);

// Get followed streams (requires auth)
router.get(
  '/following',
  requireAuth,
  ViewerController.getFollowedStreams
);

// Search streams (public)
router.get(
  '/search',
  ViewerController.searchStreams
);

export default router;
