import { adminClient } from './client';
import type { PaginatedResponse } from './users.api';

export interface AuditLogParams {
  page?: number;
  pageSize?: number;
  adminId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  dateFrom?: string;
  dateTo?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface GeoBlockData {
  region: string;
  contentId?: string;
  reason?: string;
}

export interface Takedown {
  id: string;
  contentType: string;
  contentId: string;
  authorName: string;
  hiddenReason: string;
  hiddenAt: string;
  hiddenBy: string;
}

export const complianceApi = {
  getAuditLog: async (params: AuditLogParams): Promise<PaginatedResponse<AuditLogEntry>> => {
    const requestParams = {
      ...params,
      dateFrom: params.dateFrom || params.startDate,
      dateTo: params.dateTo || params.endDate,
    };

    const response = await adminClient.get('/api/admin/compliance/audit-log', {
      params: requestParams,
    });
    return response.data;
  },

  createGeoBlock: async (data: GeoBlockData): Promise<void> => {
    await adminClient.post('/api/admin/compliance/geo-block', data);
  },

  exportUserData: async (userId: string): Promise<Blob> => {
    const response = await adminClient.get(`/api/admin/compliance/export`, {
      params: { userId },
      responseType: 'blob',
    });
    return response.data;
  },

  getTakedowns: async (params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<Takedown>> => {
    const response = await adminClient.get('/api/admin/compliance/takedowns', { params });
    return response.data;
  },
};
