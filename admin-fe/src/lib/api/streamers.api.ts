import { adminClient } from './client';
import type { PaginatedResponse } from './users.api';

export interface ListApplicationsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type ApplicationStatus = 'DRAFT' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface CreatorApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userUsername: string;
  status: ApplicationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface ApplicationReviewer {
  id: string;
  name: string;
  email: string;
}

export interface ApplicationDetail {
  id: string;
  userId: string;
  status: ApplicationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewedByAdmin: ApplicationReviewer | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    isSuspended: boolean;
    suspendedReason: string | null;
    suspendedAt: string | null;
    suspensionExpiresAt: string | null;
  };
  identity: {
    idType: string;
    idDocumentUrl: string;
    selfiePhotoUrl: string;
    isVerified: boolean;
    verifiedAt: string | null;
    verifiedBy: string | null;
    verifiedByAdmin: ApplicationReviewer | null;
  } | null;
  financial: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    panNumber: string;
    isVerified: boolean;
    verifiedAt: string | null;
    verifiedBy: string | null;
    verifiedByAdmin: ApplicationReviewer | null;
  } | null;
  profile: {
    profilePictureUrl: string;
    bio: string;
    categories: string[];
  } | null;
}

interface BackendCreatorApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userUsername: string;
  status: ApplicationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

interface BackendReviewer {
  id: string;
  name: string;
  email: string;
}

interface BackendApplicationDetail {
  id: string;
  userId: string;
  status: ApplicationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewedByAdmin: BackendReviewer | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    isSuspended: boolean;
    suspendedReason: string | null;
    suspendedAt: string | null;
    suspensionExpiresAt: string | null;
  };
  identity: {
    idType: string;
    idDocumentUrl: string;
    selfiePhotoUrl: string;
    isVerified: boolean;
    verifiedAt: string | null;
    verifiedBy: string | null;
    verifiedByAdmin: BackendReviewer | null;
  } | null;
  financial: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    panNumber: string;
    isVerified: boolean;
    verifiedAt: string | null;
    verifiedBy: string | null;
    verifiedByAdmin: BackendReviewer | null;
  } | null;
  profile: {
    profilePictureUrl: string;
    bio: string;
    categories: string[];
  } | null;
}

const normalizeReviewer = (reviewer: BackendReviewer | null): ApplicationReviewer | null => {
  if (!reviewer) {
    return null;
  }

  return {
    id: reviewer.id,
    name: reviewer.name,
    email: reviewer.email,
  };
};

const normalizeCreatorApplication = (application: BackendCreatorApplication): CreatorApplication => ({
  id: application.id,
  userId: application.userId,
  userName: application.userName || 'Unknown applicant',
  userEmail: application.userEmail,
  userUsername: application.userUsername || '',
  status: application.status,
  submittedAt: application.submittedAt,
  reviewedAt: application.reviewedAt,
  reviewedBy: application.reviewedBy,
});

const normalizeApplicationDetail = (application: BackendApplicationDetail): ApplicationDetail => ({
  id: application.id,
  userId: application.userId,
  status: application.status,
  submittedAt: application.submittedAt,
  reviewedAt: application.reviewedAt,
  reviewedBy: application.reviewedBy,
  reviewedByAdmin: normalizeReviewer(application.reviewedByAdmin),
  rejectionReason: application.rejectionReason,
  createdAt: application.createdAt,
  updatedAt: application.updatedAt,
  user: {
    id: application.user.id,
    name: application.user.name,
    email: application.user.email,
    username: application.user.username,
    isSuspended: Boolean(application.user.isSuspended),
    suspendedReason: application.user.suspendedReason,
    suspendedAt: application.user.suspendedAt,
    suspensionExpiresAt: application.user.suspensionExpiresAt,
  },
  identity: application.identity
    ? {
        idType: application.identity.idType,
        idDocumentUrl: application.identity.idDocumentUrl,
        selfiePhotoUrl: application.identity.selfiePhotoUrl,
        isVerified: Boolean(application.identity.isVerified),
        verifiedAt: application.identity.verifiedAt,
        verifiedBy: application.identity.verifiedBy,
        verifiedByAdmin: normalizeReviewer(application.identity.verifiedByAdmin),
      }
    : null,
  financial: application.financial
    ? {
        accountHolderName: application.financial.accountHolderName,
        accountNumber: application.financial.accountNumber,
        ifscCode: application.financial.ifscCode,
        panNumber: application.financial.panNumber,
        isVerified: Boolean(application.financial.isVerified),
        verifiedAt: application.financial.verifiedAt,
        verifiedBy: application.financial.verifiedBy,
        verifiedByAdmin: normalizeReviewer(application.financial.verifiedByAdmin),
      }
    : null,
  profile: application.profile
    ? {
        profilePictureUrl: application.profile.profilePictureUrl,
        bio: application.profile.bio,
        categories: application.profile.categories || [],
      }
    : null,
});

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

export interface AddApplicationNoteData {
  note: string;
}

export interface SendApplicationEmailData {
  subject: string;
  message: string;
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
    const response = await adminClient.get<PaginatedResponse<BackendCreatorApplication>>(
      '/api/admin/streamers/applications',
      { params }
    );

    return {
      ...response.data,
      data: (response.data.data || []).map(normalizeCreatorApplication),
    };
  },

  getApplicationById: async (id: string): Promise<ApplicationDetail> => {
    const response = await adminClient.get<BackendApplicationDetail>(
      `/api/admin/streamers/applications/${id}`
    );
    return normalizeApplicationDetail(response.data);
  },

  approveApplication: async (id: string): Promise<void> => {
    await adminClient.patch(`/api/admin/streamers/applications/${id}/approve`);
  },

  rejectApplication: async (id: string, data: RejectApplicationData): Promise<void> => {
    await adminClient.patch(`/api/admin/streamers/applications/${id}/reject`, data);
  },

  addApplicationNote: async (id: string, data: AddApplicationNoteData): Promise<void> => {
    await adminClient.post(`/api/admin/streamers/applications/${id}/notes`, data);
  },

  sendApplicationEmail: async (id: string, data: SendApplicationEmailData): Promise<void> => {
    await adminClient.post(`/api/admin/streamers/applications/${id}/send-email`, data);
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
