import { adminClient } from './client';

export interface LedgerParams extends Record<string, unknown> {
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

export interface WithdrawalParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  status?: string;
  creatorId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface GiftParams extends Record<string, unknown> {
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
    return adminClient.get('/admin/monetization/ledger', { params });
  },

  getWithdrawals: (params: WithdrawalParams) => {
    return adminClient.get('/admin/monetization/withdrawals', { params });
  },

  approveWithdrawal: (id: string) => {
    return adminClient.patch(`/admin/monetization/withdrawals/${id}/approve`);
  },

  rejectWithdrawal: (id: string, data: RejectWithdrawalData) => {
    return adminClient.patch(`/admin/monetization/withdrawals/${id}/reject`, data);
  },

  getGifts: (params: GiftParams) => {
    return adminClient.get('/admin/monetization/gifts', { params });
  },

  getWalletDetails: (userId: string) => {
    return adminClient.get(`/admin/monetization/wallets/${userId}`);
  },
};
