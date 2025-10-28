import { z } from 'zod';
import { IDType, ContentCategory } from '@prisma/client';

export const createApplicationSchema = z.object({
    identity: z.object({
        idType: z.enum(IDType),
        idDocumentUrl: z.url('Invalid document URL'),
        selfiePhotoUrl: z.url('Invalid selfie URL'),
    }),
    financial: z.object({
        accountHolderName: z.string().min(2, 'Account holder name must be at least 2 characters'),
        accountNumber: z.string().min(9, 'Account number must be at least 9 digits').max(18, 'Account number cannot exceed 18 digits'),
        ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
        panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
    }),
    profile: z.object({
        profilePictureUrl: z.url('Invalid profile picture URL'),
        categories: z.array(z.enum(ContentCategory)).min(1, 'Select at least one category').max(3, 'Maximum 3 categories allowed'),
        bio: z.string().min(50, 'Bio must be at least 50 characters').max(500, 'Bio cannot exceed 500 characters'),
    }),
});

export const updateApplicationSchema = z.object({
    identity: z.object({
        idType: z.enum(IDType),
        idDocumentUrl: z.url('Invalid document URL'),
        selfiePhotoUrl: z.url('Invalid selfie URL'),
    }).optional(),
    financial: z.object({
        accountHolderName: z.string().min(2, 'Account holder name must be at least 2 characters'),
        accountNumber: z.string().min(9, 'Account number must be at least 9 digits').max(18, 'Account number cannot exceed 18 digits'),
        ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
        panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
    }).optional(),
    profile: z.object({
        profilePictureUrl: z.url('Invalid profile picture URL'),
        categories: z.array(z.enum(ContentCategory)).min(1, 'Select at least one category').max(3, 'Maximum 3 categories allowed'),
        bio: z.string().min(50, 'Bio must be at least 50 characters').max(500, 'Bio cannot exceed 500 characters'),
    }).optional(),
});

export const saveDraftSchema = z.object({
    step: z.enum(['identity', 'financial', 'profile']),
    data: z.record(z.string(), z.any()),
});

export const identityDraftSchema = z.object({
    idType: z.enum(IDType).optional(),
    idDocumentUrl: z.url('Invalid document URL').optional(),
    selfiePhotoUrl: z.url('Invalid selfie URL').optional(),
});

export const financialDraftSchema = z.object({
    accountHolderName: z.string().min(2, 'Account holder name must be at least 2 characters').optional(),
    accountNumber: z.string().min(9, 'Account number must be at least 9 digits').max(18, 'Account number cannot exceed 18 digits').optional(),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format').optional(),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional(),
});

export const profileDraftSchema = z.object({
    profilePictureUrl: z.url('Invalid profile picture URL').optional(),
    categories: z.array(z.enum(ContentCategory)).min(1, 'Select at least one category').max(3, 'Maximum 3 categories allowed').optional(),
    bio: z.string().min(50, 'Bio must be at least 50 characters').max(500, 'Bio cannot exceed 500 characters').optional(),
});

export const fileUploadSchema = z.object({
    purpose: z.enum(['ID_DOCUMENT', 'SELFIE_PHOTO', 'PROFILE_PICTURE', 'OTHER']).optional(),
});

// Type exports for use in controllers
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
export type IdentityDraftInput = z.infer<typeof identityDraftSchema>;
export type FinancialDraftInput = z.infer<typeof financialDraftSchema>;
export type ProfileDraftInput = z.infer<typeof profileDraftSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;