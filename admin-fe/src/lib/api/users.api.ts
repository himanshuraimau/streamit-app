import { adminClient } from './client';

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  isSuspended?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  isSuspended: boolean;
  suspendedReason?: string;
  suspensionExpiresAt?: string;
  createdAt: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
}

export interface UserDetail extends User {
  bio?: string;
  adminNotes?: string;
  wallet?: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  };
  banHistory?: Array<{
    reason: string;
    bannedAt: string;
    bannedBy: string;
  }>;
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

export interface FreezeUserData {
  reason: string;
  expiresAt?: string;
}

export interface BanUserData {
  reason: string;
}

export const usersApi = {
  list: async (params: ListUsersParams): Promise<PaginatedResponse<User>> => {
    const response = await adminClient.get('/api/admin/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<UserDetail> => {
    const response = await adminClient.get(`/api/admin/users/${id}`);
    return response.data;
  },

  freeze: async (id: string, data: FreezeUserData): Promise<void> => {
    await adminClient.patch(`/api/admin/users/${id}/freeze`, data);
  },

  ban: async (id: string, data: BanUserData): Promise<void> => {
    await adminClient.patch(`/api/admin/users/${id}/ban`, data);
  },

  disableChat: async (id: string): Promise<void> => {
    await adminClient.patch(`/api/admin/users/${id}/chat-disable`);
  },

  resetPassword: async (id: string): Promise<void> => {
    await adminClient.post(`/api/admin/users/${id}/reset-password`);
  },
};
