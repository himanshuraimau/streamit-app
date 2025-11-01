import { z } from 'zod';
import { PostType, MediaType } from '@prisma/client';

// Post validation schemas
export const createPostSchema = z.object({
  content: z.string().max(2000, 'Content cannot exceed 2000 characters').optional(),
  type: z.enum([PostType.TEXT, PostType.IMAGE, PostType.VIDEO, PostType.MIXED]),
  isPublic: z.coerce.boolean().default(true),
  allowComments: z.coerce.boolean().default(true),
}).refine((data) => {
  // Text posts must have content
  if (data.type === PostType.TEXT && (!data.content || data.content.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Text posts must have content',
  path: ['content']
});

export const updatePostSchema = z.object({
  content: z.string().max(2000, 'Content cannot exceed 2000 characters').optional(),
  isPublic: z.coerce.boolean().optional(),
  allowComments: z.coerce.boolean().optional(),
});

// Comment validation schemas
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment cannot exceed 500 characters'),
  postId: z.string().cuid('Invalid post ID'),
  parentId: z.string().cuid('Invalid parent comment ID').optional(),
});

// Media validation schemas
export const mediaUploadSchema = z.object({
  type: z.enum([MediaType.IMAGE, MediaType.VIDEO, MediaType.GIF]),
});

// Feed query validation
export const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  userId: z.string().cuid().optional(),
  type: z.enum([PostType.TEXT, PostType.IMAGE, PostType.VIDEO, PostType.MIXED]).optional(),
  isPublic: z.coerce.boolean().optional(),
});

// File validation constants
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo' // .avi
];

export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  GIF: 20 * 1024 * 1024, // 20MB
};

export const MAX_MEDIA_PER_POST = 10;

// File validation functions
export const validateImageFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return {
      isValid: false,
      error: 'Invalid image type. Only JPEG, PNG, WebP, and GIF are allowed.'
    };
  }

  if (file.size > MAX_FILE_SIZES.IMAGE) {
    return {
      isValid: false,
      error: `Image size too large. Maximum size is ${MAX_FILE_SIZES.IMAGE / (1024 * 1024)}MB.`
    };
  }

  return { isValid: true };
};

export const validateVideoFile = (file: Express.Multer.File): { isValid: boolean; error?: string } => {
  if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    return {
      isValid: false,
      error: 'Invalid video type. Only MP4, WebM, QuickTime, and AVI are allowed.'
    };
  }

  if (file.size > MAX_FILE_SIZES.VIDEO) {
    return {
      isValid: false,
      error: `Video size too large. Maximum size is ${MAX_FILE_SIZES.VIDEO / (1024 * 1024)}MB.`
    };
  }

  return { isValid: true };
};

export const validateMediaFile = (file: Express.Multer.File, type: MediaType): { isValid: boolean; error?: string } => {
  switch (type) {
    case MediaType.IMAGE:
    case MediaType.GIF:
      return validateImageFile(file);
    case MediaType.VIDEO:
      return validateVideoFile(file);
    default:
      return {
        isValid: false,
        error: 'Invalid media type'
      };
  }
};

// Type exports
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type FeedQueryInput = z.infer<typeof feedQuerySchema>;
export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;