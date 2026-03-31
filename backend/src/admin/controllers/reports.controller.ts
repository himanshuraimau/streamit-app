import type { Request, Response } from 'express';
import { z } from 'zod';
import { ReportsService } from '../services/reports.service';
import { AuditLogService } from '../services/audit-log.service';
import { listReportsSchema, resolveReportSchema } from '../validations/reports.schema';

/**
 * Controller for reports and complaints management
 * Handles HTTP requests for report listing, viewing, and resolution
 * 
 * Requirements: 17.2
 */
export class ReportsController {
  /**
   * List reports with filtering, sorting, and pagination
   * GET /api/admin/reports
   * 
   * Query parameters:
   * - page: number (default: 1)
   * - pageSize: number (default: 20, max: 100)
   * - reason: ReportReason (optional)
   * - status: ReportStatus (optional)
   * - reporterId: string (optional)
   * - reportedUserId: string (optional)
   * - dateFrom: date (optional)
   * - dateTo: date (optional)
   * - sortBy: 'createdAt' | 'priority' | 'reportCount' (default: 'createdAt')
   * - sortOrder: 'asc' | 'desc' (default: 'desc')
   * 
   * Requirements: 7.1, 7.2, 7.3
   */
  static async listReports(req: Request, res: Response) {
    try {
      // Validate query parameters
      const params = listReportsSchema.parse(req.query);

      // Extract pagination and filters
      const pagination = {
        page: params.page,
        pageSize: params.pageSize,
      };

      const filters = {
        reason: params.reason,
        status: params.status,
        reporterId: params.reporterId,
        reportedUserId: params.reportedUserId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      };

      // Call service
      const result = await ReportsService.listReports(filters, pagination);

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error listing reports:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list reports',
      });
    }
  }

  /**
   * Get report details by ID
   * GET /api/admin/reports/:id
   * 
   * Returns complete report details including:
   * - Reporter information and history
   * - Reported user information and history
   * - Reported content preview
   * - Resolution details
   * 
   * Requirements: 7.4, 7.5, 7.6
   */
  static async getReportById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Report ID is required',
        });
      }

      // Call service
      const report = await ReportsService.getReportById(id);

      if (!report) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Report not found',
        });
      }

      // Return response
      res.json(report);
    } catch (error) {
      console.error('Error getting report:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get report details',
      });
    }
  }

  /**
   * Resolve a report with action and admin notes
   * PATCH /api/admin/reports/:id/resolve
   * 
   * Body:
   * - action: 'dismiss' | 'warning_sent' | 'content_removed' | 'user_suspended' | 'user_banned'
   * - notes: string (required, min 10 chars)
   * 
   * Requirements: 7.7, 7.8
   */
  static async resolveReport(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Report ID is required',
        });
      }

      // Validate request body
      const data = resolveReportSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const report = await ReportsService.resolveReport(
        id,
        data.action,
        data.notes,
        adminId
      );

      // Return response
      res.json({
        success: true,
        message: 'Report resolved successfully',
        data: {
          id: report.id,
          status: report.status,
          resolution: report.resolution,
          reviewedBy: report.reviewedBy,
          reviewedAt: report.reviewedAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error resolving report:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to resolve report',
      });
    }
  }

  /**
   * Get audit log for report resolutions
   * GET /api/admin/reports/audit-log
   * 
   * Query parameters:
   * - page: number (default: 1)
   * - pageSize: number (default: 20, max: 100)
   * - adminId: string (optional)
   * - dateFrom: date (optional)
   * - dateTo: date (optional)
   * 
   * Requirements: 7.9
   */
  static async getAuditLog(req: Request, res: Response) {
    try {
      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

      // Parse filter parameters
      const filters: any = {
        targetType: 'report',
      };

      if (req.query.adminId) {
        filters.adminId = req.query.adminId as string;
      }

      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom as string);
      }

      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo as string);
      }

      // Call audit log service
      const result = await AuditLogService.getLogs(filters, { page, pageSize });

      // Return response
      res.json(result);
    } catch (error) {
      console.error('Error getting audit log:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get audit log',
      });
    }
  }
}
