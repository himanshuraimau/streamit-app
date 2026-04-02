import { prisma } from '../../lib/db';
import type { Prisma } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import type { PaginatedResponse } from './audit-log.service';
import { generateFileName, generatePresignedUploadUrl } from '../../lib/s3';

/**
 * Filters for ad listing queries
 */
export interface AdFilters {
  status?: 'active' | 'inactive';
  targetRegion?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'cpm' | 'impressions';
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
 * Ad campaign data for creation
 */
export interface CreateAdData {
  title: string;
  mediaUrl: string;
  targetRegion: string[];
  targetGender?: string;
  category?: string;
  cpm: number;
  frequencyCap: number;
  isActive?: boolean;
}

/**
 * Ad campaign data for update
 */
export interface UpdateAdData {
  title?: string;
  mediaUrl?: string;
  targetRegion?: string[];
  targetGender?: string;
  category?: string;
  cpm?: number;
  frequencyCap?: number;
  isActive?: boolean;
}

/**
 * Ad campaign entry with details
 */
export interface AdEntry {
  id: string;
  title: string;
  mediaUrl: string;
  targetRegion: string[];
  targetGender: string | null;
  category: string | null;
  cpm: number;
  frequencyCap: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ad performance metrics
 */
export interface AdPerformance {
  id: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: number; // Click-through rate (percentage)
  totalSpend: number;
  averageCpm: number;
}

/**
 * Service for managing advertisement campaigns
 * Handles ad creation, updates, deletion, and performance tracking
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */
export class AdsService {
  /**
   * List ad campaigns with filtering and pagination
   *
   * @param filters - Filter criteria for ads
   * @param pagination - Pagination parameters
   * @returns Paginated list of ad campaigns
   *
   * Requirements: 9.1, 9.2, 9.3
   */
  static async listAds(
    filters: AdFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<AdEntry>> {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.AdCreativeWhereInput = {};

    if (filters.status) {
      where.isActive = filters.status === 'active';
    }

    if (filters.targetRegion) {
      where.targetRegion = {
        has: filters.targetRegion,
      };
    }

    if (filters.category) {
      where.category = filters.category;
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

    // Build orderBy clause
    const orderBy: Prisma.AdCreativeOrderByWithRelationInput = {};
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    // Note: impressions sorting would require a separate AdStats table
    // For now, we only support createdAt and cpm sorting
    if (sortBy === 'createdAt' || sortBy === 'cpm') {
      orderBy[sortBy] = sortOrder;
    } else {
      // Default to createdAt if impressions is requested (not yet implemented)
      orderBy.createdAt = sortOrder;
    }

    // Execute query with pagination
    const [ads, totalCount] = await Promise.all([
      prisma.adCreative.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.adCreative.count({ where }),
    ]);

    // Transform results
    const data: AdEntry[] = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      mediaUrl: ad.mediaUrl,
      targetRegion: ad.targetRegion,
      targetGender: ad.targetGender,
      category: ad.category,
      cpm: ad.cpm,
      frequencyCap: ad.frequencyCap,
      isActive: ad.isActive,
      createdBy: ad.createdBy,
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt,
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
   * Create a new ad campaign
   *
   * @param data - Ad campaign data
   * @param adminId - ID of admin creating the ad
   * @returns Created ad campaign
   *
   * Requirements: 9.4
   */
  static async createAd(data: CreateAdData, adminId: string) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Create ad campaign
      const ad = await tx.adCreative.create({
        data: {
          title: data.title,
          mediaUrl: data.mediaUrl,
          targetRegion: data.targetRegion,
          targetGender: data.targetGender || null,
          category: data.category || null,
          cpm: data.cpm,
          frequencyCap: data.frequencyCap,
          isActive: data.isActive ?? true,
          createdBy: adminId,
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'ad_create', 'ad', ad.id, {
        title: ad.title,
        targetRegion: ad.targetRegion,
        cpm: ad.cpm,
      });

      return ad;
    });
  }

  /**
   * Update an existing ad campaign
   *
   * @param id - Ad campaign ID
   * @param data - Updated ad campaign data
   * @param adminId - ID of admin updating the ad
   * @returns Updated ad campaign
   *
   * Requirements: 9.5, 9.6
   */
  static async updateAd(id: string, data: UpdateAdData, adminId: string) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Check if ad exists
      const existingAd = await tx.adCreative.findUnique({
        where: { id },
      });

      if (!existingAd) {
        throw new Error('Ad campaign not found');
      }

      // Update ad campaign
      const ad = await tx.adCreative.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.mediaUrl !== undefined && { mediaUrl: data.mediaUrl }),
          ...(data.targetRegion !== undefined && { targetRegion: data.targetRegion }),
          ...(data.targetGender !== undefined && { targetGender: data.targetGender }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.cpm !== undefined && { cpm: data.cpm }),
          ...(data.frequencyCap !== undefined && { frequencyCap: data.frequencyCap }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'ad_update', 'ad', ad.id, {
        title: ad.title,
        changes: data,
      });

      return ad;
    });
  }

