import { prisma } from '../../lib/db';
import type { Prisma } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import type { PaginationParams, PaginatedResponse } from './audit-log.service';

/**
 * Filters for querying audit logs
 */
export interface AuditLogFilters {
  adminId?: string;
  action?: string;
  targetType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Audit log entry with admin details
 */
export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

/**
 * Geo-block data
 */
export interface GeoBlockData {
  region: string;
  contentId?: string;
  reason?: string;
}

/**
 * User data export structure for GDPR compliance
 */
export interface UserDataExport {
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
    bio: string | null;
    profilePicture: string | null;
    role: string;
    createdAt: Date;
    lastLoginAt: Date | null;
    isSuspended: boolean;
    suspendedReason: string | null;
  };
  posts: Array<{
    id: string;
    content: string | null;
    mediaUrl: string | null;
    type: string;
    isShort: boolean;
    createdAt: Date;
    likesCount: number;
    commentsCount: number;
  }>;
  comments: Array<{
    id: string;
    content: string;
    postId: string;
    createdAt: Date;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>;
  streams: Array<{
    id: string;
    title: string;
    category: string | null;
    startedAt: Date;
    endedAt: Date | null;
    peakViewers: number;
  }>;
  wallet: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  };
  exportedAt: Date;
  exportedBy: string;
}

/**
 * Takedown content item
 */
export interface TakedownContent {
  id: string;
  type: string;
  content: string | null;
  mediaUrl: string | null;
  authorId: string;
  authorName: string;
  isHidden: boolean;
  hiddenReason: string | null;
  hiddenAt: Date | null;
  createdAt: Date;
}

/**
 * Service for compliance and legal operations
 * Handles audit logs, geo-blocking, data exports, and takedowns
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9
 */
