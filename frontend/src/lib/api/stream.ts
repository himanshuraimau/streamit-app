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
  // Create stream ingress (generate stream key)
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
      const headers = await getAuthHeaders();
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
};
