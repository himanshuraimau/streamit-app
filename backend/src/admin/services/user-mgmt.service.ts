import { prisma } from '../../lib/db';
import type { Prisma, UserRole } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import type { PaginatedResponse } from './audit-log.service';

/**
 * Filters for listing users
 */
export interface UserFilters {
  search?: string;
  role?: UserRole;
  isSuspended?: boolean;
  email?: string;
  username?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sortBy?: 'createdAt' | 'lastLoginAt' | 'username';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * User list item with essential details
 */
export interface UserListItem {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  isSuspended: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

/**
 * Complete user details including wallet and ban history
 */
export interface UserDetails {
  id: string;
  name: string;
  email: string;
  username: string;
  phone: string | null;
  bio: string | null;
  image: string | null;
  role: UserRole;
  isSuspended: boolean;
  suspendedReason: string | null;
  suspendedBy: string | null;
  suspendedAt: Date | null;
  suspensionExpiresAt: Date | null;
  adminNotes: string | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  createdAt: Date;
  updatedAt: Date;
  wallet: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
  } | null;
  banHistory: Array<{
    id: string;
    action: string;
    reason: string | null;
    adminName: string;
    createdAt: Date;
  }>;
}

/**
 * Service for managing user accounts
 * Handles user listing, viewing, freezing, banning, and other admin actions
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9
 */
export class UserMgmtService {
  /**
   * List users with filtering, search, and pagination
   *
   * @param filters - Filter criteria for users
   * @param pagination - Pagination parameters
   * @returns Paginated list of users
   *
   * Requirements: 4.1, 4.2, 4.3
   */
  static async listUsers(
    filters: UserFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<UserListItem>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    // Search by name, email, or username
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filter by role
    if (filters.role) {
      where.role = filters.role;
    }

    // Filter by suspension status
    if (filters.isSuspended !== undefined) {
      where.isSuspended = filters.isSuspended;
    }

    // Filter by email
    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }

    // Filter by username
    if (filters.username) {
      where.username = { contains: filters.username, mode: 'insensitive' };
    }

    // Filter by creation date range
    if (filters.createdFrom || filters.createdTo) {
      where.createdAt = {};
      if (filters.createdFrom) {
        where.createdAt.gte = filters.createdFrom;
      }
      if (filters.createdTo) {
        where.createdAt.lte = filters.createdTo;
      }
    }

    // Build order by clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    // Execute query with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          isSuspended: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: users,
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
   * Get complete user details by ID
   * Includes wallet balance and ban history
   *
   * @param id - User ID
   * @returns Complete user details or null if not found
   *
   * Requirements: 4.4
   */
  static async getUserById(id: string): Promise<UserDetails | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        coinWallet: {
          select: {
            balance: true,
            totalEarned: true,
            totalSpent: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Fetch ban history from audit logs
    const banHistory = await prisma.adminAuditLog.findMany({
      where: {
        targetType: 'user',
        targetId: id,
        action: {
          in: ['user_ban', 'user_freeze', 'user_unfreeze'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        admin: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      bio: user.bio,
      image: user.image,
      role: user.role,
      isSuspended: user.isSuspended,
      suspendedReason: user.suspendedReason,
      suspendedBy: user.suspendedBy,
      suspendedAt: user.suspendedAt,
      suspensionExpiresAt: user.suspensionExpiresAt,
      adminNotes: user.adminNotes,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      wallet: user.coinWallet,
      banHistory: banHistory.map((log) => ({
        id: log.id,
        action: log.action,
        reason: (log.metadata as any)?.reason || null,
        adminName: log.admin.name,
        createdAt: log.createdAt,
      })),
    };
  }

  /**
   * Freeze a user account (temporary suspension)
   *
   * @param id - User ID
   * @param reason - Reason for suspension
   * @param expiresAt - Optional expiration date (null = permanent)
   * @param adminId - ID of admin performing the action
   * @returns Updated user
   *
   * Requirements: 4.5, 4.6
   */
  static async freezeUser(
    id: string,
    reason: string,
    expiresAt: Date | null,
    adminId: string,
    adminNotes?: string
  ) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Update user suspension status
      const user = await tx.user.update({
        where: { id },
        data: {
          isSuspended: true,
          suspendedReason: reason,
          suspendedBy: adminId,
          suspendedAt: new Date(),
          suspensionExpiresAt: expiresAt,
          adminNotes: adminNotes || undefined,
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'user_freeze', 'user', id, {
        reason,
        expiresAt: expiresAt?.toISOString() || null,
        adminNotes,
      });

      return user;
    });
  }

  /**
   * Ban a user account (permanent suspension)
   *
   * @param id - User ID
   * @param reason - Reason for ban
   * @param adminId - ID of admin performing the action
   * @returns Updated user
   *
   * Requirements: 4.7
   */
  static async banUser(id: string, reason: string, adminId: string, adminNotes?: string) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Update user suspension status (permanent = no expiration)
      const user = await tx.user.update({
        where: { id },
        data: {
          isSuspended: true,
          suspendedReason: reason,
          suspendedBy: adminId,
          suspendedAt: new Date(),
          suspensionExpiresAt: null, // null = permanent
          adminNotes: adminNotes || undefined,
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'user_ban', 'user', id, {
        reason,
        permanent: true,
        adminNotes,
      });

      return user;
    });
  }

  /**
   * Disable chat for a user (24-hour restriction)
   * Note: This is a placeholder implementation. The actual chat system
   * would need to check this flag when users attempt to send messages.
   *
   * @param id - User ID
   * @param duration - Duration in hours
   * @param adminId - ID of admin performing the action
   * @returns Updated user with admin notes
   *
   * Requirements: 4.8
   */
  static async disableChat(id: string, duration: number, reason: string, adminId: string) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + duration);

    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Store chat disable info in admin notes
      const chatDisableInfo = {
        chatDisabled: true,
        chatDisabledUntil: expiresAt.toISOString(),
        chatDisableReason: reason,
      };

      const user = await tx.user.update({
        where: { id },
        data: {
          adminNotes: JSON.stringify(chatDisableInfo),
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'user_chat_disable', 'user', id, {
        reason,
        duration,
        expiresAt: expiresAt.toISOString(),
      });

      return user;
    });
  }

  /**
   * Reset user password (admin-initiated)
   * Generates a password reset token and optionally sends email
   *
   * @param id - User ID
   * @param adminId - ID of admin performing the action
   * @returns Password reset token
   *
   * Requirements: 4.9
   */
  static async resetPassword(id: string, adminId: string) {
    // Generate a secure random token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Store reset token in verification table
      await tx.verification.create({
        data: {
          id: crypto.randomUUID(),
          identifier: `password-reset:${id}`,
          value: token,
          expiresAt,
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'user_password_reset', 'user', id, {
        tokenGenerated: true,
      });

      return {
        token,
        expiresAt,
      };
    });
  }

  /**
   * Unfreeze a user account
   *
   * @param id - User ID
   * @param adminId - ID of admin performing the action
   * @returns Updated user
   */
  static async unfreezeUser(id: string, adminId: string) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Update user suspension status
      const user = await tx.user.update({
        where: { id },
        data: {
          isSuspended: false,
          suspendedReason: null,
          suspendedBy: null,
          suspendedAt: null,
          suspensionExpiresAt: null,
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'user_unfreeze', 'user', id, {});

      return user;
    });
  }
}
