// Content types matching backend implementation
export type PostType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'MIXED';
export type MediaType = 'IMAGE' | 'VIDEO' | 'GIF';

// Post creation types
export interface CreatePostInput {
  content?: string;
  type: PostType;
  isPublic?: boolean;
  allowComments?: boolean;
  media?: File[];
}

export interface UpdatePostInput {
  content?: string;
  isPublic?: boolean;
  allowComments?: boolean;
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
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  media: MediaResponse[];
  isLiked?: boolean;
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
  createdAt: string;
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
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  replies?: CommentResponse[];
  isLiked?: boolean;
}

// Like types
export interface LikeResponse {
  isLiked: boolean;
  likesCount: number;
}

// Feed query types
export interface FeedQuery {
  cursor?: string;
  limit?: number;
  userId?: string;
  type?: PostType;
  isPublic?: boolean;
}

// Upload progress types
export interface UploadProgress {
  postId?: string;
  mediaCount: number;
  processedCount: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  error?: string;
}