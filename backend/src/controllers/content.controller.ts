import type { Request, Response } from 'express';
import { z } from 'zod';
import { ContentService } from '../services/content.service';
import { 
  createPostSchema, 
  updatePostSchema, 
  createCommentSchema, 
  feedQuerySchema 
} from '../lib/validations/content.validation';

export class ContentController {
  // Create a new post
  static async createPost(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data = createPostSchema.parse(req.body);
      const mediaFiles = req.files as Express.Multer.File[] | undefined;

      // Validate media files if provided
      if (mediaFiles && mediaFiles.length > 10) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 10 media files allowed per post'
        });
      }

      const post = await ContentService.createPost(userId, data, mediaFiles);

      res.status(201).json({
        success: true,
        data: post,
        message: 'Post created successfully'
      });
    } catch (error) {
      console.error('Error creating post:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // Get user's posts
  static async getUserPosts(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const requestingUserId = req.user?.id;
      const query = feedQuerySchema.parse(req.query);

      const result = await ContentService.getUserPosts(userId, query, requestingUserId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.issues
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get public feed
  static async getPublicFeed(req: Request, res: Response) {
    try {
      const requestingUserId = req.user?.id;
      const query = feedQuerySchema.parse(req.query);

      const result = await ContentService.getPublicFeed(query, requestingUserId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching public feed:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.issues
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get single post
  static async getPost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      if (!postId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      const requestingUserId = req.user?.id;
      const post = await ContentService.getPost(postId, requestingUserId);

      if (!post) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        });
      }

      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      console.error('Error fetching post:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Update post
  static async updatePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      if (!postId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      const userId = req.user!.id;
      const data = updatePostSchema.parse(req.body);

      const post = await ContentService.updatePost(postId, userId, data);

      res.json({
        success: true,
        data: post,
        message: 'Post updated successfully'
      });
    } catch (error) {
      console.error('Error updating post:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // Delete post
  static async deletePost(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      if (!postId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      const userId = req.user!.id;
      await ContentService.deletePost(postId, userId);

      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // Toggle post like
  static async togglePostLike(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      if (!postId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      const userId = req.user!.id;
      const result = await ContentService.togglePostLike(postId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error toggling post like:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Add comment to post
  static async addComment(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const data = createCommentSchema.parse(req.body);

      const comment = await ContentService.addComment(userId, data);

      res.status(201).json({
        success: true,
        data: comment,
        message: 'Comment added successfully'
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  // Get post comments
  static async getPostComments(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      if (!postId) {
        return res.status(400).json({
          success: false,
          error: 'Post ID is required'
        });
      }

      const requestingUserId = req.user?.id;
      const comments = await ContentService.getPostComments(postId, requestingUserId);

      res.json({
        success: true,
        data: comments
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get my posts (authenticated user's posts)
  static async getMyPosts(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const query = feedQuerySchema.parse(req.query);

      const result = await ContentService.getUserPosts(userId, query, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching my posts:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.issues
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get feed for authenticated user (following + public)
  static async getFeed(req: Request, res: Response) {
    try {
      const requestingUserId = req.user?.id;
      const query = feedQuerySchema.parse(req.query);

      // For now, just return public feed
      // In the future, this could include posts from followed users
      const result = await ContentService.getPublicFeed(query, requestingUserId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching feed:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.issues
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}