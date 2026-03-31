import { adminClient } from './client';
import type { PaginatedResponse } from './users.api';

export interface ListApplicationsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreatorApplication {
  id: string;
  userId: string;
  applicantName: string;
  email: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface ApplicationDetail extends CreatorApplication {
  identityDocuments?: string[];
  financialDetails?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
  };
  profileInfo?: {
    bio?: string;
    socialLinks?: Record<string, string>;
  };
}

export interface LiveStream {
  id: string;
  streamerId: string;
  streamerName: string;
  title: string;
  description?: string;
  viewerCount: number;
  duration: number;
  category?: string;
  thumbnailUrl?: string;
  isLive: boolean;
  isChatEnabled: boolean;
  startedAt: string;
}

export interface RejectApplicationData {
  reason: string;
}

export interface KillStreamData {
  reason: string;
}

export interface WarnStreamerData {
  message: string;
}

export interface SuspendStreamerData {
  reason: string;
}

export const streamersApi = {
  listApplications: async (
    params: ListApplicationsParams
  ): Promise<PaginatedResponse<CreatorApplication>> => {
    const response = await adminClient.get('/api/admin/streamers/applications', { params });
    return response.data;
  },

  getApplicationById: async (id: string): Promise<ApplicationDetail> => {
    const response = await adminClient.get(`/api/admin/streamers/applications/${id}`);
    return response.data;
  },

  approveApplication: async (id: string): Promise<void> => {
    await adminClient.post(`/api/admin/streamers/applications/${id}/approve`);
  },

  rejectApplication: async (id: string, data: RejectApplicationData): Promise<void> => {
    await adminClient.post(`/api/admin/streamers/applications/${id}/reject`, data);
  },

  listLiveStreams: async (): Promise<LiveStream[]> => {
    const response = await adminClient.get('/api/admin/streamers/live');
    return response.data;
  },

  killStream: async (id: string, data: KillStreamData): Promise<void> => {
    await adminClient.post(`/api/admin/streamers/${id}/kill-stream`, data);
  },

  muteStreamer: async (id: string): Promise<void> => {
    await adminClient.post(`/api/admin/streamers/${id}/mute`);
  },

  disableStreamChat: async (id: string): Promise<void> => {
    await adminClient.post(`/api/admin/streamers/${id}/disable-chat`);
  },

  warnStreamer: async (id: string, data: WarnStreamerData): Promise<void> => {
    await adminClient.post(`/api/admin/streamers/${id}/warn`, data);
  },

  suspendStreamer: async (id: string, data: SuspendStreamerData): Promise<void> => {
    await adminClient.post(`/api/admin/streamers/${id}/suspend`, data);
  },
};
