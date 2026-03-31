import { z } from 'zod';

/**
 * Validation schema for listing reports
 * Supports pagination, filtering, and sorting
 * 
 * Requirements: 17.5
 */
export const listReportsSchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),

  // Filters
  reason: z.enum(['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'NUDITY', 'VIOLENCE', 'COPYRIGHT', 'MISINFORMATION', 'SELF_HARM', 'OTHER']).optional(),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']).optional(),
  reporterId: z.string().optional(),
  reportedUserId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),

  // Sorting
  sortBy: z.enum(['createdAt', 'priority', 'reportCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListReportsInput = z.infer<typeof listReportsSchema>;

/**
 * Validation schema for resolving a report
 * Requires action and optional admin notes
 * 
 * Requirements: 17.5
 */
export const resolveReportSchema = z.object({
  action: z.enum(['dismiss', 'warning_sent', 'content_removed', 'user_suspended', 'user_banned']),
  notes: z.string().min(10, 'Notes must be at least 10 characters').max(1000, 'Notes must not exceed 1000 characters'),
});

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