export class ComplianceService {
  /**
   * Get audit log with filtering and pagination
   * 
   * @param filters - Filter criteria for the query
   * @param pagination - Pagination parameters
   * @returns Paginated list of audit log entries
   * 
   * Requirements: 11.1, 11.2
   * 
   * @example
   * const logs = await ComplianceService.getAuditLog(
   *   { action: 'user_ban', dateFrom: new Date('2024-01-01') },
   *   { page: 1, pageSize: 20 }
   * );
   */
  static async getAuditLog(
    filters: AuditLogFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<AuditLogEntry>> {
    // Delegate to AuditLogService
    return await AuditLogService.getLogs(filters, pagination);
  }

  /**
   * Create a geo-block to restrict content access by region
   * 
   * @param region - ISO country code
   * @param contentId - Optional specific content ID to block
   * @param reason - Legal reason for the block
   * @param adminId - ID of the admin creating the block
   * @returns The created geo-block record
   * 
   * Requirements: 11.3, 11.4, 11.5
   * 
   * @example
   * await ComplianceService.createGeoBlock(
   *   'CN',
   *   'post123',
   *   'Legal compliance requirement',
   *   'admin456'
   * );
   */
  static async createGeoBlock(
    region: string,
    contentId: string | undefined,
    reason: string | undefined,
    adminId: string
  ) {
    // Validate region is a valid ISO country code (2-letter code)
    if (!/^[A-Z]{2}$/.test(region)) {
      throw new Error('Invalid region code. Must be a 2-letter ISO country code.');
    }

    // If contentId is provided, verify it exists
    if (contentId) {
      const content = await prisma.post.findUnique({
        where: { id: contentId },
        select: { id: true },
      });

      if (!content) {
        throw new Error('Content not found');
      }
    }

    // Create geo-block
    const geoBlock = await prisma.geoBlock.create({
      data: {
        region,
        contentId: contentId || null,
        reason: reason || null,
        createdBy: adminId,
      },
    });

    // Create audit log entry
    await AuditLogService.createLog(
      adminId,
      'geo_block_create',
      contentId ? 'post' : 'region',
      contentId || region,
      {
        region,
        contentId,
        reason,
      }
    );

    return geoBlock;
  }

  /**
   * Export all user data for GDPR compliance
   * 
   * @param userId - ID of the user to export data for
   * @param adminId - ID of the admin requesting the export
   * @returns Complete user data export in JSON format
   * 
   * Requirements: 11.6, 11.7
   * 
   * @example
   * const userData = await ComplianceService.exportUserData('user123', 'admin456');
   */
  static async exportUserData(
    userId: string,
    adminId: string
  ): Promise<UserDataExport> {
    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        bio: true,
        profilePicture: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        isSuspended: true,
        suspendedReason: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Fetch user posts
    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        mediaUrl: true,
        type: true,
        isShort: true,
        createdAt: true,
        likesCount: true,
        commentsCount: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch user comments
    const comments = await prisma.comment.findMany({
      where: { userId },
      select: {
        id: true,
        content: true,
        postId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch coin purchases (transactions)
    const coinPurchases = await prisma.coinPurchase.findMany({
      where: { userId },
      select: {
        id: true,
        coins: true,
        bonusCoins: true,
        amount: true,
        status: true,
        createdAt: true,
        package: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch gift transactions (sent)
    const giftsSent = await prisma.giftTransaction.findMany({
      where: { senderId: userId },
      select: {
        id: true,
        coinAmount: true,
        quantity: true,
        createdAt: true,
        gift: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch gift transactions (received)
    const giftsReceived = await prisma.giftTransaction.findMany({
      where: { receiverId: userId },
      select: {
        id: true,
        coinAmount: true,
        quantity: true,
        createdAt: true,
        gift: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Combine transactions
    const transactions = [
      ...coinPurchases.map((purchase) => ({
        id: purchase.id,
        type: 'coin_purchase',
        amount: purchase.amount,
        status: purchase.status,
        createdAt: purchase.createdAt,
      })),
      ...giftsSent.map((gift) => ({
        id: gift.id,
        type: 'gift_sent',
        amount: gift.coinAmount * gift.quantity,
        status: 'COMPLETED',
        createdAt: gift.createdAt,
      })),
      ...giftsReceived.map((gift) => ({
        id: gift.id,
        type: 'gift_received',
        amount: gift.coinAmount * gift.quantity,
        status: 'COMPLETED',
        createdAt: gift.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Fetch streams
    const streams = await prisma.stream.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        category: true,
        startedAt: true,
        stats: {
          select: {
            peakViewers: true,
            endedAt: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    // Fetch wallet information
    const wallet = await prisma.coinWallet.findUnique({
      where: { userId },
      select: {
        balance: true,
      },
    });

    // Calculate total earned and spent
    const totalEarned = giftsReceived.reduce(
      (sum, gift) => sum + gift.coinAmount * gift.quantity,
      0
    );
    const totalSpent = giftsSent.reduce(
      (sum, gift) => sum + gift.coinAmount * gift.quantity,
      0
    );

    // Create audit log entry
    await AuditLogService.createLog(
      adminId,
      'settings_update', // Using existing action type for data export
      'user',
      userId,
      {
        action: 'data_export',
        exportType: 'gdpr_compliance',
      }
    );

    // Return complete data export
    return {
      user: {
        ...user,
        role: user.role as string,
      },
      posts: posts.map((post) => ({
        ...post,
        type: post.type as string,
      })),
      comments,
      transactions,
      streams: streams.map((stream) => ({
        id: stream.id,
        title: stream.title,
        category: stream.category,
        startedAt: stream.startedAt!,
        endedAt: stream.stats?.endedAt || null,
        peakViewers: stream.stats?.peakViewers || 0,
      })),
      wallet: {
        balance: wallet?.balance || 0,
        totalEarned,
        totalSpent,
      },
      exportedAt: new Date(),
      exportedBy: adminId,
    };
  }

  /**
   * Get all content that has been taken down for legal reasons
   * 
   * @returns List of content with legal removal reasons
   * 
   * Requirements: 11.9
   * 
   * @example
   * const takedowns = await ComplianceService.getTakedowns();
   */
  static async getTakedowns(): Promise<TakedownContent[]> {
    // Fetch all hidden content with legal-related keywords in hiddenReason
    const posts = await prisma.post.findMany({
      where: {
        isHidden: true,
        hiddenReason: {
          contains: 'legal',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        type: true,
        content: true,
        authorId: true,
        isHidden: true,
        hiddenReason: true,
        hiddenAt: true,
        createdAt: true,
        author: {
          select: {
            name: true,
          },
        },
        media: {
          select: {
            url: true,
          },
        },
      },
      orderBy: {
        hiddenAt: 'desc',
      },
    });

    return posts.map((post) => ({
      id: post.id,
      type: post.type as string,
      content: post.content,
      mediaUrl: post.media[0]?.url || null,
      authorId: post.authorId,
      authorName: post.author.name,
      isHidden: post.isHidden,
      hiddenReason: post.hiddenReason,
      hiddenAt: post.hiddenAt,
      createdAt: post.createdAt,
    }));
  }
}
