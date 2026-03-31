import { prisma } from '../../lib/db';
import type { Prisma } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import type { PaginatedResponse } from './audit-log.service';

/**
 * Filters for moderation queue
 */
export interface ModerationQueueFilters {
  contentType?: 'post' | 'short' | 'comment';
  category?: string;
  flagCountMin?: number;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'flagCount' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Content item in moderation queue
 */
export interface ModerationQueueItem {
  id: string;
  type: 'post' | 'short' | 'comment';
  content: string | null;
  authorId: string;
  authorName: string;
  authorUsername: string;
  flagCount: number;
  isFlagged: boolean;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
}

/**
 * Complete content details for moderation
 */
export interface ContentDetails {
  id: string;
  type: 'post' | 'short' | 'comment';
  content: string | null;
  author: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
  };
  flagCount: number;
  isFlagged: boolean;
  isHidden: boolean;
  hiddenReason: string | null;
  hiddenBy: string | null;
  hiddenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  media?: Array<{
    id: string;
    url: string;
    type: string;
    thumbnailUrl: string | null;
  }>;
  reports: Array<{
    id: string;
    reason: string;
    description: string | null;
    reporterName: string;
    createdAt: Date;
  }>;
}

/**
 * Service for content moderation operations
 * Handles flagged content review, moderation actions, and content filtering
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
 */
export class ContentModService {
  /**
   * Get moderation queue with filtering and pagination
   * Returns flagged content awaiting review
   * 
   * @param filters - Filter criteria
   * @param pagination - Pagination parameters
   * @returns Paginated list of flagged content
   * 
   * Requirements: 6.1, 6.2, 6.3
   */
  static async getModerationQueue(
    filters: ModerationQueueFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<ModerationQueueItem>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    // Build where clause for posts/shorts
    const postWhere: Prisma.PostWhereInput = {
      OR: [
        { isFlagged: true },
        { flagCount: { gt: 0 } },
      ],
    };

    // Apply content type filter
    if (filters.contentType === 'short') {
      postWhere.isShort = true;
      postWhere.type = 'VIDEO';
    } else if (filters.contentType === 'post') {
      postWhere.isShort = false;
    }

    // Apply flag count filter
    if (filters.flagCountMin !== undefined) {
      postWhere.flagCount = { gte: filters.flagCountMin };
    }

    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      postWhere.createdAt = {};
      if (filters.dateFrom) {
        postWhere.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        postWhere.createdAt.lte = filters.dateTo;
      }
    }

