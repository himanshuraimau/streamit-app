import { adminClient } from './client';

export interface ReportListParams {
  page?: number;
  pageSize?: number;
  reasonCategory?: string;
  status?: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  reporterId?: string;
  reportedUserId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'priority' | 'reportCount';
  sortOrder?: 'asc' | 'desc';
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterUsername: string;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserUsername: string;
  contentId?: string;
  contentType?: string;
  reasonCategory: string;
  description: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  priority: 'low' | 'medium' | 'high';
  reportCount: number;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionAction?: string;
  resolutionNotes?: string;
}

export interface ReportDetail extends Report {
  reporterHistory: Array<{
    id: string;
    reasonCategory: string;
    status: string;
    createdAt: string;
  }>;
  reportedUserHistory: Array<{
    id: string;
    reasonCategory: string;
    status: string;
    createdAt: string;
  }>;
  contentPreview?: {
    type: string;
    content?: string;
    mediaUrls?: string[];
  };
}

export interface ResolveReportData {
  action: 'dismiss' | 'warning_sent' | 'content_removed' | 'user_suspended' | 'user_banned';
  notes: string;
}

export interface AuditLogParams {
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
}

export const reportsApi = {
  list: async (params: ReportListParams) => {
    const response = await adminClient.get('/admin/reports', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ReportDetail> => {
    const response = await adminClient.get(`/admin/reports/${id}`);
    return response.data;
  },

  resolve: async (id: string, data: ResolveReportData) => {
    const response = await adminClient.patch(`/admin/reports/${id}/resolve`, data);
    return response.data;
  },

  getAuditLog: async (params: AuditLogParams) => {
    const response = await adminClient.get('/admin/reports/audit-log', { params });
    return response.data;
  },
};
