import { prisma } from '../../lib/db';
import type { UserRole } from '@prisma/client';
import { AuditLogService } from './audit-log.service';
import { hash } from '@node-rs/argon2';

/**
 * Settings organized by category
 */
export interface SettingsByCategory {
  general: SystemSettingItem[];
  moderation: SystemSettingItem[];
  monetization: SystemSettingItem[];
  streaming: SystemSettingItem[];
  compliance: SystemSettingItem[];
}

/**
 * System setting item
 */
export interface SystemSettingItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isPublic: boolean;
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * Setting update input
 */
export interface SettingUpdate {
  key: string;
  value: string;
}

/**
 * Admin user item
 */
export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

/**
 * Create admin input
 */
export interface CreateAdminInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * Service for managing platform settings and admin users
 * Handles system configuration and admin role management
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10
 */
export class SettingsService {
  /**
   * Get all system settings organized by category
   *
   * @returns Settings grouped by category
   *
   * Requirements: 12.1, 12.2
   */
  static async getSettings(): Promise<SettingsByCategory> {
    const settings = await prisma.systemSetting.findMany({
      orderBy: {
        key: 'asc',
      },
    });

    // Organize settings by category based on key prefix
    const categorized: SettingsByCategory = {
      general: [],
      moderation: [],
      monetization: [],
      streaming: [],
      compliance: [],
    };

    for (const setting of settings) {
      if (setting.key.startsWith('general.')) {
        categorized.general.push(setting);
      } else if (setting.key.startsWith('moderation.')) {
        categorized.moderation.push(setting);
      } else if (setting.key.startsWith('monetization.')) {
        categorized.monetization.push(setting);
      } else if (setting.key.startsWith('streaming.')) {
        categorized.streaming.push(setting);
      } else if (setting.key.startsWith('compliance.')) {
        categorized.compliance.push(setting);
      } else {
        // Default to general if no prefix matches
        categorized.general.push(setting);
      }
    }

    return categorized;
  }

