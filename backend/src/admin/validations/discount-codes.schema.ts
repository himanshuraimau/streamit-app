import { z } from 'zod';

const optionalText = () =>
  z.preprocess((value) => {
    if (value === '') return undefined;
    return value;
  }, z.string().optional());

const nullablePositiveInteger = () =>
  z.preprocess((value) => {
    if (value === '' || value === undefined) return undefined;
    if (value === null) return null;
    return Number(value);
  }, z.number().int().positive().nullable().optional());

const nullableDateString = () =>
  z.preprocess((value) => {
    if (value === '' || value === undefined) return undefined;
    if (value === null) return null;
    return value;
  }, z.string().datetime().nullable().optional());

export const listDiscountCodesSchema = z.object({
  search: optionalText(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'MAXED_OUT']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const getDiscountCodeSchema = z.object({
  id: z.string().cuid('Invalid discount code ID format'),
});

export const createDiscountCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Code must be at least 3 characters')
      .max(50, 'Code must not exceed 50 characters')
      .regex(/^[A-Za-z0-9_-]+$/, 'Code may only contain letters, numbers, hyphens, and underscores')
      .transform((value) => value.toUpperCase()),
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.coerce.number().int().positive('Discount value must be a positive integer'),
    codeType: z.enum(['PROMOTIONAL', 'REWARD']).optional(),
    maxRedemptions: nullablePositiveInteger(),
    isOneTimeUse: z.boolean().default(false),
    minPurchaseAmount: nullablePositiveInteger(),
    expiresAt: nullableDateString(),
    isActive: z.boolean().default(true),
    description: z.preprocess(
      (value) => (value === '' ? undefined : value),
      z.string().max(500, 'Description must not exceed 500 characters').optional()
    ),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage discount cannot exceed 100',
        path: ['discountValue'],
      });
    }
  });

export const updateDiscountCodeSchema = z.object({
  id: z.string().cuid('Invalid discount code ID format'),
  code: z
    .string()
    .trim()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must not exceed 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code may only contain letters, numbers, hyphens, and underscores')
    .transform((value) => value.toUpperCase())
    .optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.coerce
    .number()
    .int()
    .positive('Discount value must be a positive integer')
    .optional(),
  codeType: z.enum(['PROMOTIONAL', 'REWARD']).optional(),
  maxRedemptions: nullablePositiveInteger(),
  isOneTimeUse: z.boolean().optional(),
  minPurchaseAmount: nullablePositiveInteger(),
  expiresAt: nullableDateString(),
  isActive: z.boolean().optional(),
  description: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().max(500, 'Description must not exceed 500 characters').optional()
  ),
});

export const deleteDiscountCodeSchema = z.object({
  id: z.string().cuid('Invalid discount code ID format'),
});

export type ListDiscountCodesInput = z.infer<typeof listDiscountCodesSchema>;
export type CreateDiscountCodeInput = z.infer<typeof createDiscountCodeSchema>;
export type UpdateDiscountCodeInput = z.infer<typeof updateDiscountCodeSchema>;
