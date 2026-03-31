import { Router } from 'express';
import { AdsController } from '../controllers/ads.controller';

/**
 * Advertisement management routes
 * Handles ad campaign creation, updates, deletion, and performance tracking
 * 
 * Requirements: 17.4
 */
const router = Router();

/**
 * POST /api/admin/ads/upload-url
 * Generate presigned URL for ad creative upload
 * 
 * Body:
 * - fileName: Original file name (required)
 * - mimeType: MIME type of the file (required)
 * 
 * Returns:
 * - uploadUrl: Presigned URL for uploading the file
 * - fileUrl: Final S3 URL of the uploaded file
 */
router.post('/upload-url', AdsController.generateUploadUrl);

/**
 * GET /api/admin/ads
 * List ad campaigns with filtering and pagination
 * 
 * Query parameters:
 * - status: Filter by status (active, inactive)
 * - targetRegion: Filter by target region (2-letter ISO country code)
 * - category: Filter by category
 * - dateFrom: Filter by start date (ISO 8601)
 * - dateTo: Filter by end date (ISO 8601)
 * - sortBy: Sort field (createdAt, cpm, impressions) - default: createdAt
 * - sortOrder: Sort order (asc, desc) - default: desc
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 */
router.get('/', AdsController.listAds);

/**
 * POST /api/admin/ads
 * Create a new ad campaign
 * 
 * Body:
 * - title: Ad title (required, 3-200 characters)
 * - mediaUrl: S3 URL of the ad creative (required)
 * - targetRegion: Array of 2-letter ISO country codes (required, min 1)
 * - targetGender: Target gender (male, female, all) - optional
 * - category: Target category - optional
 * - cpm: Cost per thousand impressions (required, positive number, max 10000)
 * - frequencyCap: Max impressions per user per day (required, positive integer, max 100)
 * - isActive: Whether the ad is active (default: true)
 */
router.post('/', AdsController.createAd);

/**
 * PATCH /api/admin/ads/:id
 * Update an existing ad campaign
 * 
 * Path parameters:
 * - id: Ad campaign ID
 * 
 * Body (all fields optional):
 * - title: Ad title (3-200 characters)
 * - mediaUrl: S3 URL of the ad creative
 * - targetRegion: Array of 2-letter ISO country codes (min 1)
 * - targetGender: Target gender (male, female, all)
 * - category: Target category
 * - cpm: Cost per thousand impressions (positive number, max 10000)
 * - frequencyCap: Max impressions per user per day (positive integer, max 100)
 * - isActive: Whether the ad is active
 */
router.patch('/:id', AdsController.updateAd);

/**
 * DELETE /api/admin/ads/:id
 * Delete an ad campaign (soft delete by setting isActive to false)
 * 
 * Path parameters:
 * - id: Ad campaign ID
 */
router.delete('/:id', AdsController.deleteAd);

/**
 * GET /api/admin/ads/:id/performance
 * Get performance metrics for an ad campaign
 * 
 * Path parameters:
 * - id: Ad campaign ID
 * 
 * Returns:
 * - impressions: Total impressions
 * - clicks: Total clicks
 * - ctr: Click-through rate (percentage)
 * - totalSpend: Total spend in currency
 * - averageCpm: Average CPM
 */
router.get('/:id/performance', AdsController.getAdPerformance);

export default router;
