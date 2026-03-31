import { prisma } from '../../lib/db';
import type { Prisma, ReportReason, ReportStatus } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import type { PaginatedResponse } from './audit-log.service';

/**
 * Filters for listing reports
 */
export interface ReportFilters {
  reason?: ReportReason;
  status?: ReportStatus;
  reporterId?: string;
  reportedUserId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'priority' | 'reportCount';
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
 * Report list item with essential details
 */
export interface ReportListItem {
  id: string;
  reason: ReportReason;
  description: string | null;
  reporterName: string;
  reportedUserName: string;
  status: ReportStatus;
  createdAt: Date;
  reportCount: number; // Count of reports against same content/user
  priority: 'high' | 'medium' | 'low';
}

/**
 * Complete report details including history
 */
export interface ReportDetails {
  id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  resolution: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reporter: {
    id: string;
    name: string;
    email: string;
    reportHistory: Array<{
      id: string;
      reason: ReportReason;
      status: ReportStatus;
      createdAt: Date;
    }>;
  };
  reportedUser: {
    id: string;
    name: string;
    email: string;
    reportHistory: Array<{
      id: string;
      reason: ReportReason;
      status: ReportStatus;
      createdAt: Date;
    }>;
  };
  content: {
    type: 'post' | 'comment' | 'stream' | null;
    id: string | null;
    preview: string | null;
  };
}

/**
 * Service for managing user reports and complaints
 * Handles report listing, viewing, and resolution
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
 */
export class ReportsService {
  /**
   * Calculate priority based on report reason and count
   */
  private static calculatePriority(reason: ReportReason, reportCount: number): 'high' | 'medium' | 'low' {
    // High priority reasons
    if (['HATE_SPEECH', 'VIOLENCE', 'SELF_HARM', 'NUDITY'].includes(reason)) {
      return 'high';
    }

    // High priority if multiple reports
    if (reportCount >= 5) {
      return 'high';
    }

    // Medium priority reasons
    if (['HARASSMENT', 'COPYRIGHT', 'MISINFORMATION'].includes(reason)) {
      return 'medium';
    }

    // Medium priority if moderate report count
    if (reportCount >= 2) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * List reports with filtering, sorting, and pagination
   * 
   * @param filters - Filter criteria for reports
   * @param pagination - Pagination parameters
   * @returns Paginated list of reports
   * 
   * Requirements: 7.1, 7.2, 7.3
   */
  static async listReports(
    filters: ReportFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<ReportListItem>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.ReportWhereInput = {};

    // Filter by reason
    if (filters.reason) {
      where.reason = filters.reason;
    }

    // Filter by status
    if (filters.status) {
      where.status = filters.status;
    }

    // Filter by reporter ID
    if (filters.reporterId) {
      where.reporterId = filters.reporterId;
    }

    // Filter by reported user ID
    if (filters.reportedUserId) {
      where.reportedUserId = filters.reportedUserId;
    }

    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    // Build order by clause
    const orderBy: Prisma.ReportOrderByWithRelationInput = {};
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    // Note: priority and reportCount are calculated fields, so we sort by createdAt for now
    // In a production system, these would be indexed fields or computed in a view
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      // Default to createdAt for priority and reportCount sorting
      orderBy.createdAt = sortOrder;
    }

    // Execute query with pagination
    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          reporter: {
            select: {
              name: true,
            },
          },
          reportedUser: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    // Calculate report counts for each reported user/content
    const reportCounts = await Promise.all(
      reports.map(async (report) => {
        // Count reports against the same user
        const count = await prisma.report.count({
          where: {
            reportedUserId: report.reportedUserId,
          },
        });
        return count;
      })
    );

    // Transform results
    const data: ReportListItem[] = reports.map((report, index) => {
      const reportCount = reportCounts[index];
      const priority = this.calculatePriority(report.reason, reportCount);

      return {
        id: report.id,
        reason: report.reason,
        description: report.description,
        reporterName: report.reporter.name,
        reportedUserName: report.reportedUser.name,
        status: report.status,
        createdAt: report.createdAt,
        reportCount,
        priority,
      };
    });

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
   * Get complete report details by ID
   * Includes reporter and reported user history
   * 
   * @param id - Report ID
   * @returns Complete report details or null if not found
   * 
   * Requirements: 7.4, 7.5, 7.6
   */
  static async getReportById(id: string): Promise<ReportDetails | null> {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });

    if (!report) {
      return null;
    }

    // Fetch reporter history (previous reports submitted)
    const reporterHistory = await prisma.report.findMany({
      where: {
        reporterId: report.reporterId,
        id: { not: id }, // Exclude current report
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });

    // Fetch reported user history (previous reports against them)
    const reportedUserHistory = await prisma.report.findMany({
      where: {
        reportedUserId: report.reportedUserId,
        id: { not: id }, // Exclude current report
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });

    // Determine content type and preview
    let contentType: 'post' | 'comment' | 'stream' | null = null;
    let contentId: string | null = null;
    let contentPreview: string | null = null;

    if (report.postId && report.post) {
      contentType = 'post';
      contentId = report.post.id;
      contentPreview = report.post.content?.substring(0, 200) || null;
    } else if (report.commentId && report.comment) {
      contentType = 'comment';
      contentId = report.comment.id;
      contentPreview = report.comment.content?.substring(0, 200) || null;
    } else if (report.streamId) {
      contentType = 'stream';
      contentId = report.streamId;
      contentPreview = 'Live stream';
    }

    return {
      id: report.id,
      reason: report.reason,
      description: report.description,
      status: report.status,
      resolution: report.resolution,
      reviewedBy: report.reviewedBy,
      reviewedAt: report.reviewedAt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reporter: {
        id: report.reporter.id,
        name: report.reporter.name,
        email: report.reporter.email,
        reportHistory: reporterHistory,
      },
      reportedUser: {
        id: report.reportedUser.id,
        name: report.reportedUser.name,
        email: report.reportedUser.email,
        reportHistory: reportedUserHistory,
      },
      content: {
        type: contentType,
        id: contentId,
        preview: contentPreview,
      },
    };
  }

  /**
   * Resolve a report with action and admin notes
   * 
   * @param id - Report ID
   * @param action - Resolution action taken
   * @param notes - Admin notes on resolution
   * @param adminId - ID of admin performing the action
   * @returns Updated report
   * 
   * Requirements: 7.7, 7.8
   */
  static async resolveReport(
    id: string,
    action: 'dismiss' | 'warning_sent' | 'content_removed' | 'user_suspended' | 'user_banned',
    notes: string,
    adminId: string
  ) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Update report status
      const report = await tx.report.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          resolution: notes,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(
        adminId,
        'report_resolve',
        'report',
        id,
        {
          action,
          notes,
          reportedUserId: report.reportedUserId,
          reason: report.reason,
        }
      );

      return report;
    });
  }
}
