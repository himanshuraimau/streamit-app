import type { Request, Response } from 'express';
import { z } from 'zod';
import { AdsService } from '../services/ads.service';
import {
  createAdSchema,
  updateAdSchema,
  deleteAdSchema,
  getAdPerformanceSchema,
  listAdsSchema,
} from '../validations/ads.schema';

/**
 * Controller for advertisement management
 * Handles ad campaign creation, updates, deletion, and performance tracking
 *
 * Requirements: 17.2
 */
export class AdsController {
  /**
   * List ad campaigns with filtering and pagination
   * GET /api/admin/ads
   *
   * Requirements: 9.1, 9.2, 9.3
   */
  static async listAds(req: Request, res: Response) {
    try {
      // Validate query parameters
      const params = listAdsSchema.parse(req.query);

      // Convert date strings to Date objects
      const filters = {
        status: params.status,
        targetRegion: params.targetRegion,
        category: params.category,
        dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      };

      const pagination = {
        page: params.page,
        pageSize: params.pageSize,
      };

      // Call service
      const result = await AdsService.listAds(filters, pagination);

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      console.error('Error listing ads:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create a new ad campaign
   * POST /api/admin/ads
   *
   * Requirements: 9.4
   */
  static async createAd(req: Request, res: Response) {
    try {
      // Validate request body
      const data = createAdSchema.parse(req.body);

      // Get admin ID from authenticated user
      const adminId = (req as any).adminUser.id;

      // Call service
      const result = await AdsService.createAd(data, adminId);

      // Return response
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      console.error('Error creating ad:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update an existing ad campaign
   * PATCH /api/admin/ads/:id
   *
   * Requirements: 9.5, 9.6
   */
  static async updateAd(req: Request, res: Response) {
    try {
      // Validate parameters and body
      const params = updateAdSchema.parse({
        id: req.params.id,
        ...req.body,
      });

      // Get admin ID from authenticated user
      const adminId = (req as any).adminUser.id;

      // Extract id and data
      const { id, ...data } = params;

      // Call service
      const result = await AdsService.updateAd(id, data, adminId);

      // Return response
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error updating ad:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete an ad campaign (soft delete)
   * DELETE /api/admin/ads/:id
   *
   * Requirements: 9.7
   */
  static async deleteAd(req: Request, res: Response) {
    try {
      // Validate parameters
      const params = deleteAdSchema.parse({
        id: req.params.id,
      });

      // Get admin ID from authenticated user
      const adminId = (req as any).adminUser.id;

      // Call service
      const result = await AdsService.deleteAd(params.id, adminId);

      // Return response
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error deleting ad:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get performance metrics for an ad campaign
   * GET /api/admin/ads/:id/performance
   *
   * Requirements: 9.8
   */
  static async getAdPerformance(req: Request, res: Response) {
    try {
      // Validate parameters
      const params = getAdPerformanceSchema.parse({
        id: req.params.id,
      });

      // Call service
      const result = await AdsService.getAdPerformance(params.id);

      if (!result) {
        return res.status(404).json({ error: 'Ad campaign not found' });
      }

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      console.error('Error getting ad performance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate presigned URL for ad creative upload
   * POST /api/admin/ads/upload-url
   *
   * Requirements: 9.4, 9.12
   */
  static async generateUploadUrl(req: Request, res: Response) {
    try {
      // Validate request body
      const schema = z.object({
        fileName: z.string().min(1, 'File name is required'),
        mimeType: z.string().min(1, 'MIME type is required'),
      });

      const { fileName, mimeType } = schema.parse(req.body);

      // Call service
      const result = await AdsService.generateUploadUrl(fileName, mimeType);

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Error generating upload URL:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
