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
  description: z.string().max(1000, 'Description is too long').optional(),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
  category: z.string().trim().max(80, 'Category is too long').optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10, 'Too many tags').optional(),
  audience: z.enum(['PUBLIC', 'FOLLOWERS', 'INVITE_ONLY']).optional(),
  allowGifts: z.boolean().optional(),
  allowAds: z.boolean().optional(),
  allowPayPerView: z.boolean().optional(),
  cameraFacingMode: z.enum(['FRONT', 'BACK']).optional(),
  audioOnlyMode: z.boolean().optional(),
  filterPreset: z.enum(['NONE', 'WARM', 'COOL', 'NOIR', 'POP']).optional(),
  musicPreset: z.enum(['NONE', 'AMBIENT', 'HYPE', 'LOFI', 'ACOUSTIC']).optional(),
});

// Create stream with metadata (NEW FLOW)
export const createStreamSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
  category: z.string().trim().max(80, 'Category is too long').optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10, 'Too many tags').optional(),
  audience: z.enum(['PUBLIC', 'FOLLOWERS', 'INVITE_ONLY']).optional(),
  allowGifts: z.boolean().optional(),
  allowAds: z.boolean().optional(),
  allowPayPerView: z.boolean().optional(),
  cameraFacingMode: z.enum(['FRONT', 'BACK']).optional(),
  audioOnlyMode: z.boolean().optional(),
  filterPreset: z.enum(['NONE', 'WARM', 'COOL', 'NOIR', 'POP']).optional(),
  musicPreset: z.enum(['NONE', 'AMBIENT', 'HYPE', 'LOFI', 'ACOUSTIC']).optional(),
  chatSettings: z
    .object({
      isChatEnabled: z.boolean().optional(),
      isChatDelayed: z.boolean().optional(),
      isChatFollowersOnly: z.boolean().optional(),
    })
    .optional(),
  streamMethod: z.enum(['browser', 'obs']).default('obs'),
});

// Setup stream for WebRTC (simplified flow)
export const setupStreamSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
  category: z.string().trim().max(80, 'Category is too long').optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10, 'Too many tags').optional(),
  audience: z.enum(['PUBLIC', 'FOLLOWERS', 'INVITE_ONLY']).optional(),
  allowGifts: z.boolean().optional(),
  allowAds: z.boolean().optional(),
  allowPayPerView: z.boolean().optional(),
  cameraFacingMode: z.enum(['FRONT', 'BACK']).optional(),
  audioOnlyMode: z.boolean().optional(),
  filterPreset: z.enum(['NONE', 'WARM', 'COOL', 'NOIR', 'POP']).optional(),
  musicPreset: z.enum(['NONE', 'AMBIENT', 'HYPE', 'LOFI', 'ACOUSTIC']).optional(),
  isChatEnabled: z.boolean().optional(),
  isChatDelayed: z.boolean().optional(),
  isChatFollowersOnly: z.boolean().optional(),
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

// Stream report request
export const reportStreamSchema = z.object({
  streamId: z.string().min(1, 'Stream ID is required'),
  reason: z.enum(
    ['INAPPROPRIATE_CONTENT', 'HARASSMENT', 'SPAM', 'VIOLENCE', 'COPYRIGHT', 'OTHER'],
    { message: 'Invalid report reason' }
  ),
  description: z.string().max(1000, 'Description is too long').optional(),
});

// Export types for TypeScript
export type CreateIngressRequest = z.infer<typeof createIngressSchema>;
export type CreateStreamRequest = z.infer<typeof createStreamSchema>;
export type SetupStreamRequest = z.infer<typeof setupStreamSchema>;
export type UpdateStreamInfoRequest = z.infer<typeof updateStreamInfoSchema>;
export type UpdateChatSettingsRequest = z.infer<typeof updateChatSettingsSchema>;
export type GetViewerTokenRequest = z.infer<typeof getViewerTokenSchema>;
export type ReportStreamRequest = z.infer<typeof reportStreamSchema>;
