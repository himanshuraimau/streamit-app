import { z } from 'zod';

/**
 * Schema for validating discount code requests
 * Requirements: 1.1
 */
export const validateCodeSchema = z.object({
  code: z.string().min(1, 'Discount code is required').transform((val) => val.toUpperCase()),
  packageId: z.string().min(1, 'Package ID is required'),
});

export type ValidateCodeInput = z.infer<typeof validateCodeSchema>;
