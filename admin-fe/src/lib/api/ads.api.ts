import { adminClient } from './client';

export interface ListAdsParams {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive';
  targetRegion?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdCreative {
  id: string;
  title: string;
  mediaUrl: string;
  targetRegion: string[];
  targetGender?: string;
  category?: string;
  cpm: number;
  frequencyCap: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdData {
  title: string;
  mediaUrl: string;
  targetRegion: string[];
  targetGender?: string;
  category?: string;
  cpm: number;
  frequencyCap: number;
  isActive: boolean;
}

export interface UpdateAdData extends Partial<CreateAdData> {}

export interface AdPerformance {
  impressions: number;
  clicks: number;
  ctr: number;
  totalSpend: number;
  averageCpm: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PresignedUrlResponse {
  url: string;
  key: string;
}

export const adsApi = {
  list: async (params: ListAdsParams): Promise<PaginatedResponse<AdCreative>> => {
    const response = await adminClient.get('/api/admin/ads', { params });
    return response.data;
  },

  create: async (data: CreateAdData): Promise<AdCreative> => {
    const response = await adminClient.post('/api/admin/ads', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAdData): Promise<AdCreative> => {
    const response = await adminClient.patch(`/api/admin/ads/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await adminClient.delete(`/api/admin/ads/${id}`);
  },

  getPerformance: async (id: string): Promise<AdPerformance> => {
    const response = await adminClient.get(`/api/admin/ads/${id}/performance`);
    return response.data;
  },

  getPresignedUrl: async (): Promise<PresignedUrlResponse> => {
    const response = await adminClient.get('/api/admin/ads/upload/presigned-url');
    return response.data;
  },
};
