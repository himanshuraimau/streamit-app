import { z } from 'zod';

/**
 * Validation schemas for streaming operations
 */

// Create ingress request
export const createIngressSchema = z.object({
  ingressType: z.enum(['RTMP', 'WHIP']).default('RTMP'),
});

// Update stream info request
export const updateStreamInfoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  thumbnail: z.url('Invalid thumbnail URL').optional(),
});

// Update chat settings request
export const updateChatSettingsSchema = z.object({
  isChatEnabled: z.boolean().optional(),
  isChatDelayed: z.boolean().optional(),
  isChatFollowersOnly: z.boolean().optional(),
});

// Get viewer token request (for user routes - future)
export const getViewerTokenSchema = z.object({
  hostId: z.string().min(1, 'Host ID is required'),
  viewerId: z.string().optional(), // Optional for guest viewers
  guestName: z.string().min(1).max(50).optional(), // For anonymous guests
});

// Export types for TypeScript
export type CreateIngressRequest = z.infer<typeof createIngressSchema>;
export type UpdateStreamInfoRequest = z.infer<typeof updateStreamInfoSchema>;
export type UpdateChatSettingsRequest = z.infer<typeof updateChatSettingsSchema>;
export type GetViewerTokenRequest = z.infer<typeof getViewerTokenSchema>;
