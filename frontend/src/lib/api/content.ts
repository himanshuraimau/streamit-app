import { authClient } from '@/lib/auth-client';
import type {
  CreatePostInput,
  UpdatePostInput,
  PostResponse,
  PostFeedResponse,
  CreateCommentInput,
  CommentResponse,
  LikeResponse,
  FeedQuery,
} from '@/types/content';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const session = await authClient.getSession();
  if (!session?.data?.session?.token) {
    throw new Error('No authentication token found');
  }

  return {
    'Authorization': `Bearer ${session.data.session.token}`,
    'Content-Type': 'application/json',
  };
};

// Helper function to get auth headers for file upload
const getAuthHeadersForUpload = async () => {
  const session = await authClient.getSession();
  if (!session?.data?.session?.token) {
    throw new Error('No authentication token found');
  }

  return {
    'Authorization': `Bearer ${session.data.session.token}`,
  };
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any[];
}

export const contentApi = {
  // Public endpoints (no auth required)

  // Get public feed
  async getPublicFeed(query: FeedQuery = {}): Promise<ApiResponse<PostFeedResponse>> {
    try {
      const params = new URLSearchParams();
      if (query.cursor) params.append('cursor', query.cursor);
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.type) params.append('type', query.type);

      const response = await fetch(`${API_BASE_URL}/api/content/feed/public?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching public feed:', error);
      throw error;
    }
  },

  // Get single post
  async getPost(postId: string): Promise<ApiResponse<PostResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/content/posts/${postId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  // Get post comments
  async getPostComments(postId: string): Promise<ApiResponse<CommentResponse[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/content/posts/${postId}/comments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching post comments:', error);
      throw error;
    }
  },

  // Get user posts (public)
  async getUserPosts(userId: string, query: FeedQuery = {}): Promise<ApiResponse<PostFeedResponse>> {
    try {
      const params = new URLSearchParams();
      if (query.cursor) params.append('cursor', query.cursor);
      if (query.limit) params.append('limit', query.limit.toString());

      const response = await fetch(`${API_BASE_URL}/api/content/users/${userId}/posts?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  },

  // Protected endpoints (auth required)

  // Create post
  async createPost(data: CreatePostInput): Promise<ApiResponse<PostResponse>> {
    try {
      const headers = await getAuthHeadersForUpload();
      const formData = new FormData();

      // Add text data
      if (data.content) formData.append('content', data.content);
      formData.append('type', data.type);
      if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic.toString());
      if (data.allowComments !== undefined) formData.append('allowComments', data.allowComments.toString());

      // Add media files
      if (data.media && data.media.length > 0) {
        data.media.forEach((file) => {
          formData.append('media', file);
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/content/posts`, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Get my posts
  async getMyPosts(query: FeedQuery = {}): Promise<ApiResponse<PostFeedResponse>> {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (query.cursor) params.append('cursor', query.cursor);
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.type) params.append('type', query.type);

      const response = await fetch(`${API_BASE_URL}/api/content/posts?${params}`, {
        method: 'GET',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching my posts:', error);
      throw error;
    }
  },

  // Update post
  async updatePost(postId: string, data: UpdatePostInput): Promise<ApiResponse<PostResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/content/posts/${postId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Delete post
  async deletePost(postId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/content/posts/${postId}`, {
        method: 'DELETE',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Toggle post like
  async togglePostLike(postId: string): Promise<ApiResponse<LikeResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/content/posts/${postId}/like`, {
        method: 'POST',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error toggling post like:', error);
      throw error;
    }
  },

  // Add comment
  async addComment(data: CreateCommentInput): Promise<ApiResponse<CommentResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/content/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Get personalized feed
  async getFeed(query: FeedQuery = {}): Promise<ApiResponse<PostFeedResponse>> {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (query.cursor) params.append('cursor', query.cursor);
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.type) params.append('type', query.type);

      const response = await fetch(`${API_BASE_URL}/api/content/feed?${params}`, {
        method: 'GET',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching feed:', error);
      throw error;
    }
  },

  // NEW: Get trending content
  async getTrending(params: {
    page?: number;
    limit?: number;
    timeRange?: '24h' | '7d' | '30d';
  } = {}): Promise<ApiResponse<PostFeedResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.timeRange) queryParams.append('timeRange', params.timeRange);

      const response = await fetch(`${API_BASE_URL}/api/content/trending?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching trending content:', error);
      throw error;
    }
  },

  // NEW: Track post view
  async trackView(postId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/content/posts/${postId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error tracking post view:', error);
      // Don't throw error for tracking - it's not critical
      return { success: false, error: 'Failed to track view' };
    }
  },

  // NEW: Track post share
  async trackShare(postId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/content/posts/${postId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error tracking post share:', error);
      // Don't throw error for tracking - it's not critical
      return { success: false, error: 'Failed to track share' };
    }
  },

  // NEW: Get shorts from followed creators
  async getFollowingShorts(params: { cursor?: string; limit?: number } = {}): Promise<ApiResponse<PostFeedResponse>> {
    try {
      const headers = await getAuthHeaders();
      const queryParams = new URLSearchParams();
      if (params.cursor) queryParams.append('cursor', params.cursor);
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(`${API_BASE_URL}/api/content/shorts/following?${queryParams}`, {
        method: 'GET',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching following shorts:', error);
      throw error;
    }
  },

  // NEW: Get trending shorts
  async getTrendingShorts(params: {
    page?: number;
    limit?: number;
    timeRange?: '24h' | '7d' | '30d';
  } = {}): Promise<ApiResponse<PostFeedResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.timeRange) queryParams.append('timeRange', params.timeRange);

      const response = await fetch(`${API_BASE_URL}/api/content/shorts/trending?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching trending shorts:', error);
      throw error;
    }
  },

  // NEW: Get all public shorts (discover)
  async getAllShorts(params: { cursor?: string; limit?: number } = {}): Promise<ApiResponse<PostFeedResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.cursor) queryParams.append('cursor', params.cursor);
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await fetch(`${API_BASE_URL}/api/content/shorts?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching all shorts:', error);
      throw error;
    }
  },
};