const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchQuery {
  q: string;
  type?: 'all' | 'streams' | 'users';
  live?: boolean;
  sort?: 'relevance' | 'viewers' | 'recent';
  limit?: number;
  offset?: number;
}

export interface StreamResult {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  isLive: boolean;
  viewerCount: number;
  user: {
    id: string;
    username: string | null;
    imageUrl: string | null;
  };
}

export interface UserResult {
  id: string;
  username: string | null;
  imageUrl: string | null;
  bio: string | null;
  isLive: boolean;
  followerCount: number;
}

export interface SearchResults {
  streams: StreamResult[];
  users: UserResult[];
  total: {
    streams: number;
    users: number;
  };
}

class SearchApi {
  /**
   * Search across streams and users
   */
  async search(params: SearchQuery): Promise<ApiResponse<SearchResults>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('q', params.q);
      
      if (params.type) queryParams.append('type', params.type);
      if (params.live !== undefined) queryParams.append('live', String(params.live));
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.limit) queryParams.append('limit', String(params.limit));
      if (params.offset) queryParams.append('offset', String(params.offset));

      const response = await fetch(
        `${API_BASE_URL}/api/search?${queryParams.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      return await response.json();
    } catch (error) {
      console.error('[SearchApi] Search error:', error);
      return {
        success: false,
        error: 'Failed to perform search',
      };
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(query: string): Promise<ApiResponse<string[]>> {
    try {
      if (query.trim().length < 2) {
        return { success: true, data: [] };
      }

      const response = await fetch(
        `${API_BASE_URL}/api/search/suggestions?q=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      return await response.json();
    } catch (error) {
      console.error('[SearchApi] Suggestions error:', error);
      return {
        success: false,
        error: 'Failed to get suggestions',
      };
    }
  }
}

export const searchApi = new SearchApi();
