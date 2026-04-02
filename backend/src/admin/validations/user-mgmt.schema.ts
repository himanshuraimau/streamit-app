import { z } from 'zod';

/**
 * Validation schema for listing users
 * Supports pagination, search, and filtering
 *
 * Requirements: 17.5, 17.12
 */
export const listUsersSchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),

  // Search
  search: z.string().optional(),

  // Filters
  role: z
    .enum([
      'USER',
      'CREATOR',
      'ADMIN',
      'SUPER_ADMIN',
      'MODERATOR',
      'FINANCE_ADMIN',
      'COMPLIANCE_OFFICER',
    ])
    .optional(),
  isSuspended: z.coerce.boolean().optional(),
  email: z.string().email().optional(),
  username: z.string().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),

  // Sorting
  sortBy: z.enum(['createdAt', 'lastLoginAt', 'username']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListUsersInput = z.infer<typeof listUsersSchema>;

/**
 * Validation schema for freezing a user account
 * Supports temporary suspension with optional expiration
 *
 * Requirements: 17.5, 17.12
 */
export const freezeUserSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters'),
  expiresAt: z.coerce.date().optional(),
  adminNotes: z.string().max(1000).optional(),
});

export type FreezeUserInput = z.infer<typeof freezeUserSchema>;

/**
 * Validation schema for banning a user account
 * Permanent suspension with required reason
 *
 * Requirements: 17.5, 17.12
 */
export const banUserSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters'),
  adminNotes: z.string().max(1000).optional(),
});

export type BanUserInput = z.infer<typeof banUserSchema>;

/**
 * Validation schema for disabling chat for a user
 * 24-hour chat restriction
 *
 * Requirements: 17.5
 */
export const disableChatSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters'),
  duration: z.coerce.number().int().positive().default(24), // Duration in hours
});

export type DisableChatInput = z.infer<typeof disableChatSchema>;

/**
 * Validation schema for resetting user password
 * Admin-initiated password reset
 *
 * Requirements: 17.5
 */
export const resetPasswordSchema = z.object({
  sendEmail: z.boolean().default(true),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
