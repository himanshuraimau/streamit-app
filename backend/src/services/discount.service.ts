import { prisma } from '../lib/db';
import type { DiscountCode, CoinPackage, DiscountType, CodeType } from '@prisma/client';

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

export interface ValidationResult {
  success: boolean;
  data?: {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    packagePrice: number;
    baseCoins: number;
    bonusCoins: number;
    totalCoins: number;
    expiresAt: Date | null;
  };
  error?: string;
  errorCode?: DiscountErrorCode;
}

export interface DiscountCodeWithStatus extends DiscountCode {
  isExpired: boolean;
  isUsedByUser: boolean;
  isMaxedOut: boolean;
}

export class DiscountService {
  /**
   * Calculate bonus coins based on discount type and value
   * For PERCENTAGE: bonusCoins = floor(baseCoins * discountValue / 100)
   * For FIXED: bonusCoins = floor(discountValue / pricePerCoin)
   * 
   * Requirements: 1.2, 3.3
   */
  static calculateBonusCoins(
    discountCode: Pick<DiscountCode, 'discountType' | 'discountValue'>,
    coinPackage: Pick<CoinPackage, 'coins' | 'price'>
  ): number {
    if (discountCode.discountType === 'PERCENTAGE') {
      // Percentage discount: bonus = floor(baseCoins * percentage / 100)
      return Math.floor(coinPackage.coins * discountCode.discountValue / 100);
    } else {
      // Fixed discount: bonus = floor(discountValue / pricePerCoin)
      // discountValue is in paise, price is in paise, coins is count
      // pricePerCoin = price / coins (paise per coin)
      const pricePerCoin = coinPackage.price / coinPackage.coins;
      return Math.floor(discountCode.discountValue / pricePerCoin);
    }
  }


  /**
   * Validate a discount code for a specific package and user
   * Checks: existence, active status, expiration, user usage, redemption limits, min purchase
   * 
   * Requirements: 1.1, 1.3, 1.5, 5.1, 5.2, 5.3
   */
  static async validateCode(
    code: string,
    packageId: string,
    userId: string
  ): Promise<ValidationResult> {
    // Find the discount code
    const discountCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    // Check code exists
    if (!discountCode) {
      return {
        success: false,
        error: 'Discount code not found',
        errorCode: DiscountErrorCodes.INVALID_CODE,
      };
    }

    // Check code is active
    if (!discountCode.isActive) {
      return {
        success: false,
        error: 'This code is no longer active',
        errorCode: DiscountErrorCodes.INACTIVE_CODE,
      };
    }

    // Check expiration date
    if (discountCode.expiresAt && discountCode.expiresAt < new Date()) {
      return {
        success: false,
        error: 'This code has expired',
        errorCode: DiscountErrorCodes.EXPIRED_CODE,
      };
    }

    // Check if user has already used this code (for one-time use codes)
    if (discountCode.isOneTimeUse) {
      const existingRedemption = await prisma.discountRedemption.findFirst({
        where: {
          discountCodeId: discountCode.id,
          userId: userId,
        },
      });

      if (existingRedemption) {
        return {
          success: false,
          error: 'You have already used this code',
          errorCode: DiscountErrorCodes.ALREADY_USED,
        };
      }
    }

    // Check redemption limits
    if (
      discountCode.maxRedemptions !== null &&
      discountCode.currentRedemptions >= discountCode.maxRedemptions
    ) {
      return {
        success: false,
        error: 'This code has reached its usage limit',
        errorCode: DiscountErrorCodes.MAX_REDEMPTIONS,
      };
    }

    // Get the package to check minimum purchase and calculate bonus
    const coinPackage = await prisma.coinPackage.findUnique({
      where: { id: packageId, isActive: true },
    });

    if (!coinPackage) {
      return {
        success: false,
        error: 'Package not found or inactive',
        errorCode: DiscountErrorCodes.INVALID_CODE,
      };
    }

    // Check minimum purchase amount
    if (
      discountCode.minPurchaseAmount !== null &&
      coinPackage.price < discountCode.minPurchaseAmount
    ) {
      const minAmountRupees = discountCode.minPurchaseAmount / 100;
      return {
        success: false,
        error: `Minimum purchase of ₹${minAmountRupees} required`,
        errorCode: DiscountErrorCodes.MIN_PURCHASE,
      };
    }

    // Calculate bonus coins
    const bonusCoins = this.calculateBonusCoins(discountCode, coinPackage);
    const totalCoins = coinPackage.coins + coinPackage.bonusCoins + bonusCoins;

    return {
      success: true,
      data: {
        code: discountCode.code,
        discountType: discountCode.discountType,
        discountValue: discountCode.discountValue,
        packagePrice: coinPackage.price,
        baseCoins: coinPackage.coins + coinPackage.bonusCoins,
        bonusCoins,
        totalCoins,
        expiresAt: discountCode.expiresAt,
      },
    };
  }


