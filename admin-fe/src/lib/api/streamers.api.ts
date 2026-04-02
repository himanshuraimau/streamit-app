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
  startedAt?: string | null;
}

interface BackendLiveStreamItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  category: string | null;
  userId: string;
  userName: string;
  isLive: boolean;
  isChatEnabled: boolean;
  startedAt: string | null;
  stats:
    | {
        peakViewers: number;
        totalViewers: number;
        totalLikes: number;
        totalGifts: number;
      }
    | null;
}

interface BackendLiveStreamsResponse {
  data?: BackendLiveStreamItem[];
  count?: number;
}

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeLiveStream = (stream: BackendLiveStreamItem): LiveStream => {
  const startedAt = stream.startedAt ? new Date(stream.startedAt) : null;
  const startedAtMs = startedAt ? startedAt.getTime() : Number.NaN;

  const duration = Number.isFinite(startedAtMs)
    ? Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
    : 0;

  const viewerCount = toFiniteNumber(stream.stats?.totalViewers ?? stream.stats?.peakViewers ?? 0);

  return {
    id: stream.id,
    streamerId: stream.userId,
    streamerName: stream.userName || 'Unknown streamer',
    title: stream.title || 'Untitled stream',
    description: stream.description ?? undefined,
    viewerCount,
    duration,
    category: stream.category ?? undefined,
    thumbnailUrl: stream.thumbnail ?? undefined,
    isLive: Boolean(stream.isLive),
    isChatEnabled: Boolean(stream.isChatEnabled),
    startedAt: stream.startedAt,
  };
};

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
    const response = await adminClient.get<BackendLiveStreamsResponse>('/api/admin/streamers/live');
    const streams = Array.isArray(response.data?.data) ? response.data.data : [];
    return streams.map(normalizeLiveStream);
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
