// Discount Code Types for Frontend
// Requirements: 1.1, 4.1

// Enums matching backend Prisma schema
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum CodeType {
  PROMOTIONAL = 'PROMOTIONAL',
  REWARD = 'REWARD',
}

// Discount code model
export interface DiscountCode {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  codeType: CodeType;
  createdBy: string | null;
  ownerId: string | null;
  maxRedemptions: number | null;
  currentRedemptions: number;
  isOneTimeUse: boolean;
  minPurchaseAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// Extended discount code with status info (from getUserCodes)
export interface DiscountCodeWithStatus extends DiscountCode {
  isExpired: boolean;
  isUsedByUser: boolean;
  isMaxedOut: boolean;
}

// Validation result from POST /api/discount/validate
export interface DiscountValidationData {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  packagePrice: number;
  baseCoins: number;
  bonusCoins: number;
  totalCoins: number;
  expiresAt: string | null;
}

export interface DiscountValidationResult {
  success: boolean;
  data?: DiscountValidationData;
  error?: string;
  code?: string; // Error code (INVALID_CODE, EXPIRED_CODE, etc.)
}

// Error codes for discount validation
export const DiscountErrorCodes = {
  INVALID_CODE: 'INVALID_CODE',
  EXPIRED_CODE: 'EXPIRED_CODE',
  ALREADY_USED: 'ALREADY_USED',
  MAX_REDEMPTIONS: 'MAX_REDEMPTIONS',
  MIN_PURCHASE: 'MIN_PURCHASE',
  INACTIVE_CODE: 'INACTIVE_CODE',
} as const;

export type DiscountErrorCode = typeof DiscountErrorCodes[keyof typeof DiscountErrorCodes];

// API Response types
export interface DiscountCodesResponse {
  success: boolean;
  data?: DiscountCodeWithStatus[];
  error?: string;
}

// Helper functions
export const formatDiscountValue = (type: DiscountType, value: number): string => {
  if (type === DiscountType.PERCENTAGE) {
    return `${value}%`;
  }
  // Fixed amount is in paise, convert to rupees
  return `₹${(value / 100).toFixed(0)}`;
};

export const getDiscountStatusText = (code: DiscountCodeWithStatus): string => {
  if (code.isUsedByUser) return 'Used';
  if (code.isExpired) return 'Expired';
  if (code.isMaxedOut) return 'Limit Reached';
  if (!code.isActive) return 'Inactive';
  return 'Available';
};

export const getDiscountStatusColor = (code: DiscountCodeWithStatus): string => {
  if (code.isUsedByUser) return 'text-gray-600 bg-gray-100';
  if (code.isExpired) return 'text-red-600 bg-red-100';
  if (code.isMaxedOut) return 'text-orange-600 bg-orange-100';
  if (!code.isActive) return 'text-gray-600 bg-gray-100';
  return 'text-green-600 bg-green-100';
};

export const isCodeUsable = (code: DiscountCodeWithStatus): boolean => {
  return code.isActive && !code.isExpired && !code.isUsedByUser && !code.isMaxedOut;
};
