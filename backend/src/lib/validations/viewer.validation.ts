import { z } from 'zod';

// Update profile validation
export const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
});

// Change password validation
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

// Avatar upload validation
export const avatarUploadSchema = z.object({
    purpose: z.literal('AVATAR'),
});

// Type exports
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;
