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

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type SendGiftInput = z.infer<typeof sendGiftSchema>;
export type SendPennyTipInput = z.infer<typeof sendPennyTipSchema>;
