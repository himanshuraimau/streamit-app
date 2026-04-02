import { adminClient } from './client';

export interface PaginationData {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<TData, TSummary> {
  data: TData[];
  pagination: PaginationData;
  summary: TSummary;
}

export interface LedgerParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  amountMin?: number;
  amountMax?: number;
  paymentGateway?: string;
}

export interface WithdrawalParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  status?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface GiftParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface DiscountCodeParams extends Record<string, unknown> {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'MAXED_OUT';
}

export interface DiscountCodeSummary {
  id: string;
  code: string;
  codeType: string;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  packageId: string;
  packageName: string;
  coins: number;
  bonusCoins: number;
  discountBonusCoins: number;
  totalCoins: number;
  amount: number;
  currency: string;
  paymentGateway: string;
  transactionId: string | null;
  orderId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  failureReason: string | null;
  discountCode: DiscountCodeSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerSummary {
  totalRecords: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  totalAmount: number;
  totalCoins: number;
  totalBonusCoins: number;
  totalDiscountBonusCoins: number;
  currency: string;
}

export interface WithdrawalEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amountCoins: number;
  coinToPaiseRate: number;
  grossAmountPaise: number;
  platformFeePaise: number;
  netAmountPaise: number;
  status: 'PENDING' | 'UNDER_REVIEW' | 'ON_HOLD' | 'APPROVED' | 'REJECTED' | 'PAID';
  reason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewerName: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  paidAt: string | null;
  payoutReference: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalSummary {
  totalRecords: number;
  pendingCount: number;
  underReviewCount: number;
  onHoldCount: number;
  approvedCount: number;
  rejectedCount: number;
  paidCount: number;
  totalCoins: number;
  totalGrossAmountPaise: number;
  totalNetAmountPaise: number;
  totalPlatformFeePaise: number;
}

export interface GiftEntry {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  giftId: string;
  giftName: string;
  coinAmount: number;
  quantity: number;
  streamId: string | null;
  streamTitle: string | null;
  message: string | null;
  createdAt: string;
}

export interface GiftSummary {
  totalRecords: number;
  totalCoins: number;
  totalQuantity: number;
  uniqueSenders: number;
  uniqueReceivers: number;
}

export interface WalletDetails {
  userId: string;
  userName: string;
  userEmail: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  recentTransactions: Array<{
    id: string;
    type: 'purchase' | 'gift_sent' | 'gift_received' | 'withdrawal';
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

export interface MonetizationOverview {
  metrics: {
    completedPurchasesCount: number;
    totalRevenueAmount: number;
    revenueCurrency: string;
    openWithdrawalCount: number;
    openWithdrawalCoins: number;
    openWithdrawalNetPaise: number;
    giftsLast30DaysCount: number;
    giftsLast30DaysCoins: number;
    activePromotionalCodesCount: number;
    redeemedPromotionalCodesCount: number;
  };
  recentPurchases: Array<{
    id: string;
    userId: string;
    userName: string;
    packageName: string;
    totalCoins: number;
    amount: number;
    currency: string;
    status: LedgerEntry['status'];
    createdAt: string;
  }>;
  pendingWithdrawals: Array<{
    id: string;
    userId: string;
    userName: string;
    amountCoins: number;
    netAmountPaise: number;
    status: WithdrawalEntry['status'];
    requestedAt: string;
  }>;
  recentGifts: Array<{
    id: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    giftName: string;
    coinAmount: number;
    quantity: number;
    streamTitle: string | null;
    createdAt: string;
  }>;
  activeDiscountCodes: Array<{
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    currentRedemptions: number;
    maxRedemptions: number | null;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
  }>;
}

export interface DiscountCode {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  codeType: 'PROMOTIONAL';
  maxRedemptions: number | null;
  currentRedemptions: number;
  isOneTimeUse: boolean;
  minPurchaseAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  description: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  derivedStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'MAXED_OUT';
  usagePercentage: number | null;
  hasPurchaseReferences: boolean;
}

export interface DiscountCodesSummary {
  totalRecords: number;
  activeCount: number;
  inactiveCount: number;
  expiredCount: number;
  maxedOutCount: number;
  totalRedemptions: number;
}

export interface CreateDiscountCodeData {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxRedemptions?: number | null;
  isOneTimeUse?: boolean;
  minPurchaseAmount?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
  description?: string;
}

export interface UpdateDiscountCodeData extends Partial<CreateDiscountCodeData> {}

export interface DeleteDiscountCodeResult {
  mode: 'deleted' | 'archived';
  data: DiscountCode;
}

export interface RejectWithdrawalData {
  reason: string;
}

export const monetizationApi = {
  getOverview: async (): Promise<MonetizationOverview> => {
    const response = await adminClient.get('/api/admin/monetization/overview');
    return response.data;
  },

  getLedger: async (
    params: LedgerParams
  ): Promise<PaginatedResponse<LedgerEntry, LedgerSummary>> => {
    const response = await adminClient.get('/api/admin/monetization/ledger', { params });
    return response.data;
  },

  getWithdrawals: async (
    params: WithdrawalParams
  ): Promise<PaginatedResponse<WithdrawalEntry, WithdrawalSummary>> => {
    const response = await adminClient.get('/api/admin/monetization/withdrawals', { params });
    return response.data;
  },

  approveWithdrawal: async (id: string): Promise<WithdrawalEntry> => {
    const response = await adminClient.patch(`/api/admin/monetization/withdrawals/${id}/approve`);
    return response.data.data;
  },

  rejectWithdrawal: async (id: string, data: RejectWithdrawalData): Promise<WithdrawalEntry> => {
    const response = await adminClient.patch(`/api/admin/monetization/withdrawals/${id}/reject`, data);
    return response.data.data;
  },

  getGifts: async (
    params: GiftParams
  ): Promise<PaginatedResponse<GiftEntry, GiftSummary>> => {
    const response = await adminClient.get('/api/admin/monetization/gifts', { params });
    return response.data;
  },

  getWalletDetails: async (userId: string): Promise<WalletDetails> => {
    const response = await adminClient.get(`/api/admin/monetization/wallets/${userId}`);
    return response.data;
  },

  getDiscountCodes: async (
    params: DiscountCodeParams
  ): Promise<PaginatedResponse<DiscountCode, DiscountCodesSummary>> => {
    const response = await adminClient.get('/api/admin/monetization/discount-codes', { params });
    return response.data;
  },

  getDiscountCodeById: async (id: string): Promise<DiscountCode> => {
    const response = await adminClient.get(`/api/admin/monetization/discount-codes/${id}`);
    return response.data;
  },

  createDiscountCode: async (data: CreateDiscountCodeData): Promise<DiscountCode> => {
    const response = await adminClient.post('/api/admin/monetization/discount-codes', data);
    return response.data.data;
  },

  updateDiscountCode: async (id: string, data: UpdateDiscountCodeData): Promise<DiscountCode> => {
    const response = await adminClient.patch(`/api/admin/monetization/discount-codes/${id}`, data);
    return response.data.data;
  },

  deleteDiscountCode: async (id: string): Promise<DeleteDiscountCodeResult> => {
    const response = await adminClient.delete(`/api/admin/monetization/discount-codes/${id}`);
    return response.data.data;
  },
};
