import { z } from 'zod';

/**
 * Validation schema for updating system settings
 * Supports multiple setting updates in a single request
 *
 * Requirements: 17.5, 12.4, 12.5
 */
export const updateSettingsSchema = z.object({
  updates: z
    .array(
      z.object({
        key: z.string().min(1, 'Setting key is required'),
        value: z.string(), // Value is always stored as string, validation happens in service
      })
    )
    .min(1, 'At least one setting update is required'),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

/**
 * Validation schema for creating an admin user
 * Requires name, email, password, and role
 *
 * Requirements: 17.5, 12.8
 */
export const createAdminSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters'),
  role: z.enum(['SUPER_ADMIN', 'MODERATOR', 'ADMIN', 'FINANCE_ADMIN', 'COMPLIANCE_OFFICER'], {
    errorMap: () => ({ message: 'Invalid admin role' }),
  }),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

/**
 * Validation schema for updating admin role
 * Only allows valid admin roles
 *
 * Requirements: 17.5, 12.9
 */
export const updateAdminRoleSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'MODERATOR', 'ADMIN', 'FINANCE_ADMIN', 'COMPLIANCE_OFFICER'], {
    errorMap: () => ({ message: 'Invalid admin role' }),
  }),
});

export type UpdateAdminRoleInput = z.infer<typeof updateAdminRoleSchema>;

/**
 * Helper function to validate setting value based on type
 * Used for runtime validation of specific setting types
 *
 * Requirements: 12.4, 12.5
 */
export function validateSettingType(key: string, value: string): boolean {
  // Boolean settings
  if (key.endsWith('_enabled') || key.endsWith('_active')) {
    return value === 'true' || value === 'false';
  }

  // Number settings
  if (
    key.includes('_amount') ||
    key.includes('_percentage') ||
    key.includes('_duration') ||
    key.includes('_threshold') ||
    key.includes('_count') ||
    key.includes('_limit')
  ) {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  }

  // JSON settings
  if (key.endsWith('_json') || key.includes('.json.')) {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  // String settings (default)
  return typeof value === 'string';
}

/**
 * Validation schema for specific setting constraints
 * Defines min/max values and enum options for known settings
 *
 * Requirements: 12.4, 12.5
 */
export const settingConstraints: Record<string, z.ZodType> = {
  'monetization.minimum_withdrawal_amount': z.coerce.number().positive(),
  'monetization.platform_fee_percentage': z.coerce.number().min(0).max(100),
  'streaming.maximum_stream_duration': z.coerce.number().int().positive(),
  'moderation.content_flag_threshold': z.coerce.number().int().positive(),
  'moderation.auto_ban_strike_count': z.coerce.number().int().positive(),
  'general.maintenance_mode': z.enum(['true', 'false']),
  'general.registration_enabled': z.enum(['true', 'false']),
  'compliance.data_retention_days': z.coerce.number().int().positive(),
};

/**
 * Validate a single setting update
 * Checks both type and constraint validation
 *
 * @param key - Setting key
 * @param value - Setting value
 * @returns Validation result
 */
export function validateSetting(key: string, value: string): { valid: boolean; error?: string } {
  // Check type validation
  if (!validateSettingType(key, value)) {
    return {
      valid: false,
      error: `Invalid type for setting ${key}`,
    };
  }

  // Check constraint validation if defined
  const constraint = settingConstraints[key];
  if (constraint) {
    const result = constraint.safeParse(value);
    if (!result.success) {
      return {
        valid: false,
        error: `Invalid value for setting ${key}: ${result.error.message}`,
      };
    }
  }

  return { valid: true };
}