  /**
   * Delete an ad campaign (soft delete by setting isActive to false)
   *
   * @param id - Ad campaign ID
   * @param adminId - ID of admin deleting the ad
   * @returns Updated ad campaign
   *
   * Requirements: 9.7
   */
  static async deleteAd(id: string, adminId: string) {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Check if ad exists
      const existingAd = await tx.adCreative.findUnique({
        where: { id },
      });

      if (!existingAd) {
        throw new Error('Ad campaign not found');
      }

      // Soft delete by setting isActive to false
      const ad = await tx.adCreative.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'ad_delete', 'ad', ad.id, {
        title: ad.title,
      });

      return ad;
    });
  }

  /**
   * Get performance metrics for an ad campaign
   *
   * Note: This is a placeholder implementation. In a real system, you would:
   * 1. Create an AdStats table to track impressions and clicks
   * 2. Integrate with ad serving system to collect metrics
   * 3. Calculate CTR, total spend, and average CPM from actual data
   *
   * @param id - Ad campaign ID
   * @returns Ad performance metrics
   *
   * Requirements: 9.8
   */
  static async getAdPerformance(id: string): Promise<AdPerformance | null> {
    // Get ad campaign
    const ad = await prisma.adCreative.findUnique({
      where: { id },
    });

    if (!ad) {
      return null;
    }

    // TODO: In a real implementation, fetch actual metrics from AdStats table
    // For now, return placeholder data
    const impressions = 0;
    const clicks = 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const totalSpend = (impressions / 1000) * ad.cpm;
    const averageCpm = ad.cpm;

    return {
      id: ad.id,
      title: ad.title,
      impressions,
      clicks,
      ctr,
      totalSpend,
      averageCpm,
    };
  }

  /**
   * Generate presigned URL for ad creative upload
   *
   * @param fileName - Original file name
   * @param mimeType - MIME type of the file
   * @returns Presigned upload URL and final file URL
   *
   * Requirements: 9.4, 9.12
   */
  static async generateUploadUrl(
    fileName: string,
    mimeType: string
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    try {
      // Validate MIME type for ad creatives
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
      ];

      if (!allowedMimeTypes.includes(mimeType)) {
        throw new Error(
          'Invalid file type. Only JPEG, PNG, WebP, GIF, MP4, and WebM files are allowed for ad creatives.'
        );
      }

      // Generate unique file name with ads folder
      const uniqueFileName = generateFileName(fileName, 'AD_CREATIVE');

      // Generate presigned URL for upload (5 minutes expiry)
      const { uploadUrl, fileUrl } = await generatePresignedUploadUrl(
        uniqueFileName,
        mimeType,
        300
      );

      return { uploadUrl, fileUrl };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate upload URL');
    }
  }
}
