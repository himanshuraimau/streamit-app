import { prisma } from '../../lib/db';
import type { Prisma, PurchaseStatus, WithdrawalStatus } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import type { PaginatedResponse } from './audit-log.service';

/**
 * Filters for coin ledger queries
 */
export interface LedgerFilters {
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: PurchaseStatus;
  amountMin?: number;
  amountMax?: number;
  paymentGateway?: string;
}

/**
 * Filters for withdrawal queries
 */
export interface WithdrawalFilters {
  status?: WithdrawalStatus;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

/**
 * Filters for gift transaction queries
 */
export interface GiftFilters {
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Coin ledger entry with user details
 */
export interface LedgerEntry {
  id: string;
  userId: string;
  userName: string;
  packageId: string;
  packageName: string;
  coins: number;
  bonusCoins: number;
  totalCoins: number;
  amount: number;
  currency: string;
  paymentGateway: string | null;
  transactionId: string | null;
  status: PurchaseStatus;
  createdAt: Date;
}

/**
 * Withdrawal request with user details
 */
export interface WithdrawalEntry {
  id: string;
  userId: string;
  userName: string;
  amountCoins: number;
  coinToPaiseRate: number;
  grossAmountPaise: number;
  platformFeePaise: number;
  netAmountPaise: number;
  status: WithdrawalStatus;
  reason: string | null;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewerName: string | null;
}

/**
 * Gift transaction with sender and receiver details
 */
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
  message: string | null;
  createdAt: Date;
}

/**
 * Wallet details with transaction history
 */
export interface WalletDetails {
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  recentTransactions: Array<{
    id: string;
    type: 'purchase' | 'gift_sent' | 'gift_received' | 'withdrawal';
    amount: number;
    description: string;
    createdAt: Date;
  }>;
}

/**
 * Service for managing monetization and wallet operations
 * Handles coin ledger, withdrawals, gifts, and wallet management
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 29.1, 29.2
 */
export class MonetizationService {
  /**
   * Get coin purchase ledger with filtering and pagination
   *
   * @param filters - Filter criteria for ledger
   * @param pagination - Pagination parameters
   * @returns Paginated list of coin purchases
   *
   * Requirements: 8.1, 8.2, 8.3, 8.4
   */
  static async getCoinLedger(
    filters: LedgerFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<LedgerEntry>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.CoinPurchaseWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentGateway) {
      where.paymentGateway = filters.paymentGateway;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters.amountMin || filters.amountMax) {
      where.amount = {};
      if (filters.amountMin) {
        where.amount.gte = filters.amountMin;
      }
      if (filters.amountMax) {
        where.amount.lte = filters.amountMax;
      }
    }

    // Execute query with pagination
    const [purchases, totalCount] = await Promise.all([
      prisma.coinPurchase.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.coinPurchase.count({ where }),
    ]);

    // Transform results
    const data: LedgerEntry[] = purchases.map((purchase) => ({
      id: purchase.id,
      userId: purchase.userId,
      userName: purchase.user.name,
      packageId: purchase.packageId,
      packageName: purchase.package.name,
      coins: purchase.coins,
      bonusCoins: purchase.bonusCoins,
      totalCoins: purchase.totalCoins,
      amount: purchase.amount,
      currency: purchase.currency,
      paymentGateway: purchase.paymentGateway,
      transactionId: purchase.transactionId,
      status: purchase.status,
      createdAt: purchase.createdAt,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Get withdrawal requests with filtering and pagination
   *
   * @param filters - Filter criteria for withdrawals
   * @param pagination - Pagination parameters
   * @returns Paginated list of withdrawal requests
   *
   * Requirements: 8.5, 8.6, 8.7
   */
  static async getWithdrawals(
    filters: WithdrawalFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<WithdrawalEntry>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.CreatorWithdrawalRequestWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.requestedAt = {};
      if (filters.dateFrom) {
        where.requestedAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.requestedAt.lte = filters.dateTo;
      }
    }

    if (filters.amountMin || filters.amountMax) {
      where.amountCoins = {};
      if (filters.amountMin) {
        where.amountCoins.gte = filters.amountMin;
      }
      if (filters.amountMax) {
        where.amountCoins.lte = filters.amountMax;
      }
    }

    // Execute query with pagination
    const [withdrawals, totalCount] = await Promise.all([
      prisma.creatorWithdrawalRequest.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          requestedAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.creatorWithdrawalRequest.count({ where }),
    ]);

    // Transform results
    const data: WithdrawalEntry[] = withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      userId: withdrawal.userId,
      userName: withdrawal.user.name,
      amountCoins: withdrawal.amountCoins,
      coinToPaiseRate: withdrawal.coinToPaiseRate,
      grossAmountPaise: withdrawal.grossAmountPaise,
      platformFeePaise: withdrawal.platformFeePaise,
      netAmountPaise: withdrawal.netAmountPaise,
      status: withdrawal.status,
      reason: withdrawal.reason,
      requestedAt: withdrawal.requestedAt,
      reviewedAt: withdrawal.reviewedAt,
      reviewedBy: withdrawal.reviewedBy,
      reviewerName: withdrawal.reviewer?.name || null,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Approve a withdrawal request with transaction atomicity
   * Updates withdrawal status, deducts coins from wallet, creates audit log
   * All operations are atomic - either all succeed or all fail
   *
   * @param id - Withdrawal request ID
   * @param adminId - ID of admin approving the withdrawal
   * @returns Updated withdrawal request
   *
   * Requirements: 8.8, 29.2, 29.11, 29.12, 29.15
   */
  static async approveWithdrawal(id: string, adminId: string) {
    // Use Prisma transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      // 1. Get withdrawal request
      const withdrawal = await tx.creatorWithdrawalRequest.findUnique({
        where: { id },
        include: {
          user: {
            include: {
              coinWallet: true,
            },
          },
        },
      });

      if (!withdrawal) {
        throw new Error('Withdrawal request not found');
      }

      if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'UNDER_REVIEW') {
        throw new Error(`Cannot approve withdrawal with status: ${withdrawal.status}`);
      }

      if (!withdrawal.user.coinWallet) {
        throw new Error('User does not have a coin wallet');
      }

      // Check if user has sufficient balance
      if (withdrawal.user.coinWallet.balance < withdrawal.amountCoins) {
        throw new Error('Insufficient wallet balance for withdrawal');
      }

      // 2. Update withdrawal status to APPROVED
      const updatedWithdrawal = await tx.creatorWithdrawalRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          approvedAt: new Date(),
        },
      });

