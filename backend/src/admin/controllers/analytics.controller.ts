import type { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { z } from 'zod';

// Validation schemas
const dateRangeSchema = z.enum(['today', '7days', '30days', '90days']);

const topStreamersSchema = z.object({
  dateRange: dateRangeSchema.default('30days'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const topContentSchema = z.object({
  dateRange: dateRangeSchema.default('30days'),
  type: z.enum(['shorts', 'posts', 'streams']),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export class AnalyticsController {
  /**
   * GET /api/admin/analytics/overview
   * Get overview metrics: DAU, MAU, revenue, concurrent users, conversion rate
   */
  static async getOverview(req: Request, res: Response) {
    try {
      const dateRange = dateRangeSchema.parse(req.query.dateRange || '30days');

      const metrics = await AnalyticsService.getOverview(dateRange);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      console.error('Error getting analytics overview:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/admin/analytics/streamers
   * Get top streamers ranked by revenue
   */
  static async getTopStreamers(req: Request, res: Response) {
    try {
      const params = topStreamersSchema.parse(req.query);

      const streamers = await AnalyticsService.getTopStreamers(params.dateRange, params.limit);

      res.json({
        success: true,
        data: streamers,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      console.error('Error getting top streamers:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/admin/analytics/content
   * Get top content (shorts, posts, streams) by engagement
   */
  static async getTopContent(req: Request, res: Response) {
    try {
      const params = topContentSchema.parse(req.query);

      const content = await AnalyticsService.getTopContent(
        params.dateRange,
        params.type,
        params.limit
      );

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      console.error('Error getting top content:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }

  /**
   * GET /api/admin/analytics/conversion
   * Get conversion funnel metrics
   */
  static async getConversionFunnel(req: Request, res: Response) {
    try {
      const dateRange = dateRangeSchema.parse(req.query.dateRange || '30days');

      const funnel = await AnalyticsService.getConversionFunnel(dateRange);

      res.json({
        success: true,
        data: funnel,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      console.error('Error getting conversion funnel:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
}