  /**
   * Update system settings
   * Validates setting values and updates records
   *
   * @param updates - Array of setting updates
   * @param adminId - ID of admin performing the action
   * @returns Updated settings
   *
   * Requirements: 12.3, 12.4, 12.5
   */
  static async updateSettings(
    updates: SettingUpdate[],
    adminId: string
  ): Promise<SystemSettingItem[]> {
    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      const updatedSettings: SystemSettingItem[] = [];

      for (const update of updates) {
        // Validate setting value based on key
        this.validateSettingValue(update.key, update.value);

        // Update or create setting
        const setting = await tx.systemSetting.upsert({
          where: { key: update.key },
          update: {
            value: update.value,
            updatedBy: adminId,
          },
          create: {
            id: crypto.randomUUID(),
            key: update.key,
            value: update.value,
            updatedBy: adminId,
          },
        });

        updatedSettings.push(setting);

        // Create audit log entry
        await AuditLogService.createLog(adminId, 'settings_update', 'system_setting', setting.id, {
          key: update.key,
          oldValue: null, // Could fetch old value if needed
          newValue: update.value,
        });
      }

      return updatedSettings;
    });
  }

  /**
   * Validate setting value based on key and type
   * Throws error if validation fails
   *
   * @param key - Setting key
   * @param value - Setting value
   *
   * Requirements: 12.4, 12.5
   */
  private static validateSettingValue(key: string, value: string): void {
    // Define validation rules for specific settings
    const validations: Record<string, (val: string) => boolean> = {
      'monetization.minimum_withdrawal_amount': (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      'monetization.platform_fee_percentage': (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 100;
      },
      'streaming.maximum_stream_duration': (val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num > 0;
      },
      'moderation.content_flag_threshold': (val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num > 0;
      },
      'moderation.auto_ban_strike_count': (val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num > 0;
      },
    };

    // Check if validation rule exists for this key
    const validator = validations[key];
    if (validator && !validator(value)) {
      throw new Error(`Invalid value for setting ${key}: ${value}`);
    }

    // For JSON type settings, validate JSON format
    if (key.endsWith('_json') || key.includes('.json.')) {
      try {
        JSON.parse(value);
      } catch (error) {
        throw new Error(`Invalid JSON value for setting ${key}`);
      }
    }
  }

  /**
   * List all admin users
   *
   * @returns Array of admin users
   *
   * Requirements: 12.7
   */
  static async listAdmins(): Promise<AdminUserItem[]> {
    const admins = await prisma.user.findMany({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'MODERATOR', 'ADMIN', 'FINANCE_ADMIN', 'COMPLIANCE_OFFICER'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform role format from SUPER_ADMIN to super_admin for frontend
    return admins.map((admin) => ({
      ...admin,
      role: admin.role.toLowerCase() as any,
    }));
  }

  /**
   * Create a new admin user
   *
   * @param data - Admin user data
   * @param adminId - ID of admin performing the action
   * @returns Created admin user
   *
   * Requirements: 12.8
   */
  static async createAdmin(data: CreateAdminInput, adminId: string): Promise<AdminUserItem> {
    // Validate role is an admin role
    const adminRoles: UserRole[] = [
      'SUPER_ADMIN',
      'MODERATOR',
      'ADMIN',
      'FINANCE_ADMIN',
      'COMPLIANCE_OFFICER',
    ];

    if (!adminRoles.includes(data.role)) {
      throw new Error(`Invalid admin role: ${data.role}`);
    }

    // Hash password
    const hashedPassword = await hash(data.password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          id: crypto.randomUUID(),
          name: data.name,
          email: data.email,
          username: data.email.split('@')[0], // Generate username from email
          role: data.role,
          emailVerified: new Date(), // Auto-verify admin accounts
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Create account in Better Auth accounts table
      await tx.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          accountId: user.id,
          providerId: 'credential',
          password: hashedPassword,
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'admin_create', 'user', user.id, {
        email: data.email,
        role: data.role,
      });

      return user;
    });
  }

  /**
   * Update admin user role
   *
   * @param id - User ID
   * @param role - New role
   * @param adminId - ID of admin performing the action
   * @returns Updated admin user
   *
   * Requirements: 12.9
   */
  static async updateAdminRole(
    id: string,
    role: UserRole,
    adminId: string
  ): Promise<AdminUserItem> {
    // Validate role is an admin role
    const adminRoles: UserRole[] = [
      'SUPER_ADMIN',
      'MODERATOR',
      'ADMIN',
      'FINANCE_ADMIN',
      'COMPLIANCE_OFFICER',
    ];

    if (!adminRoles.includes(role)) {
      throw new Error(`Invalid admin role: ${role}`);
    }

    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get old role for audit log
      const oldUser = await tx.user.findUnique({
        where: { id },
        select: { role: true },
      });

      if (!oldUser) {
        throw new Error(`User not found: ${id}`);
      }

      // Update user role
      const user = await tx.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'role_change', 'user', id, {
        oldRole: oldUser.role,
        newRole: role,
      });

      return user;
    });
  }

  /**
   * Delete admin user (remove admin role or delete account)
   *
   * @param id - User ID
   * @param adminId - ID of admin performing the action
   * @returns Deleted user info
   *
   * Requirements: 12.10
   */
  static async deleteAdmin(id: string, adminId: string): Promise<{ id: string; email: string }> {
    // Prevent self-deletion
    if (id === adminId) {
      throw new Error('Cannot delete your own admin account');
    }

    // Use transaction to ensure atomicity
    return await prisma.$transaction(async (tx) => {
      // Get user info for audit log
      const user = await tx.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        throw new Error(`User not found: ${id}`);
      }

      // Option 1: Remove admin role (downgrade to USER)
      // This is safer as it preserves the account
      await tx.user.update({
        where: { id },
        data: {
          role: 'USER',
        },
      });

      // Create audit log entry
      await AuditLogService.createLog(adminId, 'admin_delete', 'user', id, {
        email: user.email,
        oldRole: user.role,
        action: 'role_removed',
      });

      return {
        id: user.id,
        email: user.email,
      };
    });
  }
}
