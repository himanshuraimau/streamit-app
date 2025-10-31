import { PostType, MediaType } from '@prisma/client';

// Post creation types
export interface CreatePostInput {
  content?: string;
  type: PostType;
  isPublic?: boolean;
  allowComments?: boolean;
  media?: MediaUploadInput[];
}

export interface UpdatePostInput {
  content?: string;
  isPublic?: boolean;
  allowComments?: boolean;
}

export interface MediaUploadInput {
  file: Express.Multer.File;
  type: MediaType;
  thumbnailFile?: Express.Multer.File; // For video thumbnails
}

export interface ProcessedMediaInput {
  url: string;
  type: MediaType;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
}

// Response types
export interface PostResponse {
  id: string;
  content: string | null;
  type: PostType;
  isPublic: boolean;
  allowComments: boolean;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  media: MediaResponse[];
  isLiked?: boolean; // For authenticated user
}

export interface MediaResponse {
  id: string;
  url: string;
  type: MediaType;
  mimeType: string;
  size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  thumbnailUrl: string | null;
  createdAt: Date;
}

export interface PostFeedResponse {
  posts: PostResponse[];
  hasMore: boolean;
  nextCursor?: string;
}

// Comment types
export interface CreateCommentInput {
  content: string;
  postId: string;
  parentId?: string;
}

export interface CommentResponse {
  id: string;
  content: string;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  replies?: CommentResponse[];
  isLiked?: boolean; // For authenticated user
}

// Like types
export interface LikeResponse {
  isLiked: boolean;
  likesCount: number;
}

// Media processing types
export interface MediaProcessingResult {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

// Feed query types
export interface FeedQuery {
  cursor?: string;
  limit?: number;
  userId?: string; // For user-specific feeds
  type?: PostType;
  isPublic?: boolean;
}

// File validation types
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

// Upload progress types
export interface UploadProgress {
  postId: string;
  mediaCount: number;
  processedCount: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}