import type { Request, Response } from 'express';
import { z } from 'zod';
import { ContentModService } from '../services/content-mod.service';
import {
  getModerationQueueSchema,
  moderationActionSchema,
  getShortsSchema,
  getPostsSchema,
} from '../validations/content-mod.schema';

/**
 * Controller for content moderation operations
 * Handles HTTP requests for moderation queue, content review, and moderation actions
 *
 * Requirements: 17.2
 */
export class ContentModController {
  /**
   * Get moderation queue with filtering and pagination
   * GET /api/admin/moderation/queue
   *
   * Query parameters:
   * - page: number (default: 1)
   * - pageSize: number (default: 20, max: 100)
   * - contentType: 'post' | 'short' | 'comment' (optional)
   * - category: string (optional)
   * - flagCountMin: number (optional)
   * - dateFrom: date (optional)
   * - dateTo: date (optional)
   * - sortBy: 'flagCount' | 'createdAt' | 'updatedAt' (default: 'flagCount')
   * - sortOrder: 'asc' | 'desc' (default: 'desc')
   *
   * Requirements: 6.1, 6.2, 6.3
   */
  static async getModerationQueue(req: Request, res: Response) {
    try {
      // Validate query parameters
      const params = getModerationQueueSchema.parse(req.query);

      // Extract pagination and filters
      const pagination = {
        page: params.page,
        pageSize: params.pageSize,
      };

      const filters = {
        contentType: params.contentType,
        category: params.category,
        flagCountMin: params.flagCountMin,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      };

      // Call service
      const result = await ContentModService.getModerationQueue(filters, pagination);

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error getting moderation queue:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get moderation queue',
      });
    }
  }

  /**
   * Get content details by ID
   * GET /api/admin/moderation/:contentId
   *
   * Query parameters:
   * - type: 'post' | 'short' | 'comment' (required)
   *
   * Returns complete content details with flags and reports
   *
   * Requirements: 6.4
   */
  static async getContentById(req: Request, res: Response) {
    try {
      const { contentId } = req.params;
      const { type } = req.query;

      if (!contentId) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Content ID is required',
        });
      }

      if (!type || !['post', 'short', 'comment'].includes(type as string)) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Valid content type is required (post, short, or comment)',
        });
      }

      // Call service
      const content = await ContentModService.getContentById(
        contentId,
        type as 'post' | 'short' | 'comment'
      );

      if (!content) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Content not found',
        });
      }

      // Return response
      res.json(content);
    } catch (error) {
      console.error('Error getting content:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get content details',
      });
    }
  }

  /**
   * Perform moderation action on content
   * PATCH /api/admin/moderation/:contentId/action
   *
   * Query parameters:
   * - type: 'post' | 'short' | 'comment' (required)
   *
   * Body:
   * - action: 'dismiss' | 'warn' | 'remove' | 'strike' | 'ban' (required)
   * - message: string (optional, required for 'warn')
   * - reason: string (optional, required for 'remove')
   *
   * Requirements: 6.5, 6.6, 6.7, 6.8, 6.9
   */
  static async moderationAction(req: Request, res: Response) {
    try {
      const { contentId } = req.params;
      const { type } = req.query;

      if (!contentId) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Content ID is required',
        });
      }

      if (!type || !['post', 'short', 'comment'].includes(type as string)) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Valid content type is required (post, short, or comment)',
        });
      }

      // Validate request body
      const data = moderationActionSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      const contentType = type as 'post' | 'short' | 'comment';

      // Execute action based on type
      let result;
      let message: string;

      switch (data.action) {
        case 'dismiss':
          result = await ContentModService.dismissFlags(contentId, contentType, adminId);
          message = 'Flags dismissed successfully';
          break;

        case 'warn':
          if (!data.message) {
            return res.status(400).json({
              error: 'Validation failed',
              message: 'Warning message is required for warn action',
            });
          }
          result = await ContentModService.warnAuthor(
            contentId,
            contentType,
            data.message,
            adminId
          );
          message = 'Warning sent to author successfully';
          break;

        case 'remove':
          if (!data.reason) {
            return res.status(400).json({
              error: 'Validation failed',
              message: 'Removal reason is required for remove action',
            });
          }
          result = await ContentModService.removeContent(
            contentId,
            contentType,
            data.reason,
            adminId
          );
          message = 'Content removed successfully';
          break;

        case 'strike':
          result = await ContentModService.strikeAuthor(contentId, contentType, adminId);
          message = 'Strike issued to author successfully';
          break;

        case 'ban':
          result = await ContentModService.banAuthor(contentId, contentType, adminId);
          message = 'Author banned successfully';
          break;

        default:
          return res.status(400).json({
            error: 'Validation failed',
            message: 'Invalid action type',
          });
      }

      // Return response
      res.json({
        success: true,
        message,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error performing moderation action:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to perform moderation action',
      });
    }
  }

  /**
   * Get shorts with filtering and pagination
   * GET /api/admin/moderation/shorts
   *
   * Query parameters:
   * - page: number (default: 1)
   * - pageSize: number (default: 20, max: 100)
   * - flaggedOnly: boolean (default: false)
   * - sortBy: 'createdAt' | 'viewsCount' | 'likesCount' | 'flagCount' (default: 'createdAt')
   * - sortOrder: 'asc' | 'desc' (default: 'desc')
   *
   * Requirements: 6.10
   */
  static async getShorts(req: Request, res: Response) {
    try {
      // Validate query parameters
      const params = getShortsSchema.parse(req.query);

      // Extract pagination and filters
      const pagination = {
        page: params.page,
        pageSize: params.pageSize,
      };

      const filters = {
        flaggedOnly: params.flaggedOnly,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      };

      // Call service
      const result = await ContentModService.getShorts(filters, pagination);

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error getting shorts:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get shorts',
      });
    }
  }

  /**
   * Get posts with filtering and pagination
   * GET /api/admin/moderation/posts
   *
   * Query parameters:
   * - page: number (default: 1)
   * - pageSize: number (default: 20, max: 100)
   * - flaggedOnly: boolean (default: false)
   * - sortBy: 'createdAt' | 'likesCount' | 'commentsCount' | 'flagCount' (default: 'createdAt')
   * - sortOrder: 'asc' | 'desc' (default: 'desc')
   *
   * Requirements: 6.11
   */
  static async getPosts(req: Request, res: Response) {
    try {
      // Validate query parameters
      const params = getPostsSchema.parse(req.query);

      // Extract pagination and filters
      const pagination = {
        page: params.page,
        pageSize: params.pageSize,
      };

      const filters = {
        flaggedOnly: params.flaggedOnly,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      };

      // Call service
      const result = await ContentModService.getPosts(filters, pagination);

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error getting posts:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get posts',
      });
    }
  }
}