    // Build order by clause
    const sortBy = filters.sortBy || 'flagCount';
    const sortOrder = filters.sortOrder || 'desc';
    const orderBy: Prisma.PostOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Fetch posts and shorts
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: postWhere,
        skip,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          content: true,
          type: true,
          isShort: true,
          flagCount: true,
          isFlagged: true,
          isHidden: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          author: {
            select: {
              name: true,
              username: true,
            },
          },
          media: {
            select: {
              url: true,
              thumbnailUrl: true,
            },
            take: 1,
          },
        },
      }),
      prisma.post.count({ where: postWhere }),
    ]);

    // Transform to queue items
    const data: ModerationQueueItem[] = posts.map((post) => ({
      id: post.id,
      type: post.isShort ? 'short' : 'post',
      content: post.content,
      authorId: post.authorId,
      authorName: post.author.name,
      authorUsername: post.author.username,
      flagCount: post.flagCount,
      isFlagged: post.isFlagged,
      isHidden: post.isHidden,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      mediaUrl: post.media[0]?.url || null,
      thumbnailUrl: post.media[0]?.thumbnailUrl || null,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Get content details by ID and type
   * 
   * @param id - Content ID
   * @param type - Content type (post, short, comment)
   * @returns Complete content details or null if not found
   * 
   * Requirements: 6.4
   */
  static async getContentById(
    id: string,
    type: 'post' | 'short' | 'comment'
  ): Promise<ContentDetails | null> {
    if (type === 'post' || type === 'short') {
      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              role: true,
            },
          },
          media: {
            select: {
              id: true,
              url: true,
              type: true,
              thumbnailUrl: true,
            },
          },
          reports: {
            select: {
              id: true,
              reason: true,
              description: true,
              reporter: {
                select: {
                  name: true,
                },
              },
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!post) {
        return null;
      }

      return {
        id: post.id,
        type: post.isShort ? 'short' : 'post',
        content: post.content,
        author: {
          id: post.author.id,
          name: post.author.name,
          username: post.author.username,
          email: post.author.email,
          role: post.author.role,
        },
        flagCount: post.flagCount,
        isFlagged: post.isFlagged,
        isHidden: post.isHidden,
        hiddenReason: post.hiddenReason,
        hiddenBy: post.hiddenBy,
        hiddenAt: post.hiddenAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        media: post.media,
        reports: post.reports.map((report) => ({
          id: report.id,
          reason: report.reason,
          description: report.description,
          reporterName: report.reporter.name,
          createdAt: report.createdAt,
        })),
      };
    } else if (type === 'comment') {
      const comment = await prisma.comment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              role: true,
            },
          },
          reports: {
            select: {
              id: true,
              reason: true,
              description: true,
              reporter: {
                select: {
                  name: true,
                },
              },
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!comment) {
        return null;
      }

      return {
        id: comment.id,
        type: 'comment',
        content: comment.content,
        author: {
          id: comment.user.id,
          name: comment.user.name,
          username: comment.user.username,
          email: comment.user.email,
          role: comment.user.role,
        },
        flagCount: 0, // Comments don't have flagCount in schema
        isFlagged: false,
        isHidden: comment.isHidden,
        hiddenReason: comment.hiddenReason,
        hiddenBy: comment.hiddenBy,
        hiddenAt: comment.hiddenAt,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        reports: comment.reports.map((report) => ({
          id: report.id,
          reason: report.reason,
          description: report.description,
          reporterName: report.reporter.name,
          createdAt: report.createdAt,
        })),
      };
    }

    return null;
  }

  /**
   * Dismiss flags on content
   * Clears flags without taking action
   * 
   * @param contentId - Content ID
   * @param contentType - Content type
   * @param adminId - Admin performing the action
   * @returns Updated content
   * 
   * Requirements: 6.5
   */
  static async dismissFlags(
    contentId: string,
    contentType: 'post' | 'short' | 'comment',
    adminId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      let result;

      if (contentType === 'post' || contentType === 'short') {
        result = await tx.post.update({
          where: { id: contentId },
          data: {
            isFlagged: false,
            flagCount: 0,
          },
        });
      } else if (contentType === 'comment') {
        result = await tx.comment.update({
          where: { id: contentId },
          data: {
            isHidden: false,
          },
        });
      }

      // Create audit log
      await AuditLogService.createLog(
        adminId,
        'content_remove',
        contentType === 'short' ? 'short' : contentType,
        contentId,
        {
          action: 'dismiss',
        }
      );

      return result;
    });
  }

  /**
   * Warn content author
   * Sends warning notification to author
   * 
   * @param contentId - Content ID
   * @param contentType - Content type
   * @param message - Warning message
   * @param adminId - Admin performing the action
   * @returns Warning record
   * 
   * Requirements: 6.6
   */
  static async warnAuthor(
    contentId: string,
    contentType: 'post' | 'short' | 'comment',
    message: string,
    adminId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Get content to find author
      let authorId: string;

      if (contentType === 'post' || contentType === 'short') {
        const post = await tx.post.findUnique({
          where: { id: contentId },
          select: { authorId: true },
        });
        if (!post) throw new Error('Content not found');
        authorId = post.authorId;
      } else {
        const comment = await tx.comment.findUnique({
          where: { id: contentId },
          select: { userId: true },
        });
        if (!comment) throw new Error('Content not found');
        authorId = comment.userId;
      }

      // Create audit log
      await AuditLogService.createLog(
        adminId,
        'content_remove',
        contentType === 'short' ? 'short' : contentType,
        contentId,
        {
          action: 'warn',
          message,
          authorId,
        }
      );

      // TODO: Send notification to author
      // This would integrate with a notification service

      return {
        contentId,
        authorId,
        message,
        sentAt: new Date(),
      };
    });
  }

  /**
   * Remove content
   * Hides content from public view
   * 
   * @param contentId - Content ID
   * @param contentType - Content type
   * @param reason - Removal reason
   * @param adminId - Admin performing the action
   * @returns Updated content
   * 
   * Requirements: 6.7
   */
  static async removeContent(
    contentId: string,
    contentType: 'post' | 'short' | 'comment',
    reason: string,
    adminId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      let result;

      if (contentType === 'post' || contentType === 'short') {
        result = await tx.post.update({
          where: { id: contentId },
          data: {
            isHidden: true,
            hiddenReason: reason,
            hiddenBy: adminId,
            hiddenAt: new Date(),
            isFlagged: false,
            flagCount: 0,
          },
        });
      } else if (contentType === 'comment') {
        result = await tx.comment.update({
          where: { id: contentId },
          data: {
            isHidden: true,
            hiddenReason: reason,
            hiddenBy: adminId,
            hiddenAt: new Date(),
          },
        });
      }

      // Create audit log
      await AuditLogService.createLog(
        adminId,
        'content_remove',
        contentType === 'short' ? 'short' : contentType,
        contentId,
        {
          action: 'remove',
          reason,
        }
      );

      return result;
    });
  }

  /**
   * Strike content author
   * Increments author's strike count
   * 
   * @param contentId - Content ID
   * @param contentType - Content type
   * @param adminId - Admin performing the action
   * @returns Strike record
   * 
   * Requirements: 6.8
   */
  static async strikeAuthor(
    contentId: string,
    contentType: 'post' | 'short' | 'comment',
    adminId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Get content to find author
      let authorId: string;

      if (contentType === 'post' || contentType === 'short') {
        const post = await tx.post.findUnique({
          where: { id: contentId },
          select: { authorId: true },
        });
        if (!post) throw new Error('Content not found');
        authorId = post.authorId;

        // Hide the content
        await tx.post.update({
          where: { id: contentId },
          data: {
            isHidden: true,
            hiddenReason: 'Content removed due to strike',
            hiddenBy: adminId,
            hiddenAt: new Date(),
            isFlagged: false,
            flagCount: 0,
          },
        });
      } else {
        const comment = await tx.comment.findUnique({
          where: { id: contentId },
          select: { userId: true },
        });
        if (!comment) throw new Error('Content not found');
        authorId = comment.userId;

        // Hide the comment
        await tx.comment.update({
          where: { id: contentId },
          data: {
            isHidden: true,
            hiddenReason: 'Content removed due to strike',
            hiddenBy: adminId,
            hiddenAt: new Date(),
          },
        });
      }

      // Create audit log for strike
      await AuditLogService.createLog(
        adminId,
        'content_remove',
        contentType === 'short' ? 'short' : contentType,
        contentId,
        {
          action: 'strike',
          authorId,
        }
      );

      // TODO: Increment strike count in user profile
      // This would require adding a strikes field to User model

      return {
        contentId,
        authorId,
        strikeIssuedAt: new Date(),
      };
    });
  }

  /**
   * Ban content author
   * Permanently suspends author account and hides all their content
   * 
   * @param contentId - Content ID
   * @param contentType - Content type
   * @param adminId - Admin performing the action
   * @returns Ban record
   * 
   * Requirements: 6.9
   */
  static async banAuthor(
    contentId: string,
    contentType: 'post' | 'short' | 'comment',
    adminId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Get content to find author
      let authorId: string;

      if (contentType === 'post' || contentType === 'short') {
        const post = await tx.post.findUnique({
          where: { id: contentId },
          select: { authorId: true },
        });
        if (!post) throw new Error('Content not found');
        authorId = post.authorId;
      } else {
        const comment = await tx.comment.findUnique({
          where: { id: contentId },
          select: { userId: true },
        });
        if (!comment) throw new Error('Content not found');
        authorId = comment.userId;
      }

      // Ban the user
      await tx.user.update({
        where: { id: authorId },
        data: {
          isSuspended: true,
          suspendedReason: 'Banned due to content violations',
          suspendedBy: adminId,
          suspendedAt: new Date(),
          suspensionExpiresAt: null, // Permanent ban
        },
      });

      // Hide all user's posts
      await tx.post.updateMany({
        where: { authorId },
        data: {
          isHidden: true,
          hiddenReason: 'Author banned',
          hiddenBy: adminId,
          hiddenAt: new Date(),
        },
      });

      // Hide all user's comments
      await tx.comment.updateMany({
        where: { userId: authorId },
        data: {
          isHidden: true,
          hiddenReason: 'Author banned',
          hiddenBy: adminId,
          hiddenAt: new Date(),
        },
      });

      // Create audit log for ban
      await AuditLogService.createLog(
        adminId,
        'user_ban',
        'user',
        authorId,
        {
          reason: 'Banned due to content violations',
          triggeredByContent: contentId,
          contentType,
        }
      );

      return {
        authorId,
        bannedAt: new Date(),
        contentHidden: true,
      };
    });
  }

  /**
   * Get shorts with filtering and pagination
   * 
   * @param filters - Filter parameters
   * @param pagination - Pagination parameters
   * @returns Paginated list of shorts
   * 
   * Requirements: 6.10
   */
  static async getShorts(
    filters: { flaggedOnly?: boolean; sortBy?: string; sortOrder?: 'asc' | 'desc' },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<ModerationQueueItem>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PostWhereInput = {
      isShort: true,
      type: 'VIDEO',
    };

    if (filters.flaggedOnly) {
      where.OR = [
        { isFlagged: true },
        { flagCount: { gt: 0 } },
      ];
    }

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    const orderBy: Prisma.PostOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          content: true,
          type: true,
          isShort: true,
          flagCount: true,
          isFlagged: true,
          isHidden: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          author: {
            select: {
              name: true,
              username: true,
            },
          },
          media: {
            select: {
              url: true,
              thumbnailUrl: true,
            },
            take: 1,
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const data: ModerationQueueItem[] = posts.map((post) => ({
      id: post.id,
      type: 'short',
      content: post.content,
      authorId: post.authorId,
      authorName: post.author.name,
      authorUsername: post.author.username,
      flagCount: post.flagCount,
      isFlagged: post.isFlagged,
      isHidden: post.isHidden,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      mediaUrl: post.media[0]?.url || null,
      thumbnailUrl: post.media[0]?.thumbnailUrl || null,
    }));

    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Get posts with filtering and pagination
   * 
   * @param filters - Filter parameters
   * @param pagination - Pagination parameters
   * @returns Paginated list of posts
   * 
   * Requirements: 6.11
   */
  static async getPosts(
    filters: { flaggedOnly?: boolean; sortBy?: string; sortOrder?: 'asc' | 'desc' },
    pagination: PaginationParams
  ): Promise<PaginatedResponse<ModerationQueueItem>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PostWhereInput = {
      isShort: false,
    };

    if (filters.flaggedOnly) {
      where.OR = [
        { isFlagged: true },
        { flagCount: { gt: 0 } },
      ];
    }

    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    const orderBy: Prisma.PostOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          content: true,
          type: true,
          isShort: true,
          flagCount: true,
          isFlagged: true,
          isHidden: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          author: {
            select: {
              name: true,
              username: true,
            },
          },
          media: {
            select: {
              url: true,
              thumbnailUrl: true,
            },
            take: 1,
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const data: ModerationQueueItem[] = posts.map((post) => ({
      id: post.id,
      type: 'post',
      content: post.content,
      authorId: post.authorId,
      authorName: post.author.name,
      authorUsername: post.author.username,
      flagCount: post.flagCount,
      isFlagged: post.isFlagged,
      isHidden: post.isHidden,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      mediaUrl: post.media[0]?.url || null,
      thumbnailUrl: post.media[0]?.thumbnailUrl || null,
    }));

    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }
}
