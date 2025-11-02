import { authClient } from '@/lib/auth-client';

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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StreamIngress {
  ingressId: string;
  serverUrl: string;
  streamKey: string;
  userId: string;
}

export interface StreamCredentials {
  ingressId: string | null;
  serverUrl: string | null;
  streamKey: string | null;
}

export interface StreamInfo {
  id: string;
  title: string;
  thumbnail: string | null;
  isLive: boolean;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
  userId: string;
  streamKey?: string;
  serverUrl?: string;
  ingressId?: string;
}

export interface StreamStatus {
  isLive: boolean;
  viewerCount: number;
  stream: StreamInfo;
}

export interface UpdateStreamInfoRequest {
  title?: string;
  thumbnail?: string;
}

export interface UpdateChatSettingsRequest {
  isChatEnabled?: boolean;
  isChatDelayed?: boolean;
  isChatFollowersOnly?: boolean;
}

export interface CreateStreamRequest {
  title: string;
  description?: string;
  thumbnail?: string;
  chatSettings?: {
    isChatEnabled?: boolean;
    isChatDelayed?: boolean;
    isChatFollowersOnly?: boolean;
  };
  streamMethod: 'browser' | 'obs';
}

export interface CreateStreamResponse {
  stream: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
  };
  credentials: {
    serverUrl: string;
    streamKey: string;
  };
  streamMethod: 'browser' | 'obs';
}

export interface PastStreamsResponse {
  streams: StreamInfo[];
  total: number;
}

export interface ViewerTokenRequest {
  hostId: string;
  guestName?: string;
}

export interface ViewerTokenResponse {
  token: string;
  identity: string;
  name: string;
  wsUrl: string;
}

export const streamApi = {
  // NEW FLOW: Create stream with metadata
  async createStreamWithMetadata(data: CreateStreamRequest): Promise<ApiResponse<CreateStreamResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stream/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Error creating stream:', error);
      throw error;
    }
  },

  // Get past streams
  async getPastStreams(limit = 10, offset = 0): Promise<ApiResponse<PastStreamsResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/api/stream/past?limit=${limit}&offset=${offset}`,
        { method: 'GET', headers }
      );

      return await response.json();
    } catch (error) {
      console.error('Error fetching past streams:', error);
      throw error;
    }
  },

  // Create stream ingress (generate stream key) - OLD FLOW
  async createIngress(ingressType: 'RTMP' | 'WHIP' = 'RTMP'): Promise<ApiResponse<StreamIngress>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stream/ingress`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ingressType }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error creating ingress:', error);
      throw error;
    }
  },

  // Delete stream ingress
  async deleteIngress(): Promise<ApiResponse<{ message: string }>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stream/ingress`, {
        method: 'DELETE',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error deleting ingress:', error);
      throw error;
    }
  },

  // Get stream info
  async getStreamInfo(): Promise<ApiResponse<StreamInfo>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stream/info`, {
        method: 'GET',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching stream info:', error);
      throw error;
    }
  },

  // Get stream credentials (including stream key)
  async getStreamCredentials(): Promise<ApiResponse<StreamCredentials>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stream/credentials`, {
        method: 'GET',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching stream credentials:', error);
      throw error;
    }
  },

  // Update stream info (title, thumbnail)
  async updateStreamInfo(data: UpdateStreamInfoRequest): Promise<ApiResponse<StreamInfo>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stream/info`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Error updating stream info:', error);
      throw error;
    }
  },

  // Update chat settings
  async updateChatSettings(data: UpdateChatSettingsRequest): Promise<ApiResponse<StreamInfo>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stream/chat-settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (error) {
      console.error('Error updating chat settings:', error);
      throw error;
    }
  },

  // Get stream status (live status, viewer count)
  async getStreamStatus(): Promise<ApiResponse<StreamStatus>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stream/status`, {
        method: 'GET',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching stream status:', error);
      throw error;
    }
  },

  // Get viewer token (for viewing own stream)
  async getViewerToken(hostId: string, guestName?: string): Promise<ApiResponse<ViewerTokenResponse>> {
    try {
      // Try to get auth headers, but don't throw if not authenticated
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      try {
        const authHeaders = await getAuthHeaders();
        headers = authHeaders;
      } catch {
        // Not authenticated - will use guest mode with guestName
        console.log('[streamApi] No session found, using guest mode');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/viewer/token`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ hostId, guestName }),
      });

      return await response.json();
    } catch (error) {
      console.error('Error getting viewer token:', error);
      throw error;
    }
  },

  // Get creator's own stream token (for viewing own stream as creator)
  async getCreatorViewToken(): Promise<ApiResponse<ViewerTokenResponse>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/stream/creator-token`, {
        method: 'POST',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error getting creator view token:', error);
      throw error;
    }
  },
};

// Viewer API - Public endpoints for watching streams
export interface LiveStream {
  id: string;
  title: string;
  thumbnail: string | null;
  isLive: boolean;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
}

export interface StreamByUsername {
  id: string;
  title: string;
  thumbnail: string | null;
  isLive: boolean;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
  userId: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
}

export const viewerApi = {
  // Get all live streams (public)
  async getLiveStreams(): Promise<ApiResponse<LiveStream[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/viewer/live`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching live streams:', error);
      throw error;
    }
  },

  // Get stream by username (public)
  async getStreamByUsername(username: string): Promise<ApiResponse<StreamByUsername>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/viewer/stream/${username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching stream by username:', error);
      throw error;
    }
  },

  // Get followed streams (requires auth)
  async getFollowedStreams(): Promise<ApiResponse<LiveStream[]>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/viewer/following`, {
        method: 'GET',
        headers,
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching followed streams:', error);
      throw error;
    }
  },
};
