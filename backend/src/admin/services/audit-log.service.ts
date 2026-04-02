import { prisma } from '../../lib/db';
import type { Prisma } from '@prisma/client';
import { logger } from '../../lib/logger';

/**
 * Audit action types that can be logged
 */
export type AuditAction =
  | 'user_ban'
  | 'user_freeze'
  | 'user_unfreeze'
  | 'user_chat_disable'
  | 'user_password_reset'
  | 'stream_kill'
  | 'streamer_mute'
  | 'stream_chat_disable'
  | 'streamer_warn'
  | 'content_remove'
  | 'withdrawal_approve'
  | 'withdrawal_reject'
  | 'application_approve'
  | 'application_reject'
  | 'application_note'
  | 'role_change'
  | 'settings_update'
  | 'geo_block_create'
  | 'report_resolve'
  | 'discount_code_create'
  | 'discount_code_update'
  | 'discount_code_delete';

/**
 * Target types for audit log entries
 */
export type TargetType =
  | 'user'
  | 'stream'
  | 'post'
  | 'short'
  | 'report'
  | 'withdrawal'
  | 'application'
  | 'discount_code';

/**
 * Filters for querying audit logs
 */
export interface AuditLogFilters {
  adminId?: string;
  action?: AuditAction;
  targetType?: TargetType;
  targetId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Paginated response format
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
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
 * Service for managing audit logs
 * Handles creation and querying of administrative action logs
 */
export class AuditLogService {
  /**
   * Create a new audit log entry
   *
   * @param adminId - ID of the admin performing the action
   * @param action - Type of action being performed
   * @param targetType - Type of entity being acted upon
   * @param targetId - ID of the entity being acted upon
   * @param metadata - Additional context about the action (optional)
   * @returns The created audit log entry
   *
   * @example
   * await AuditLogService.createLog(
   *   'admin123',
   *   'user_ban',
   *   'user',
   *   'user456',
   *   { reason: 'Violation of terms', duration: 'permanent' }
   * );
   */
  static async createLog(
    adminId: string,
    action: AuditAction,
    targetType: TargetType,
    targetId: string,
    metadata?: Record<string, any>
  ) {
    // Get admin details for logging
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { email: true },
    });

    // Log the admin action
    logger.adminAction(action, adminId, admin?.email || 'unknown', targetType, targetId, metadata);

    return await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        metadata: metadata ? (metadata as any) : undefined,
      },
    });
  }

  /**
   * Query audit logs with filtering and pagination
   *
   * @param filters - Filter criteria for the query
   * @param pagination - Pagination parameters
   * @returns Paginated list of audit log entries with admin details
   *
   * @example
   * const logs = await AuditLogService.getLogs(
   *   { action: 'user_ban', dateFrom: new Date('2024-01-01') },
   *   { page: 1, pageSize: 20 }
   * );
   */
  static async getLogs(
    filters: AuditLogFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<AuditLogEntry>> {
    const page = pagination.page || 1;
    const pageSize = Math.min(pagination.pageSize || 20, 100); // Cap at 100
    const skip = (page - 1) * pageSize;

    // Build where clause from filters
    const where: Prisma.AdminAuditLogWhereInput = {};

    if (filters.adminId) {
      where.adminId = filters.adminId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.targetType) {
      where.targetType = filters.targetType;
    }

    if (filters.targetId) {
      where.targetId = filters.targetId;
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

    // Execute query with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          admin: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    // Transform results to include admin name
    const data: AuditLogEntry[] = logs.map((log) => ({
      id: log.id,
      adminId: log.adminId,
      adminName: log.admin.name,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata as Record<string, any> | null,
      createdAt: log.createdAt,
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
}
