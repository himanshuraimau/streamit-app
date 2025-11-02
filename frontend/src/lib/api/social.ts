import { authClient } from '@/lib/auth-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
  const session = await authClient.getSession();
  if (!session?.data?.session?.token) throw new Error('No authentication token found');

  return {
    'Authorization': `Bearer ${session.data.session.token}`,
    'Content-Type': 'application/json',
  };
};

export interface CreatorProfile {
  id: string;
  username: string;
  name?: string | null;
  image?: string | null;
  bio?: string | null;
  categories?: string[] | null;
  profilePicture?: string | null;
  isLive: boolean;
  streamTitle?: string | null;
  streamThumbnail?: string | null;
  isChatEnabled?: boolean;
  isChatFollowersOnly?: boolean;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface CreatorProfileResponse {
  success: boolean;
  data?: CreatorProfile;
  error?: string;
}

export interface FollowResponse {
  success: boolean;
  message?: string;
  data?: {
    followerId: string;
    followingId: string;
  };
}

export interface FollowingUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  isLive: boolean;
}

export interface Creator {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  isLive: boolean;
  followerCount: number;
}

export const socialApi = {
  async getCreatorProfile(username: string): Promise<CreatorProfileResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/creator/${username}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (err) {
      console.error('Error fetching creator profile:', err);
      throw err;
    }
  },

  async followUser(userId: string): Promise<FollowResponse> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/social/follow/${userId}`, {
        method: 'POST',
        headers,
      });
      return await response.json();
    } catch (err) {
      console.error('Error following user:', err);
      throw err;
    }
  },

  async unfollowUser(userId: string): Promise<FollowResponse> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/social/follow/${userId}`, {
        method: 'DELETE',
        headers,
      });
      return await response.json();
    } catch (err) {
      console.error('Error unfollowing user:', err);
      throw err;
    }
  },

  async getFollowing(userId: string): Promise<{ success: boolean; data?: FollowingUser[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/following/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (err) {
      console.error('Error fetching following:', err);
      throw err;
    }
  },

  async getCreators(): Promise<{ success: boolean; data?: Creator[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social/creators`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (err) {
      console.error('Error fetching creators:', err);
      throw err;
    }
  },
};
