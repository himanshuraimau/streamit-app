import type { Request, Response } from 'express';
import { z } from 'zod';
import { StreamerMgmtService } from '../services/streamer-mgmt.service';
import {
  listApplicationsSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
  killStreamSchema,
  warnStreamerSchema,
  suspendStreamerSchema,
} from '../validations/streamer-mgmt.schema';

/**
 * Controller for streamer management operations
 * Handles HTTP requests for creator applications and live stream control
 *
 * Requirements: 17.2, 17.11, 17.12, 17.13
 */
export class StreamerMgmtController {
  /**
   * List creator applications with filtering and pagination
   * GET /api/admin/streamers/applications
   *
   * Query parameters:
   * - page: number (default: 1)
   * - pageSize: number (default: 20, max: 100)
   * - status: ApplicationStatus (optional)
   * - submittedFrom: date (optional)
   * - submittedTo: date (optional)
   * - sortBy: 'submittedAt' | 'reviewedAt' (default: 'submittedAt')
   * - sortOrder: 'asc' | 'desc' (default: 'desc')
   *
   * Requirements: 5.1
   */
  static async listApplications(req: Request, res: Response) {
    try {
      // Validate query parameters
      const params = listApplicationsSchema.parse(req.query);

      // Extract pagination and filters
      const pagination = {
        page: params.page,
        pageSize: params.pageSize,
      };

      const filters = {
        status: params.status,
        submittedFrom: params.submittedFrom,
        submittedTo: params.submittedTo,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      };

      // Call service
      const result = await StreamerMgmtService.listApplications(filters, pagination);

      // Return response
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      console.error('Error listing applications:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list applications',
      });
    }
  }

  /**
   * Get application details by ID
   * GET /api/admin/streamers/applications/:id
   *
   * Returns complete application details including documents
   *
   * Requirements: 5.2
   */
  static async getApplicationById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Application ID is required',
        });
      }

      // Call service
      const application = await StreamerMgmtService.getApplicationById(id);

      if (!application) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Application not found',
        });
      }

      // Return response
      res.json(application);
    } catch (error) {
      console.error('Error getting application:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get application details',
      });
    }
  }

  /**
   * Approve a creator application
   * PATCH /api/admin/streamers/applications/:id/approve
   *
   * Updates application status to APPROVED and upgrades user role to CREATOR
   *
   * Requirements: 5.3
   */
  static async approveApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Application ID is required',
        });
      }

      // Validate request body (empty schema, but validates structure)
      approveApplicationSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const application = await StreamerMgmtService.approveApplication(id, adminId);

      // Return response
      res.json({
        success: true,
        message: 'Application approved successfully',
        data: {
          id: application.id,
          status: application.status,
          reviewedAt: application.reviewedAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      if (error instanceof Error && error.message === 'Application not found') {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      console.error('Error approving application:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to approve application',
      });
    }
  }

  /**
   * Reject a creator application
   * PATCH /api/admin/streamers/applications/:id/reject
   *
   * Body:
   * - reason: string (required, min 10 chars)
   *
   * Requirements: 5.4
   */
  static async rejectApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Application ID is required',
        });
      }

      // Validate request body
      const data = rejectApplicationSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const application = await StreamerMgmtService.rejectApplication(id, data.reason, adminId);

      // Return response
      res.json({
        success: true,
        message: 'Application rejected successfully',
        data: {
          id: application.id,
          status: application.status,
          reviewedAt: application.reviewedAt,
          rejectionReason: application.rejectionReason,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      if (error instanceof Error && error.message === 'Application not found') {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      console.error('Error rejecting application:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to reject application',
      });
    }
  }

  /**
   * List all currently active live streams
   * GET /api/admin/streamers/live
   *
   * Returns all streams with isLive=true
   *
   * Requirements: 5.5, 5.6
   */
  static async listLiveStreams(_req: Request, res: Response) {
    try {
      // Call service
      const streams = await StreamerMgmtService.listLiveStreams();

      // Return response
      res.json({
        data: streams,
        count: streams.length,
      });
    } catch (error) {
      console.error('Error listing live streams:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list live streams',
      });
    }
  }

  /**
   * Kill a live stream
   * POST /api/admin/streamers/:id/kill-stream
   *
   * Body:
   * - reason: string (required, min 10 chars)
   *
   * Requirements: 5.7
   */
  static async killStream(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Stream ID is required',
        });
      }

      // Validate request body
      const data = killStreamSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const stream = await StreamerMgmtService.killStream(id, data.reason, adminId);

      // Return response
      res.json({
        success: true,
        message: 'Stream terminated successfully',
        data: {
          id: stream.id,
          isLive: stream.isLive,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      if (error instanceof Error && error.message === 'Stream not found') {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      console.error('Error killing stream:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to terminate stream',
      });
    }
  }

  /**
   * Mute a streamer's audio
   * POST /api/admin/streamers/:id/mute
   *
   * Requirements: 5.8
   */
  static async muteStreamer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Stream ID is required',
        });
      }

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      await StreamerMgmtService.muteStreamer(id, adminId);

      // Return response
      res.json({
        success: true,
        message: 'Streamer muted successfully',
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Stream not found' || error.message === 'Stream is not live')
      ) {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      if (error instanceof Error && error.message === 'Failed to mute streamer') {
        return res.status(500).json({
          error: 'LiveKit error',
          message: error.message,
        });
      }

      console.error('Error muting streamer:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to mute streamer',
      });
    }
  }

  /**
   * Disable chat for a stream
   * POST /api/admin/streamers/:id/disable-chat
   *
   * Requirements: 5.9
   */
  static async disableStreamChat(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Stream ID is required',
        });
      }

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const stream = await StreamerMgmtService.disableStreamChat(id, adminId);

      // Return response
      res.json({
        success: true,
        message: 'Stream chat disabled successfully',
        data: {
          id: stream.id,
          isChatEnabled: stream.isChatEnabled,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Stream not found') {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      console.error('Error disabling stream chat:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to disable stream chat',
      });
    }
  }

  /**
   * Send a warning to a streamer
   * POST /api/admin/streamers/:id/warn
   *
   * Body:
   * - message: string (required, min 10 chars)
   *
   * Requirements: 5.10
   */
  static async warnStreamer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Stream ID is required',
        });
      }

      // Validate request body
      const data = warnStreamerSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const result = await StreamerMgmtService.warnStreamer(id, data.message, adminId);

      // Return response
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.issues,
        });
      }

      if (error instanceof Error && error.message === 'Stream not found') {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      console.error('Error warning streamer:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to send warning',
      });
    }
  }

  /**
   * Suspend a streamer account
   * PATCH /api/admin/streamers/:id/suspend
   *
   * Body:
   * - reason: string (required, min 10 chars)
   * - expiresAt: date (optional)
   * - adminNotes: string (optional)
   *
   * Requirements: 5.11
   */
  static async suspendStreamer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'User ID is required',
        });
      }

      // Validate request body
      const data = suspendStreamerSchema.parse(req.body);

      // Get admin user from request (set by adminAuthMiddleware)
      const adminId = req.adminUser!.id;

      // Call service
      const user = await StreamerMgmtService.suspendStreamer(
        id,
        data.reason,
        adminId,
        data.expiresAt,
        data.adminNotes
      );

      // Return response
      res.json({
        success: true,
        message: 'Streamer suspended successfully',
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

      if (error instanceof Error && error.message === 'User not found') {
        return res.status(404).json({
          error: 'Not found',
          message: error.message,
        });
      }

      console.error('Error suspending streamer:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to suspend streamer',
      });
    }
  }
}
