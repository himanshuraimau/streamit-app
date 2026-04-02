import { z } from 'zod';

/**
 * Validation schemas for monetization module
 *
 * Requirements: 17.5
 */

/**
 * Schema for approving a withdrawal request
 */
export const approveWithdrawalSchema = z.object({
  id: z.string().cuid('Invalid withdrawal ID format'),
});

/**
 * Schema for rejecting a withdrawal request
 */
export const rejectWithdrawalSchema = z.object({
  id: z.string().cuid('Invalid withdrawal ID format'),
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must not exceed 500 characters'),
});

/**
 * Schema for filtering coin ledger
 */
export const ledgerFiltersSchema = z.object({
  userId: z.preprocess((val) => (val === '' ? undefined : val), z.string().cuid().optional()),
  dateFrom: z.preprocess((val) => (val === '' ? undefined : val), z.string().datetime().optional()),
  dateTo: z.preprocess((val) => (val === '' ? undefined : val), z.string().datetime().optional()),
  status: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional()
  ),
  amountMin: z.coerce.number().int().positive().optional(),
  amountMax: z.coerce.number().int().positive().optional(),
  paymentGateway: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Schema for filtering withdrawals
 */
export const withdrawalFiltersSchema = z.object({
  status: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.enum(['PENDING', 'UNDER_REVIEW', 'ON_HOLD', 'APPROVED', 'REJECTED', 'PAID']).optional()
  ),
  userId: z.preprocess((val) => (val === '' ? undefined : val), z.string().cuid().optional()),
  dateFrom: z.preprocess((val) => (val === '' ? undefined : val), z.string().datetime().optional()),
  dateTo: z.preprocess((val) => (val === '' ? undefined : val), z.string().datetime().optional()),
  amountMin: z.coerce.number().int().positive().optional(),
  amountMax: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Schema for filtering gift transactions
 */
export const giftFiltersSchema = z.object({
  dateFrom: z.preprocess((val) => (val === '' ? undefined : val), z.string().datetime().optional()),
  dateTo: z.preprocess((val) => (val === '' ? undefined : val), z.string().datetime().optional()),
  amountMin: z.coerce.number().int().positive().optional(),
  amountMax: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * Schema for wallet details request
 */
export const walletDetailsSchema = z.object({
  userId: z.string().cuid('Invalid user ID format'),
});
