// Enums
export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
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
