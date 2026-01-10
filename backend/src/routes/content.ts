import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { upload, handleUploadError } from '../middleware/upload';
import { ContentController } from '../controllers/content.controller';

const router = Router();

// Public routes (no auth required)
router.get('/feed/public', ContentController.getPublicFeed);
router.get('/trending', optionalAuth, ContentController.getTrendingContent); // NEW
router.get('/posts/:postId', ContentController.getPost);
router.get('/posts/:postId/comments', ContentController.getPostComments);
router.get('/users/:userId/posts', ContentController.getUserPosts);

// Tracking routes (optional auth)
router.post('/posts/:postId/view', optionalAuth, ContentController.trackPostView); // NEW
router.post('/posts/:postId/share', ContentController.trackPostShare); // NEW

// Protected routes (auth required)
router.use(requireAuth);

// Post management
router.post('/posts', upload.array('media', 10), handleUploadError, ContentController.createPost);
router.get('/posts', ContentController.getMyPosts);
router.put('/posts/:postId', ContentController.updatePost);
router.delete('/posts/:postId', ContentController.deletePost);

// Engagement
router.post('/posts/:postId/like', ContentController.togglePostLike);
router.post('/comments', ContentController.addComment);

// Feed
router.get('/feed', ContentController.getFeed);

// NEW: Shorts routes
router.get('/shorts/following', ContentController.getFollowingShorts);
router.get('/shorts/trending', optionalAuth, ContentController.getTrendingShorts);
router.get('/shorts', optionalAuth, ContentController.getAllShorts);

export default router;