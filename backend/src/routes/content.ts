import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { upload, handleUploadError } from '../middleware/upload';
import { ContentController } from '../controllers/content.controller';

const router = Router();

// Public routes (no auth required)
router.get('/feed/public', ContentController.getPublicFeed);
router.get('/posts/:postId', ContentController.getPost);
router.get('/posts/:postId/comments', ContentController.getPostComments);
router.get('/users/:userId/posts', ContentController.getUserPosts);

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

export default router;