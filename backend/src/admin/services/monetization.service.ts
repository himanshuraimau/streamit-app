import { prisma } from '../../lib/db';
import type { Prisma, PurchaseStatus, WithdrawalStatus } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import type { PaginatedResponse } from './audit-log.service';

const DEFAULT_CURRENCY = 'INR';
const OPEN_WITHDRAWAL_STATUSES: WithdrawalStatus[] = ['PENDING', 'UNDER_REVIEW', 'ON_HOLD'];

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

export interface PaginatedSummaryResponse<TData, TSummary> extends PaginatedResponse<TData> {
  summary: TSummary;
}

export interface DiscountCodeSummary {
  id: string;
  code: string;
  codeType: string;
}

/**
 * Coin ledger entry with user details
 */
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
  status: PurchaseStatus;
  failureReason: string | null;
  discountCode: DiscountCodeSummary | null;
  createdAt: Date;
  updatedAt: Date;
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

/**
 * Withdrawal request with user details
 */
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
  status: WithdrawalStatus;
  reason: string | null;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewerName: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  paidAt: Date | null;
  payoutReference: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
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
  streamTitle: string | null;
  message: string | null;
  createdAt: Date;
}

export interface GiftSummary {
  totalRecords: number;
  totalCoins: number;
  totalQuantity: number;
  uniqueSenders: number;
  uniqueReceivers: number;
}

/**
 * Wallet details with transaction history
 */
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
    createdAt: Date;
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
    status: PurchaseStatus;
    createdAt: Date;
  }>;
  pendingWithdrawals: Array<{
    id: string;
    userId: string;
    userName: string;
    amountCoins: number;
    netAmountPaise: number;
    status: WithdrawalStatus;
    requestedAt: Date;
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
    createdAt: Date;
  }>;
  activeDiscountCodes: Array<{
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    currentRedemptions: number;
    maxRedemptions: number | null;
    expiresAt: Date | null;
    isActive: boolean;
    createdAt: Date;
  }>;
}

const getCountByKey = <TKey extends string>(
  groups: Array<{ key: TKey; count: number }>,
  key: TKey
) => groups.find((entry) => entry.key === key)?.count ?? 0;

