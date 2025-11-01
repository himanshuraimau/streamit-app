import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { SocialController } from '../controllers/social.controller';

const router = Router();

/**
 * Social Routes - Follow/unfollow creators, block users
 */

// Follow/unfollow creators (requires auth)
router.post(
  '/follow/:userId',
  requireAuth,
  SocialController.followUser
);

router.delete(
  '/follow/:userId',
  requireAuth,
  SocialController.unfollowUser
);

router.get(
  '/follow/:userId',
  SocialController.checkFollowing
);

// Get followers/following lists (public)
router.get(
  '/followers/:userId',
  SocialController.getFollowers
);

router.get(
  '/following/:userId',
  SocialController.getFollowing
);

// Block/unblock users (requires auth)
router.post(
  '/block/:userId',
  requireAuth,
  SocialController.blockUser
);

router.delete(
  '/block/:userId',
  requireAuth,
  SocialController.unblockUser
);

// Get all approved creators (public)
router.get(
  '/creators',
  SocialController.getCreators
);

// Get creator profile by username (public)
router.get(
  '/creator/:username',
  SocialController.getCreatorProfile
);

export default router;
