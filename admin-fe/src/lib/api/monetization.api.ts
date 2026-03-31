import { apiClient } from './client';

export interface LedgerParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentGateway?: string;
}

export interface WithdrawalParams {
  page?: number;
  pageSize?: number;
  status?: string;
  creatorId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface GiftParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface RejectWithdrawalData {
  reason: string;
}

export const monetizationApi = {
  getLedger: (params: LedgerParams) => {
    return apiClient.get('/admin/monetization/ledger', { params });
  },

  getWithdrawals: (params: WithdrawalParams) => {
    return apiClient.get('/admin/monetization/withdrawals', { params });
  },

  approveWithdrawal: (id: string) => {
    return apiClient.patch(`/admin/monetization/withdrawals/${id}/approve`);
  },

  rejectWithdrawal: (id: string, data: RejectWithdrawalData) => {
    return apiClient.patch(`/admin/monetization/withdrawals/${id}/reject`, data);
  },

  getGifts: (params: GiftParams) => {
    return apiClient.get('/admin/monetization/gifts', { params });
  },

  getWalletDetails: (userId: string) => {
    return apiClient.get(`/admin/monetization/wallets/${userId}`);
  },
};
