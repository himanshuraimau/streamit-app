import { z } from 'zod';

/**
 * Validation schemas for advertisement management module
 *
 * Requirements: 17.5
 */

/**
 * Schema for creating a new ad campaign
 */
export const createAdSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  mediaUrl: z.string().url('Invalid media URL'),
  targetRegion: z
    .array(z.string().length(2, 'Region must be a 2-letter ISO country code'))
    .min(1, 'At least one target region is required'),
  targetGender: z.enum(['male', 'female', 'all']).optional(),
  category: z.string().optional(),
  cpm: z.number().positive('CPM must be a positive number').max(10000, 'CPM must not exceed 10000'),
  frequencyCap: z
    .number()
    .int('Frequency cap must be an integer')
    .positive('Frequency cap must be positive')
    .max(100, 'Frequency cap must not exceed 100'),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating an existing ad campaign
 */
export const updateAdSchema = z.object({
  id: z.string().cuid('Invalid ad ID format'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  mediaUrl: z.string().url('Invalid media URL').optional(),
  targetRegion: z
    .array(z.string().length(2, 'Region must be a 2-letter ISO country code'))
    .min(1, 'At least one target region is required')
    .optional(),
  targetGender: z.enum(['male', 'female', 'all']).optional(),
  category: z.string().optional(),
  cpm: z
    .number()
    .positive('CPM must be a positive number')
    .max(10000, 'CPM must not exceed 10000')
    .optional(),
  frequencyCap: z
    .number()
    .int('Frequency cap must be an integer')
    .positive('Frequency cap must be positive')
    .max(100, 'Frequency cap must not exceed 100')
    .optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schema for deleting an ad campaign
 */
export const deleteAdSchema = z.object({
  id: z.string().cuid('Invalid ad ID format'),
});

/**
 * Schema for getting ad performance
 */
export const getAdPerformanceSchema = z.object({
  id: z.string().cuid('Invalid ad ID format'),
});

/**
 * Schema for filtering ads
 */
export const listAdsSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  targetRegion: z.string().length(2, 'Region must be a 2-letter ISO country code').optional(),
  category: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'cpm', 'impressions']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
