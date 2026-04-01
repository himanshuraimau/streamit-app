import type { Request, Response } from 'express';
import { z } from 'zod';
import { SettingsService } from '../services/settings.service';
import {
  updateSettingsSchema,
  createAdminSchema,
  updateAdminRoleSchema,
} from '../validations/settings.schema';

/**
 * Controller for platform settings and admin user management
 * Handles HTTP requests for system configuration and admin roles
 * 
 * Requirements: 17.2
 */
export class SettingsController {
  /**
   * Get all system settings organized by category
   * GET /api/admin/settings
   * 
   * Returns settings grouped by: general, moderation, monetization, streaming, compliance
   * 
   * Requirements: 12.1, 12.2
   */
  static async getSettings(req: Request, res: Response) {
    try {
      // Call service
      const settings = await SettingsService.getSettings();

      // Return response
      res.json(settings);
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get settings',
      });
    }
  }

  /**
   * Update system settings
   * PATCH /api/admin/settings
   * 
   * Body:
   * - updates: Array<{ key: string, value: string }>
   * 
   * Requirements: 12.3, 12.4, 12.5
   */
  static async updateSettings(req: Request, res: Response) {
    try {
      // Validate request body
      const data = updateSettingsSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const updatedSettings = await SettingsService.updateSettings(
        data.updates,
        adminId
      );

      // Return response
      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: updatedSettings,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      // Handle validation errors from service
      if (error instanceof Error && error.message.includes('Invalid')) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.message,
        });
      }

      console.error('Error updating settings:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update settings',
      });
    }
  }

  /**
   * List all admin users
   * GET /api/admin/settings/admins
   * 
   * Returns all users with admin roles
   * 
   * Requirements: 12.7
   */
  static async listAdmins(req: Request, res: Response) {
    try {
      // Call service
      const admins = await SettingsService.listAdmins();

      // Return response
      res.json({
        data: admins,
      });
    } catch (error) {
      console.error('Error listing admins:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list admin users',
      });
    }
  }

  /**
   * Create a new admin user
   * POST /api/admin/settings/admins
   * 
   * Body:
   * - name: string (required)
   * - email: string (required, valid email)
   * - password: string (required, min 8 chars)
   * - role: AdminRole (required)
   * 
   * Requirements: 12.8
   */
  static async createAdmin(req: Request, res: Response) {
    try {
      // Validate request body
      const data = createAdminSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const admin = await SettingsService.createAdmin(data, adminId);

      // Return response
      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: admin,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      // Handle validation errors from service
      if (error instanceof Error && error.message.includes('Invalid')) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.message,
        });
      }

      console.error('Error creating admin:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to create admin user',
      });
    }
  }

  /**
   * Update admin user role
   * PATCH /api/admin/settings/admins/:id/role
   * 
   * Body:
   * - role: AdminRole (required)
   * 
   * Requirements: 12.9
   */
  static async updateAdminRole(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'User ID is required',
        });
      }

      // Validate request body
      const data = updateAdminRoleSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const admin = await SettingsService.updateAdminRole(
        id,
        data.role,
        adminId
      );

      // Return response
      res.json({
        success: true,
        message: 'Admin role updated successfully',
        data: admin,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      // Handle validation errors from service
      if (error instanceof Error && error.message.includes('Invalid') || error instanceof Error && error.message.includes('not found')) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.message,
        });
      }

      console.error('Error updating admin role:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update admin role',
      });
    }
  }

  /**
   * Delete admin user (remove admin role)
   * DELETE /api/admin/settings/admins/:id
   * 
   * Removes admin role from user account
   * 
   * Requirements: 12.10
   */
  static async deleteAdmin(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'User ID is required',
        });
      }

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const result = await SettingsService.deleteAdmin(id, adminId);

      // Return response
      res.json({
        success: true,
        message: 'Admin user deleted successfully',
        data: result,
      });
    } catch (error) {
      // Handle validation errors from service
      if (error instanceof Error && (error.message.includes('Cannot delete') || error.message.includes('not found'))) {
        return res.status(400).json({
          error: 'Validation failed',
          message: error.message,
        });
      }

      console.error('Error deleting admin:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete admin user',
      });
    }
  }
}
