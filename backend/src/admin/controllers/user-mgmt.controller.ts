import type { Request, Response } from 'express';
import { z } from 'zod';
import { UserMgmtService } from '../services/user-mgmt.service';
import {
  listUsersSchema,
  freezeUserSchema,
  banUserSchema,
  disableChatSchema,
  resetPasswordSchema,
} from '../validations/user-mgmt.schema';

/**
 * Controller for user management operations
 * Handles HTTP requests for user listing, viewing, and admin actions
 * 
 * Requirements: 17.2, 17.11, 17.12, 17.13
 */
export class UserMgmtController {
  /**
   * List users with filtering, search, and pagination
   * GET /api/admin/users
   * 
   * Query parameters:
   * - page: number (default: 1)
   * - pageSize: number (default: 20, max: 100)
   * - search: string (optional)
   * - role: UserRole (optional)
   * - isSuspended: boolean (optional)
   * - email: string (optional)
   * - username: string (optional)
   * - createdFrom: date (optional)
   * - createdTo: date (optional)
   * - sortBy: 'createdAt' | 'lastLoginAt' | 'username' (default: 'createdAt')
   * - sortOrder: 'asc' | 'desc' (default: 'desc')
   * 
   * Requirements: 4.1, 4.2, 4.3
   */
  static async listUsers(req: Request, res: Response) {
    try {
      // Validate query parameters
      const params = listUsersSchema.parse(req.query);

      // Extract pagination and filters
      const pagination = {
        page: params.page,
        pageSize: params.pageSize,
      };

      const filters = {
        search: params.search,
        role: params.role,
        isSuspended: params.isSuspended,
        email: params.email,
        username: params.username,
        createdFrom: params.createdFrom,
        createdTo: params.createdTo,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      };

      // Call service
      const result = await UserMgmtService.listUsers(filters, pagination);

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error listing users:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list users',
      });
    }
  }

  /**
   * Get user details by ID
   * GET /api/admin/users/:id
   * 
   * Returns complete user details including wallet and ban history
   * 
   * Requirements: 4.4
   */
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'User ID is required',
        });
      }

      // Call service
      const user = await UserMgmtService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          error: 'Not found',
          message: 'User not found',
        });
      }

      // Return response
      res.json(user);
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get user details',
      });
    }
  }

  /**
   * Freeze user account (temporary suspension)
   * PATCH /api/admin/users/:id/freeze
   * 
   * Body:
   * - reason: string (required, min 10 chars)
   * - expiresAt: date (optional, null = permanent)
   * - adminNotes: string (optional)
   * 
   * Requirements: 4.5, 4.6
   */
  static async freezeUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'User ID is required',
        });
      }

      // Validate request body
      const data = freezeUserSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const user = await UserMgmtService.freezeUser(
        id,
        data.reason,
        data.expiresAt || null,
        adminId,
        data.adminNotes
      );

      // Return response
      res.json({
        success: true,
        message: 'User account frozen successfully',
        data: {
          id: user.id,
          isSuspended: user.isSuspended,
          suspendedReason: user.suspendedReason,
          suspensionExpiresAt: user.suspensionExpiresAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error freezing user:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to freeze user account',
      });
    }
  }

  /**
   * Ban user account (permanent suspension)
   * PATCH /api/admin/users/:id/ban
   * 
   * Body:
   * - reason: string (required, min 10 chars)
   * - adminNotes: string (optional)
   * 
   * Requirements: 4.7
   */
  static async banUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'User ID is required',
        });
      }

      // Validate request body
      const data = banUserSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const user = await UserMgmtService.banUser(
        id,
        data.reason,
        adminId,
        data.adminNotes
      );

      // Return response
      res.json({
        success: true,
        message: 'User account banned successfully',
        data: {
          id: user.id,
          isSuspended: user.isSuspended,
          suspendedReason: user.suspendedReason,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error banning user:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to ban user account',
      });
    }
  }

  /**
   * Disable chat for user (24-hour restriction)
   * PATCH /api/admin/users/:id/chat-disable
   * 
   * Body:
   * - reason: string (required, min 10 chars)
   * - duration: number (optional, default 24 hours)
   * 
   * Requirements: 4.8
   */
  static async disableChat(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'User ID is required',
        });
      }

      // Validate request body
      const data = disableChatSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const user = await UserMgmtService.disableChat(
        id,
        data.duration,
        data.reason,
        adminId
      );

      // Return response
      res.json({
        success: true,
        message: `Chat disabled for ${data.duration} hours`,
        data: {
          id: user.id,
          duration: data.duration,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error disabling chat:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to disable chat',
      });
    }
  }

  /**
   * Reset user password (admin-initiated)
   * POST /api/admin/users/:id/reset-password
   * 
   * Body:
   * - sendEmail: boolean (optional, default true)
   * 
   * Requirements: 4.9
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'User ID is required',
        });
      }

      // Validate request body
      const data = resetPasswordSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const result = await UserMgmtService.resetPassword(id, adminId);

      // Return response
      res.json({
        success: true,
        message: 'Password reset token generated successfully',
        data: {
          token: result.token,
          expiresAt: result.expiresAt,
          emailSent: data.sendEmail,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error resetting password:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to reset password',
      });
    }
  }

  /**
   * Unfreeze user account
   * PATCH /api/admin/users/:id/unfreeze
   * 
   * Removes suspension from user account
   */
  static async unfreezeUser(req: Request, res: Response) {
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
      const user = await UserMgmtService.unfreezeUser(id, adminId);

      // Return response
      res.json({
        success: true,
        message: 'User account unfrozen successfully',
        data: {
          id: user.id,
          isSuspended: user.isSuspended,
        },
      });
    } catch (error) {
      console.error('Error unfreezing user:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to unfreeze user account',
      });
    }
  }
}