      // 3. Deduct coins from creator wallet
      await tx.coinWallet.update({
        where: { userId: withdrawal.userId },
        data: {
          balance: {
            decrement: withdrawal.amountCoins,
          },
        },
      });

      // 4. Create audit log entry
      await AuditLogService.createLog(adminId, 'withdrawal_approve', 'withdrawal', id, {
        userId: withdrawal.userId,
        amountCoins: withdrawal.amountCoins,
        netAmountPaise: withdrawal.netAmountPaise,
      });

      return updatedWithdrawal;
    });
  }

  /**
   * Reject a withdrawal request
   *
   * @param id - Withdrawal request ID
   * @param reason - Reason for rejection
   * @param adminId - ID of admin rejecting the withdrawal
   * @returns Updated withdrawal request
   *
   * Requirements: 8.9
   */
  static async rejectWithdrawal(id: string, reason: string, adminId: string) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Update withdrawal status to REJECTED
      const updatedWithdrawal = await tx.creatorWithdrawalRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reason,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectedAt: new Date(),
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'withdrawal_reject', 'withdrawal', id, {
        userId: updatedWithdrawal.userId,
        reason,
      });

      return updatedWithdrawal;
    });
  }

  /**
   * Get gift transactions with filtering and pagination
   *
   * @param filters - Filter criteria for gifts
   * @param pagination - Pagination parameters
   * @returns Paginated list of gift transactions
   *
   * Requirements: 8.10, 8.11
   */
  static async getGiftTransactions(
    filters: GiftFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<GiftEntry>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.GiftTransactionWhereInput = {};

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters.amountMin || filters.amountMax) {
      where.coinAmount = {};
      if (filters.amountMin) {
        where.coinAmount.gte = filters.amountMin;
      }
      if (filters.amountMax) {
        where.coinAmount.lte = filters.amountMax;
      }
    }

    // Execute query with pagination
    const [gifts, totalCount] = await Promise.all([
      prisma.giftTransaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
            },
          },
          gift: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.giftTransaction.count({ where }),
    ]);

    // Transform results
    const data: GiftEntry[] = gifts.map((gift) => ({
      id: gift.id,
      senderId: gift.senderId,
      senderName: gift.sender.name,
      receiverId: gift.receiverId,
      receiverName: gift.receiver.name,
      giftId: gift.giftId,
      giftName: gift.gift.name,
      coinAmount: gift.coinAmount,
      quantity: gift.quantity,
      streamId: gift.streamId,
      message: gift.message,
      createdAt: gift.createdAt,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Get wallet details for a specific user
   *
   * @param userId - User ID
   * @returns Wallet details with recent transactions
   *
   * Requirements: 8.12
   */
  static async getWalletDetails(userId: string): Promise<WalletDetails | null> {
    // Get wallet
    const wallet = await prisma.coinWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return null;
    }

    // Get recent transactions (last 20)
    const [purchases, giftsSent, giftsReceived, withdrawals] = await Promise.all([
      prisma.coinPurchase.findMany({
        where: { userId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          totalCoins: true,
          createdAt: true,
          package: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.giftTransaction.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          coinAmount: true,
          createdAt: true,
          receiver: {
            select: {
              name: true,
            },
          },
          gift: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.giftTransaction.findMany({
        where: { receiverId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          coinAmount: true,
          createdAt: true,
          sender: {
            select: {
              name: true,
            },
          },
          gift: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.creatorWithdrawalRequest.findMany({
        where: { userId, status: 'APPROVED' },
        orderBy: { approvedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amountCoins: true,
          approvedAt: true,
        },
      }),
    ]);

    // Combine and sort all transactions
    const recentTransactions = [
      ...purchases.map((p) => ({
        id: p.id,
        type: 'purchase' as const,
        amount: p.totalCoins,
        description: `Purchased ${p.package.name}`,
        createdAt: p.createdAt,
      })),
      ...giftsSent.map((g) => ({
        id: g.id,
        type: 'gift_sent' as const,
        amount: -g.coinAmount,
        description: `Sent ${g.gift.name} to ${g.receiver.name}`,
        createdAt: g.createdAt,
      })),
      ...giftsReceived.map((g) => ({
        id: g.id,
        type: 'gift_received' as const,
        amount: g.coinAmount,
        description: `Received ${g.gift.name} from ${g.sender.name}`,
        createdAt: g.createdAt,
      })),
      ...withdrawals.map((w) => ({
        id: w.id,
        type: 'withdrawal' as const,
        amount: -w.amountCoins,
        description: `Withdrawal approved`,
        createdAt: w.approvedAt!,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);

    return {
      userId: wallet.userId,
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
      recentTransactions,
    };
  }
}
