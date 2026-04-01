import type { Request, Response } from 'express';
import { z } from 'zod';
import { ComplianceService } from '../services/compliance.service';

/**
 * Controller for compliance and legal operations
 * Handles HTTP requests for audit logs, geo-blocking, data exports, and takedowns
 * 
 * Requirements: 17.2
 */
export class ComplianceController {
  /**
   * Get audit log with filtering and pagination
   * GET /api/admin/compliance/audit-log
   * 
   * Query parameters:
   * - page: number (default: 1)
   * - pageSize: number (default: 20, max: 100)
   * - adminId: string (optional)
   * - action: string (optional)
   * - targetType: string (optional)
   * - dateFrom: date (optional)
   * - dateTo: date (optional)
   * 
   * Requirements: 11.1, 11.2
   */
  static async getAuditLog(req: Request, res: Response) {
    try {
      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

      // Parse filter parameters
      const filters: any = {};

      if (req.query.adminId) {
        filters.adminId = req.query.adminId as string;
      }

      if (req.query.action) {
        filters.action = req.query.action as string;
      }

      if (req.query.targetType) {
        filters.targetType = req.query.targetType as string;
      }

      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom as string);
      }

      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo as string);
      }

      // Call service
      const result = await ComplianceService.getAuditLog(filters, { page, pageSize });

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

  /**
   * Create a geo-block to restrict content access by region
   * POST /api/admin/compliance/geo-block
   * 
   * Body:
   * - region: string (required, 2-letter ISO country code)
   * - contentId: string (optional)
   * - reason: string (optional)
   * 
   * Requirements: 11.3, 11.4, 11.5
   */
  static async createGeoBlock(req: Request, res: Response) {
    try {
      // Validate request body
      const schema = z.object({
        region: z.string().length(2).regex(/^[A-Z]{2}$/, 'Must be a 2-letter ISO country code'),
        contentId: z.string().optional(),
        reason: z.string().optional(),
      });

      const data = schema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const geoBlock = await ComplianceService.createGeoBlock(
        data.region,
        data.contentId,
        data.reason,
        adminId
      );

      // Return response
      res.json({
        success: true,
        message: 'Geo-block created successfully',
        data: {
          id: geoBlock.id,
          region: geoBlock.region,
          contentId: geoBlock.contentId,
          reason: geoBlock.reason,
          createdAt: geoBlock.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        if (error.message === 'Content not found') {
          return res.status(404).json({
            error: 'Not found',
            message: error.message,
          });
        }

        if (error.message.includes('Invalid region code')) {
          return res.status(400).json({
            error: 'Validation failed',
            message: error.message,
          });
        }
      }

      console.error('Error creating geo-block:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create geo-block',
      });
    }
  }

  /**
   * Export all user data for GDPR compliance
   * GET /api/admin/compliance/export
   * 
   * Query parameters:
   * - userId: string (required)
   * 
   * Returns JSON data export
   * 
   * Requirements: 11.6, 11.7, 11.8
   */
  static async exportUserData(req: Request, res: Response) {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'userId query parameter is required',
        });
      }

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const userData = await ComplianceService.exportUserData(userId, adminId);

      // Set headers for JSON download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`
      );

      // Return response
      res.json(userData);
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      console.error('Error exporting user data:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to export user data',
      });
    }
  }

  /**
   * Get all content that has been taken down for legal reasons
   * GET /api/admin/compliance/takedowns
   * 
   * Returns list of content with legal removal reasons
   * 
   * Requirements: 11.9
   */
  static async getTakedowns(req: Request, res: Response) {
    try {
      // Call service
      const takedowns = await ComplianceService.getTakedowns();

      // Return response
      res.json({
        data: takedowns,
        count: takedowns.length,
      });
    } catch (error) {
      console.error('Error getting takedowns:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get takedowns',
      });
    }
  }
}
