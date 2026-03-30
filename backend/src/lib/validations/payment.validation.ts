import { z } from 'zod';

export const createPurchaseSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
  discountCode: z.string().optional(),
});

export const sendGiftSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  giftId: z.string().min(1, 'Gift ID is required'),
  streamId: z.string().optional(),
  message: z.string().max(200).optional(),
});

export const sendPennyTipSchema = z.object({
  creatorId: z.string().min(1, 'Creator ID is required'),
  streamId: z.string().min(1, 'Stream ID is required'),
});

export const createWithdrawalRequestSchema = z.object({
  amountCoins: z
    .number()
    .int('amountCoins must be an integer')
    .min(1, 'amountCoins must be at least 1'),
  reason: z.string().trim().max(500, 'reason cannot exceed 500 characters').optional(),
});

export const withdrawalHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type SendGiftInput = z.infer<typeof sendGiftSchema>;
export type SendPennyTipInput = z.infer<typeof sendPennyTipSchema>;
export type CreateWithdrawalRequestInput = z.infer<typeof createWithdrawalRequestSchema>;
export type WithdrawalHistoryQueryInput = z.infer<typeof withdrawalHistoryQuerySchema>;
