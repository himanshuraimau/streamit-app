import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

/**
 * Validation schemas for streamer management operations
 *
 * Requirements: 17.5, 17.12
 */

/**
 * Schema for listing creator applications
 * Supports pagination and filtering
 */
export const listApplicationsSchema = z.object({
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),

  // Filters
  search: z.preprocess((val) => (val === '' ? undefined : val), z.string().trim().min(1).max(120).optional()),
  status: z.nativeEnum(ApplicationStatus).optional(),
  submittedFrom: z.coerce.date().optional(),
  submittedTo: z.coerce.date().optional(),

  // Sorting
  sortBy: z.enum(['submittedAt', 'reviewedAt']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListApplicationsInput = z.infer<typeof listApplicationsSchema>;

/**
 * Schema for approving a creator application
 * No additional data required - approval is a simple state transition
 */
export const approveApplicationSchema = z.object({
  // No additional fields required for approval
});

export type ApproveApplicationInput = z.infer<typeof approveApplicationSchema>;

/**
 * Schema for rejecting a creator application
 * Requires a reason for rejection
 */
export const rejectApplicationSchema = z.object({
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must not exceed 500 characters'),
});

export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;

/**
 * Schema for adding an internal note to a creator application
 */
export const addApplicationNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(5, 'Note must be at least 5 characters')
    .max(2000, 'Note must not exceed 2000 characters'),
});

export type AddApplicationNoteInput = z.infer<typeof addApplicationNoteSchema>;

/**
 * Schema for sending a manual email to the application owner
 */
export const sendApplicationEmailSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(140, 'Subject must not exceed 140 characters'),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must not exceed 5000 characters'),
});

export type SendApplicationEmailInput = z.infer<typeof sendApplicationEmailSchema>;

/**
 * Schema for killing a live stream
 * Requires a reason for termination
 */
export const killStreamSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters'),
});

export type KillStreamInput = z.infer<typeof killStreamSchema>;

/**
 * Schema for warning a streamer
 * Requires a warning message
 */
export const warnStreamerSchema = z.object({
  message: z
    .string()
    .min(10, 'Warning message must be at least 10 characters')
    .max(500, 'Warning message must not exceed 500 characters'),
});

export type WarnStreamerInput = z.infer<typeof warnStreamerSchema>;

/**
 * Schema for suspending a streamer
 * Requires a reason for suspension
 */
export const suspendStreamerSchema = z.object({
  reason: z
    .string()
    .min(10, 'Suspension reason must be at least 10 characters')
    .max(500, 'Suspension reason must not exceed 500 characters'),
  expiresAt: z.coerce.date().optional(),
  adminNotes: z.string().max(1000).optional(),
});

export type SuspendStreamerInput = z.infer<typeof suspendStreamerSchema>;