  /**
   * Apply a discount code to a purchase
   * Creates DiscountRedemption record and increments currentRedemptions
   * 
   * Requirements: 6.1, 6.2
   */
  static async applyDiscount(
    discountCodeId: string,
    purchaseId: string,
    userId: string,
    bonusCoinsAwarded: number
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Create redemption record
      await tx.discountRedemption.create({
        data: {
          discountCodeId,
          purchaseId,
          userId,
          bonusCoinsAwarded,
        },
      });

      // Increment currentRedemptions on the discount code
      await tx.discountCode.update({
        where: { id: discountCodeId },
        data: {
          currentRedemptions: { increment: 1 },
        },
      });
    });

    console.log(`✅ Discount applied: code ${discountCodeId} for purchase ${purchaseId}`);
  }

  /**
   * Generate a reward code for a user after successful purchase
   * Creates a new DiscountCode with codeType REWARD
   * 
   * Requirements: 2.1, 2.2
   */
  static async generateRewardCode(
    userId: string,
    purchaseAmount: number
  ): Promise<DiscountCode> {
    // Generate unique code string
    const codeString = this.generateUniqueCodeString();

    // Calculate discount value based on purchase amount
    // Give 5% of purchase amount as reward (in paise)
    const discountValue = Math.floor(purchaseAmount * 0.05);

    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const rewardCode = await prisma.discountCode.create({
      data: {
        code: codeString,
        discountType: 'FIXED',
        discountValue,
        codeType: 'REWARD',
        ownerId: userId,
        isOneTimeUse: true,
        expiresAt,
        isActive: true,
        description: `Reward code - ${discountValue / 100} rupees worth of bonus coins`,
      },
    });

    console.log(`🎁 Reward code generated: ${codeString} for user ${userId}`);

    return rewardCode;
  }

  /**
   * Generate a unique code string for reward codes
   * Format: REWARD-XXXXXX (6 alphanumeric characters)
   */
  private static generateUniqueCodeString(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REWARD-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }


  /**
   * Get all discount codes owned by a user
   * Includes usage status and expiration info
   * 
   * Requirements: 4.1, 4.2
   */
  static async getUserCodes(userId: string): Promise<DiscountCodeWithStatus[]> {
    const codes = await prisma.discountCode.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });

    // Get user's redemptions to check which codes they've used
    const userRedemptions = await prisma.discountRedemption.findMany({
      where: { userId },
      select: { discountCodeId: true },
    });

    const usedCodeIds = new Set(userRedemptions.map((r) => r.discountCodeId));

    // Add status info to each code
    return codes.map((code) => ({
      ...code,
      isExpired: code.expiresAt !== null && code.expiresAt < new Date(),
      isUsedByUser: usedCodeIds.has(code.id),
      isMaxedOut:
        code.maxRedemptions !== null &&
        code.currentRedemptions >= code.maxRedemptions,
    }));
  }

  /**
   * Get a discount code by its code string
   */
  static async getCodeByString(code: string): Promise<DiscountCode | null> {
    return prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  /**
   * Get the latest reward code generated for a user
   * Used to display the reward code on the purchase success page
   * 
   * Requirements: 2.1, 2.3
   */
  static async getLatestRewardCode(userId: string): Promise<DiscountCode | null> {
    return prisma.discountCode.findFirst({
      where: {
        ownerId: userId,
        codeType: 'REWARD',
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
