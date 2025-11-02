import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { ViewerController } from '../controllers/viewer.controller';
import { upload } from '../middleware/upload';

const router = Router();

/**
 * Viewer Routes - For users watching streams
 * Most routes are public, some require authentication
 */

// Profile Management (requires auth)
router.get(
  '/profile',
  requireAuth,
  ViewerController.getProfile
);

router.patch(
  '/profile',
  requireAuth,
  ViewerController.updateProfile
);

router.post(
  '/avatar',
  requireAuth,
  upload.single('avatar'),
  ViewerController.uploadAvatar
);

router.patch(
  '/password',
  requireAuth,
  ViewerController.changePassword
);

// Stream Viewing Routes

// Get stream by username (public)
router.get(
  '/stream/:username',
  ViewerController.getStreamByUsername
);

// Get viewer token for joining a stream (public, but better with auth)
router.post(
  '/token',
  optionalAuth,
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
