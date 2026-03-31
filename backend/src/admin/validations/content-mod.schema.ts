import { z } from 'zod';

/**
 * Validation schemas for content moderation operations
 * 
 * Requirements: 17.5
 */

/**
 * Moderation action types
 */
export const moderationActionEnum = z.enum([
  'dismiss',
  'warn',
  'remove',
  'strike',
  'ban',
]);

/**
 * Schema for moderation action request
 * Used for PATCH /api/admin/moderation/:contentId/action
 */
export const moderationActionSchema = z.object({
  action: moderationActionEnum,
  message: z.string().min(10).max(500).optional(),
  reason: z.string().min(10).max(500).optional(),
});

/**
 * Schema for warning author
 */
export const warnAuthorSchema = z.object({
  message: z.string().min(10, 'Warning message must be at least 10 characters').max(500),
});

/**
 * Schema for removing content
 */
export const removeContentSchema = z.object({
  reason: z.string().min(10, 'Removal reason must be at least 10 characters').max(500),
});

/**
 * Schema for getting moderation queue
 * Query parameters for GET /api/admin/moderation/queue
 */
export const getModerationQueueSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  contentType: z.enum(['post', 'short', 'comment']).optional(),
  category: z.string().optional(),
  flagCountMin: z.coerce.number().int().nonnegative().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  sortBy: z.enum(['flagCount', 'createdAt', 'updatedAt']).default('flagCount'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for getting shorts
 * Query parameters for GET /api/admin/moderation/shorts
 */
export const getShortsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  flaggedOnly: z.coerce.boolean().default(false),
  sortBy: z.enum(['createdAt', 'viewsCount', 'likesCount', 'flagCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Schema for getting posts
 * Query parameters for GET /api/admin/moderation/posts
 */
export const getPostsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  flaggedOnly: z.coerce.boolean().default(false),
  sortBy: z.enum(['createdAt', 'likesCount', 'commentsCount', 'flagCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ModerationAction = z.infer<typeof moderationActionEnum>;
export type ModerationActionRequest = z.infer<typeof moderationActionSchema>;
export type WarnAuthorRequest = z.infer<typeof warnAuthorSchema>;
export type RemoveContentRequest = z.infer<typeof removeContentSchema>;
export type GetModerationQueueParams = z.infer<typeof getModerationQueueSchema>;
export type GetShortsParams = z.infer<typeof getShortsSchema>;
export type GetPostsParams = z.infer<typeof getPostsSchema>;
