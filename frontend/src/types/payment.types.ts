// Enums
export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum WithdrawalStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ON_HOLD = 'ON_HOLD',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
  WALLET = 'WALLET',
}

// API Response Types
export interface CoinWallet {
  id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  bonusCoins: number;
  price: number; // in paise
  currency: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoinPurchase {
  id: string;
  userId: string;
  packageId: string;
  coins: number;
  bonusCoins: number;
  totalCoins: number;
  amount: number; // in paise
  currency: string;
  paymentMethod?: PaymentMethod;
  paymentGateway?: string;
  transactionId?: string;
  orderId: string;
  status: PurchaseStatus;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  package: CoinPackage;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  orderId: string;
  sessionId: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Gift Types
export interface Gift {
  id: string;
  name: string;
  description?: string;
  coinPrice: number;
  imageUrl: string;
  animationUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GiftTransaction {
  id: string;
  senderId: string;
  receiverId: string;
  giftId: string;
  coinAmount: number;
  quantity: number;
  streamId?: string;
  message?: string;
  createdAt: string;
  
  // Populated relations
  gift: Gift;
  sender: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  receiver: {
    id: string;
    username: string;
    name: string;
    image?: string;
  };
  stream?: {
    id: string;
    title: string;
  };
}

export interface SendGiftRequest {
  receiverId: string;
  giftId: string;
  streamId?: string;
  message?: string;
}

export interface CreatorWithdrawalRequest {
  id: string;
  userId: string;
  amountCoins: number;
  coinToPaiseRate: number;
  grossAmountPaise: number;
  platformFeePaise: number;
  netAmountPaise: number;
  status: WithdrawalStatus;
  reason?: string;
  requestedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;
  payoutReference?: string;
  reviewer?: {
    id: string;
    username: string;
    name: string;
    email: string;
  };
}

export interface WithdrawalRequestPayload {
  amountCoins: number;
  reason?: string;
}

export interface WithdrawalHistorySummary {
  availableCoins: number;
  pendingCoins: number;
}

export interface PaginatedWithdrawalResponse {
  success: boolean;
  data: CreatorWithdrawalRequest[];
  summary: WithdrawalHistorySummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Helper Functions
export const formatPrice = (priceInPaise: number): string => {
  return `₹${(priceInPaise / 100).toFixed(0)}`;
};

export const formatCoins = (coins: number): string => {
  return coins.toLocaleString('en-IN');
};

export const getPurchaseStatusColor = (status: PurchaseStatus): string => {
  switch (status) {
    case PurchaseStatus.COMPLETED:
      return 'text-green-600 bg-green-100';
    case PurchaseStatus.PENDING:
      return 'text-yellow-600 bg-yellow-100';
    case PurchaseStatus.FAILED:
      return 'text-red-600 bg-red-100';
    case PurchaseStatus.REFUNDED:
      return 'text-blue-600 bg-blue-100';
    case PurchaseStatus.CANCELLED:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getPurchaseStatusText = (status: PurchaseStatus): string => {
  switch (status) {
    case PurchaseStatus.COMPLETED:
      return 'Completed';
    case PurchaseStatus.PENDING:
      return 'Pending';
    case PurchaseStatus.FAILED:
      return 'Failed';
    case PurchaseStatus.REFUNDED:
      return 'Refunded';
    case PurchaseStatus.CANCELLED:
      return 'Cancelled';
  }
};

export const getWithdrawalStatusColor = (status: WithdrawalStatus): string => {
  switch (status) {
    case WithdrawalStatus.PENDING:
      return 'text-amber-300 bg-amber-500/15 border-amber-500/30';
    case WithdrawalStatus.UNDER_REVIEW:
      return 'text-sky-300 bg-sky-500/15 border-sky-500/30';
    case WithdrawalStatus.ON_HOLD:
      return 'text-orange-300 bg-orange-500/15 border-orange-500/30';
    case WithdrawalStatus.APPROVED:
      return 'text-green-300 bg-green-500/15 border-green-500/30';
    case WithdrawalStatus.REJECTED:
      return 'text-red-300 bg-red-500/15 border-red-500/30';
    case WithdrawalStatus.PAID:
      return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
  }
};

export const getWithdrawalStatusText = (status: WithdrawalStatus): string => {
  switch (status) {
    case WithdrawalStatus.PENDING:
      return 'Pending';
    case WithdrawalStatus.UNDER_REVIEW:
      return 'Under Review';
    case WithdrawalStatus.ON_HOLD:
      return 'On Hold';
    case WithdrawalStatus.APPROVED:
      return 'Approved';
    case WithdrawalStatus.REJECTED:
      return 'Rejected';
    case WithdrawalStatus.PAID:
      return 'Paid';
  }
};