const buildPagination = (page: number, pageSize: number, totalCount: number) => {
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    currentPage: page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

const toStatusCounts = <TKey extends string>(
  groups: Array<{ status: TKey; _count: { _all: number } }>
) => groups.map((group) => ({ key: group.status, count: group._count._all }));

const asNumber = (value: number | null | undefined) => value ?? 0;

/**
 * Service for managing monetization and wallet operations
 * Handles coin ledger, withdrawals, gifts, discount overview, and wallet management
 */
export class MonetizationService {
  static async getOverview(): Promise<MonetizationOverview> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const [
      completedPurchaseAggregate,
      purchaseCurrencySample,
      recentPurchases,
      openWithdrawalAggregate,
      pendingWithdrawals,
      giftsLast30DaysAggregate,
      recentGifts,
      activePromotionalCodesCount,
      redeemedPromotionalCodesCount,
      activeDiscountCodes,
    ] = await Promise.all([
      prisma.coinPurchase.aggregate({
        where: { status: 'COMPLETED' },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.coinPurchase.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        select: { currency: true },
      }),
      prisma.coinPurchase.findMany({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          userId: true,
          totalCoins: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              name: true,
            },
          },
          package: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.creatorWithdrawalRequest.aggregate({
        where: { status: { in: OPEN_WITHDRAWAL_STATUSES } },
        _count: { _all: true },
        _sum: {
          amountCoins: true,
          netAmountPaise: true,
        },
      }),
      prisma.creatorWithdrawalRequest.findMany({
        where: { status: { in: OPEN_WITHDRAWAL_STATUSES } },
        orderBy: { requestedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          userId: true,
          amountCoins: true,
          netAmountPaise: true,
          status: true,
          requestedAt: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.giftTransaction.aggregate({
        where: { createdAt: { gte: last30Days } },
        _count: { _all: true },
        _sum: { coinAmount: true },
      }),
      prisma.giftTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          coinAmount: true,
          quantity: true,
          createdAt: true,
          gift: {
            select: {
              name: true,
            },
          },
          sender: {
            select: {
              name: true,
            },
          },
          receiver: {
            select: {
              name: true,
            },
          },
          stream: {
            select: {
              title: true,
            },
          },
        },
      }),
      prisma.discountCode.count({
        where: {
          codeType: 'PROMOTIONAL',
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
      }),
      prisma.discountCode.count({
        where: {
          codeType: 'PROMOTIONAL',
          currentRedemptions: { gt: 0 },
        },
      }),
      prisma.discountCode.findMany({
        where: {
          codeType: 'PROMOTIONAL',
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          code: true,
          discountType: true,
          discountValue: true,
          currentRedemptions: true,
          maxRedemptions: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      metrics: {
        completedPurchasesCount: completedPurchaseAggregate._count._all,
        totalRevenueAmount: asNumber(completedPurchaseAggregate._sum.amount),
        revenueCurrency: purchaseCurrencySample?.currency ?? DEFAULT_CURRENCY,
        openWithdrawalCount: openWithdrawalAggregate._count._all,
        openWithdrawalCoins: asNumber(openWithdrawalAggregate._sum.amountCoins),
        openWithdrawalNetPaise: asNumber(openWithdrawalAggregate._sum.netAmountPaise),
        giftsLast30DaysCount: giftsLast30DaysAggregate._count._all,
        giftsLast30DaysCoins: asNumber(giftsLast30DaysAggregate._sum.coinAmount),
        activePromotionalCodesCount,
        redeemedPromotionalCodesCount,
      },
      recentPurchases: recentPurchases.map((purchase) => ({
        id: purchase.id,
        userId: purchase.userId,
        userName: purchase.user.name,
        packageName: purchase.package.name,
        totalCoins: purchase.totalCoins,
        amount: purchase.amount,
        currency: purchase.currency,
        status: purchase.status,
        createdAt: purchase.createdAt,
      })),
      pendingWithdrawals: pendingWithdrawals.map((withdrawal) => ({
        id: withdrawal.id,
        userId: withdrawal.userId,
        userName: withdrawal.user.name,
        amountCoins: withdrawal.amountCoins,
        netAmountPaise: withdrawal.netAmountPaise,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt,
      })),
      recentGifts: recentGifts.map((gift) => ({
        id: gift.id,
        senderId: gift.senderId,
        senderName: gift.sender.name,
        receiverId: gift.receiverId,
        receiverName: gift.receiver.name,
        giftName: gift.gift.name,
        coinAmount: gift.coinAmount,
        quantity: gift.quantity,
        streamTitle: gift.stream?.title ?? null,
        createdAt: gift.createdAt,
      })),
      activeDiscountCodes,
    };
  }

  static async getCoinLedger(
    filters: LedgerFilters,
    pagination: PaginationParams
  ): Promise<PaginatedSummaryResponse<LedgerEntry, LedgerSummary>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

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

    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      where.amount = {};
      if (filters.amountMin !== undefined) {
        where.amount.gte = filters.amountMin;
      }
      if (filters.amountMax !== undefined) {
        where.amount.lte = filters.amountMax;
      }
    }

    const [purchases, totalCount, aggregates, groupedByStatus, currencySample] = await Promise.all([
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
              email: true,
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
      prisma.coinPurchase.aggregate({
        where,
        _sum: {
          amount: true,
          coins: true,
          bonusCoins: true,
          discountBonusCoins: true,
        },
      }),
      prisma.coinPurchase.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      prisma.coinPurchase.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
        select: { currency: true },
      }),
    ]);

    const discountCodeIds = Array.from(
      new Set(purchases.map((purchase) => purchase.discountCodeId).filter(Boolean))
    ) as string[];

    const discountCodes = discountCodeIds.length
      ? await prisma.discountCode.findMany({
          where: { id: { in: discountCodeIds } },
          select: {
            id: true,
            code: true,
            codeType: true,
          },
        })
      : [];

    const discountCodeMap = new Map(discountCodes.map((code) => [code.id, code]));
    const statusCounts = toStatusCounts(groupedByStatus);

    const data: LedgerEntry[] = purchases.map((purchase) => ({
      id: purchase.id,
      userId: purchase.userId,
      userName: purchase.user.name,
      userEmail: purchase.user.email,
      packageId: purchase.packageId,
      packageName: purchase.package.name,
      coins: purchase.coins,
      bonusCoins: purchase.bonusCoins,
      discountBonusCoins: purchase.discountBonusCoins,
      totalCoins: purchase.totalCoins,
      amount: purchase.amount,
      currency: purchase.currency,
      paymentGateway: purchase.paymentGateway ?? 'dodo',
      transactionId: purchase.transactionId,
      orderId: purchase.orderId,
      status: purchase.status,
      failureReason: purchase.failureReason,
      discountCode: purchase.discountCodeId
        ? (() => {
            const code = discountCodeMap.get(purchase.discountCodeId);
            return code
              ? {
                  id: code.id,
                  code: code.code,
                  codeType: code.codeType,
                }
              : null;
          })()
        : null,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    }));

    return {
      data,
      pagination: buildPagination(page, pageSize, totalCount),
      summary: {
        totalRecords: totalCount,
        completedCount: getCountByKey(statusCounts, 'COMPLETED'),
        pendingCount: getCountByKey(statusCounts, 'PENDING'),
        failedCount: getCountByKey(statusCounts, 'FAILED'),
        refundedCount: getCountByKey(statusCounts, 'REFUNDED'),
        totalAmount: asNumber(aggregates._sum.amount),
        totalCoins: asNumber(aggregates._sum.coins),
        totalBonusCoins: asNumber(aggregates._sum.bonusCoins),
        totalDiscountBonusCoins: asNumber(aggregates._sum.discountBonusCoins),
        currency: currencySample?.currency ?? DEFAULT_CURRENCY,
      },
    };
  }

  static async getWithdrawals(
    filters: WithdrawalFilters,
    pagination: PaginationParams
  ): Promise<PaginatedSummaryResponse<WithdrawalEntry, WithdrawalSummary>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

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

    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      where.amountCoins = {};
      if (filters.amountMin !== undefined) {
        where.amountCoins.gte = filters.amountMin;
      }
      if (filters.amountMax !== undefined) {
        where.amountCoins.lte = filters.amountMax;
      }
    }

    const [withdrawals, totalCount, aggregates, groupedByStatus] = await Promise.all([
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
              email: true,
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
      prisma.creatorWithdrawalRequest.aggregate({
        where,
        _sum: {
          amountCoins: true,
          grossAmountPaise: true,
          netAmountPaise: true,
          platformFeePaise: true,
        },
      }),
      prisma.creatorWithdrawalRequest.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
    ]);

    const statusCounts = toStatusCounts(groupedByStatus);

    const data: WithdrawalEntry[] = withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      userId: withdrawal.userId,
      userName: withdrawal.user.name,
      userEmail: withdrawal.user.email,
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
      reviewerName: withdrawal.reviewer?.name ?? null,
      approvedAt: withdrawal.approvedAt,
      rejectedAt: withdrawal.rejectedAt,
      paidAt: withdrawal.paidAt,
      payoutReference: withdrawal.payoutReference,
      metadata: withdrawal.metadata as Prisma.JsonValue | null,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
    }));

    return {
      data,
      pagination: buildPagination(page, pageSize, totalCount),
      summary: {
        totalRecords: totalCount,
        pendingCount: getCountByKey(statusCounts, 'PENDING'),
        underReviewCount: getCountByKey(statusCounts, 'UNDER_REVIEW'),
        onHoldCount: getCountByKey(statusCounts, 'ON_HOLD'),
        approvedCount: getCountByKey(statusCounts, 'APPROVED'),
        rejectedCount: getCountByKey(statusCounts, 'REJECTED'),
        paidCount: getCountByKey(statusCounts, 'PAID'),
        totalCoins: asNumber(aggregates._sum.amountCoins),
        totalGrossAmountPaise: asNumber(aggregates._sum.grossAmountPaise),
        totalNetAmountPaise: asNumber(aggregates._sum.netAmountPaise),
        totalPlatformFeePaise: asNumber(aggregates._sum.platformFeePaise),
      },
    };
  }

  static async approveWithdrawal(id: string, adminId: string) {
    return await prisma.$transaction(async (tx) => {
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

      if (withdrawal.user.coinWallet.balance < withdrawal.amountCoins) {
        throw new Error('Insufficient wallet balance for withdrawal');
      }

      const updatedWithdrawal = await tx.creatorWithdrawalRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          approvedAt: new Date(),
        },
      });

      await tx.coinWallet.update({
        where: { userId: withdrawal.userId },
        data: {
          balance: {
            decrement: withdrawal.amountCoins,
          },
        },
      });

      await AuditLogService.createLog(adminId, 'withdrawal_approve', 'withdrawal', id, {
        userId: withdrawal.userId,
        amountCoins: withdrawal.amountCoins,
        netAmountPaise: withdrawal.netAmountPaise,
      });

      return updatedWithdrawal;
    });
  }

  static async rejectWithdrawal(id: string, reason: string, adminId: string) {
    return await prisma.$transaction(async (tx) => {
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

      await AuditLogService.createLog(adminId, 'withdrawal_reject', 'withdrawal', id, {
        userId: updatedWithdrawal.userId,
        reason,
      });

      return updatedWithdrawal;
    });
  }

  static async getGiftTransactions(
    filters: GiftFilters,
    pagination: PaginationParams
  ): Promise<PaginatedSummaryResponse<GiftEntry, GiftSummary>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

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

    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      where.coinAmount = {};
      if (filters.amountMin !== undefined) {
        where.coinAmount.gte = filters.amountMin;
      }
      if (filters.amountMax !== undefined) {
        where.coinAmount.lte = filters.amountMax;
      }
    }

    const [gifts, totalCount, aggregates, uniqueSenders, uniqueReceivers] = await Promise.all([
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
          stream: {
            select: {
              title: true,
            },
          },
        },
      }),
      prisma.giftTransaction.count({ where }),
      prisma.giftTransaction.aggregate({
        where,
        _sum: {
          coinAmount: true,
          quantity: true,
        },
      }),
      prisma.giftTransaction.findMany({
        where,
        distinct: ['senderId'],
        select: { senderId: true },
      }),
      prisma.giftTransaction.findMany({
        where,
        distinct: ['receiverId'],
        select: { receiverId: true },
      }),
    ]);

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
      streamTitle: gift.stream?.title ?? null,
      message: gift.message,
      createdAt: gift.createdAt,
    }));

    return {
      data,
      pagination: buildPagination(page, pageSize, totalCount),
      summary: {
        totalRecords: totalCount,
        totalCoins: asNumber(aggregates._sum.coinAmount),
        totalQuantity: asNumber(aggregates._sum.quantity),
        uniqueSenders: uniqueSenders.length,
        uniqueReceivers: uniqueReceivers.length,
      },
    };
  }

  static async getWalletDetails(userId: string): Promise<WalletDetails | null> {
    const wallet = await prisma.coinWallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!wallet) {
      return null;
    }

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

    const recentTransactions = [
      ...purchases.map((purchase) => ({
        id: purchase.id,
        type: 'purchase' as const,
        amount: purchase.totalCoins,
        description: `Purchased ${purchase.package.name}`,
        createdAt: purchase.createdAt,
      })),
      ...giftsSent.map((gift) => ({
        id: gift.id,
        type: 'gift_sent' as const,
        amount: -gift.coinAmount,
        description: `Sent ${gift.gift.name} to ${gift.receiver.name}`,
        createdAt: gift.createdAt,
      })),
      ...giftsReceived.map((gift) => ({
        id: gift.id,
        type: 'gift_received' as const,
        amount: gift.coinAmount,
        description: `Received ${gift.gift.name} from ${gift.sender.name}`,
        createdAt: gift.createdAt,
      })),
      ...withdrawals
        .filter((withdrawal) => withdrawal.approvedAt)
        .map((withdrawal) => ({
          id: withdrawal.id,
          type: 'withdrawal' as const,
          amount: -withdrawal.amountCoins,
          description: 'Withdrawal approved',
          createdAt: withdrawal.approvedAt!,
        })),
    ]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, 20);

    return {
      userId: wallet.userId,
      userName: wallet.user.name,
      userEmail: wallet.user.email,
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
      recentTransactions,
    };
  }
}
