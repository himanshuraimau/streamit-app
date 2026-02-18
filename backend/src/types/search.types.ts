/**
 * Search query and result types
 */

export interface SearchQuery {
  q: string;
  type?: 'all' | 'streams' | 'users' | 'categories';
  live?: string | boolean;
  category?: string;
  sort?: 'relevance' | 'viewers' | 'recent';
  limit?: string | number;
  offset?: string | number;
}

export interface StreamSearchResult {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  isLive: boolean;
  viewerCount: number;
  category: string | null;
  user: {
    id: string;
    username: string | null;
    imageUrl: string | null;
  };
}

export interface UserSearchResult {
  id: string;
  username: string | null;
  imageUrl: string | null;
  bio: string | null;
  isLive: boolean;
  followerCount: number;
}

export interface CategorySearchResult {
  name: string;
  streamCount: number;
  viewerCount: number;
}

export interface SearchResults {
  streams: StreamSearchResult[];
  users: UserSearchResult[];
  categories: CategorySearchResult[];
  total: {
    streams: number;
    users: number;
    categories: number;
  };
}
