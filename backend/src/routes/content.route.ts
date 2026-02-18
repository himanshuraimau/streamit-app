import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { upload, handleUploadError } from '../middleware/upload.middleware';
import { ContentController } from '../controllers/content.controller';

const router = Router();

/**
 * @swagger
 * /api/content/feed/public:
 *   get:
 *     summary: Get the public content feed (unauthenticated)
 *     tags: [Content]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Public feed posts
 */
router.get('/feed/public', ContentController.getPublicFeed);

/**
 * @swagger
 * /api/content/trending:
 *   get:
 *     summary: Get trending content (public, enhanced when authenticated)
 *     tags: [Content]
 *     security: []
 *     responses:
 *       200:
 *         description: Trending posts sorted by engagement
 */
router.get('/trending', optionalAuth, ContentController.getTrendingContent);

/**
 * @swagger
 * /api/content/posts/{postId}:
 *   get:
 *     summary: Get a single post by ID (public)
 *     tags: [Content]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post object
 *       404:
 *         description: Post not found
 */
router.get('/posts/:postId', ContentController.getPost);

/**
 * @swagger
 * /api/content/posts/{postId}/comments:
 *   get:
 *     summary: Get comments on a post (public)
 *     tags: [Content]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/posts/:postId/comments', ContentController.getPostComments);

/**
 * @swagger
 * /api/content/users/{userId}/posts:
 *   get:
 *     summary: Get all posts by a specific user (public)
 *     tags: [Content]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of the user's posts
 */
router.get('/users/:userId/posts', ContentController.getUserPosts);

/**
 * @swagger
 * /api/content/posts/{postId}/view:
 *   post:
 *     summary: Track a view on a post (optional auth)
 *     tags: [Content]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: View recorded
 */
router.post('/posts/:postId/view', optionalAuth, ContentController.trackPostView);

/**
 * @swagger
 * /api/content/posts/{postId}/share:
 *   post:
 *     summary: Track a share event on a post
 *     tags: [Content]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Share recorded
 */
router.post('/posts/:postId/share', ContentController.trackPostShare);

// Protected routes (auth required)
router.use(requireAuth);

/**
 * @swagger
 * /api/content/posts:
 *   post:
 *     summary: Create a new post with optional media attachments
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               body:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 10
 *               type:
 *                 type: string
 *                 enum: [post, short]
 *     responses:
 *       201:
 *         description: Post created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   get:
 *     summary: Get the authenticated user's own posts
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: List of own posts
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/posts', upload.array('media', 10), handleUploadError, ContentController.createPost);
router.get('/posts', ContentController.getMyPosts);

/**
 * @swagger
 * /api/content/posts/{postId}:
 *   put:
 *     summary: Update a post
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *   delete:
 *     summary: Delete a post
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.put('/posts/:postId', ContentController.updatePost);
router.delete('/posts/:postId', ContentController.deletePost);

/**
 * @swagger
 * /api/content/posts/{postId}/like:
 *   post:
 *     summary: Toggle a like on a post
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like toggled; returns new liked state
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/posts/:postId/like', ContentController.togglePostLike);

/**
 * @swagger
 * /api/content/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [postId, body]
 *             properties:
 *               postId:
 *                 type: string
 *               body:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/comments', ContentController.addComment);

/**
 * @swagger
 * /api/content/feed:
 *   get:
 *     summary: Get personalized feed for the authenticated user
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Personalized feed posts from followed creators
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/feed', ContentController.getFeed);

/**
 * @swagger
 * /api/content/shorts/following:
 *   get:
 *     summary: Get shorts from followed creators
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: List of short-form videos from followed creators
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/shorts/following', ContentController.getFollowingShorts);

/**
 * @swagger
 * /api/content/shorts/trending:
 *   get:
 *     summary: Get trending short-form videos (public)
 *     tags: [Content]
 *     security: []
 *     responses:
 *       200:
 *         description: Trending shorts sorted by engagement
 */
router.get('/shorts/trending', optionalAuth, ContentController.getTrendingShorts);

/**
 * @swagger
 * /api/content/shorts:
 *   get:
 *     summary: Get all short-form videos (public)
 *     tags: [Content]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of all shorts
 */
router.get('/shorts', optionalAuth, ContentController.getAllShorts);

export default router;
