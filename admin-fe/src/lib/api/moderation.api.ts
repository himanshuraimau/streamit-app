import { apiClient } from './client';

export interface ModerationQueueParams {
  page?: number;
  pageSize?: number;
  contentType?: 'post' | 'short' | 'stream';
  category?: string;
  flagCountThreshold?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'flagCount' | 'createdAt' | 'lastFlaggedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ContentDetail {
  id: string;
  type: 'post' | 'short' | 'stream';
  authorId: string;
  authorName: string;
  authorUsername: string;
  content?: string;
  mediaUrls?: string[];
  isFlagged: boolean;
  flagCount: number;
  flagReasons: Array<{
    reason: string;
    reporterId: string;
    reporterName: string;
    createdAt: string;
  }>;
  isHidden: boolean;
  hiddenReason?: string;
  createdAt: string;
  lastFlaggedAt?: string;
}

export interface ModerationActionData {
  action: 'dismiss' | 'warn' | 'remove' | 'strike' | 'ban';
  reason?: string;
  message?: string;
}

export const moderationApi = {
  getQueue: async (params: ModerationQueueParams) => {
    const response = await apiClient.get('/admin/moderation/queue', { params });
    return response.data;
  },

  getContentById: async (id: string): Promise<ContentDetail> => {
    const response = await apiClient.get(`/admin/moderation/${id}`);
    return response.data;
  },

  moderationAction: async (contentId: string, data: ModerationActionData) => {
    const response = await apiClient.patch(`/admin/moderation/${contentId}/action`, data);
    return response.data;
  },

  getShorts: async (params: Omit<ModerationQueueParams, 'contentType'>) => {
    const response = await apiClient.get('/admin/moderation/shorts', { params });
    return response.data;
  },

  getPosts: async (params: Omit<ModerationQueueParams, 'contentType'>) => {
    const response = await apiClient.get('/admin/moderation/posts', { params });
    return response.data;
  },
};
