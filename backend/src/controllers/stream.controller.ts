import type { Request, Response } from 'express';
import { z } from 'zod';
import { StreamService } from '../services/stream.service';
import {
  updateStreamInfoSchema,
  updateChatSettingsSchema,
  setupStreamSchema,
} from '../lib/validations/stream.validation';
import { TokenService } from '../services/token.service';
import { prisma } from '../lib/db';

/**
 * Stream Controller - Handles HTTP requests for streaming operations
 * All methods require authentication and creator approval
 */
export class StreamController {
  /**
   * Go live - Get publish token and set stream status to live
   * POST /api/stream/go-live
   * Requirements: 1.3, 2.3
   */
  static async goLive(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      console.log(`[StreamController] Going live for user: ${userId}`);

      // Check if stream exists
      const stream = await StreamService.getCreatorStream(userId);
      if (!stream) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found',
          message: 'Please set up your stream first',
        });
      }

      // Generate creator token with publish permissions
      const token = await TokenService.generateCreatorToken(userId, userId);

      // Set stream to live
      const updatedStream = await StreamService.setStreamLive(userId, true);

      res.json({
        success: true,
        data: {
          token,
          wsUrl: process.env.LIVEKIT_URL,
          roomId: userId,
          stream: {
            id: updatedStream.id,
            title: updatedStream.title,
            isLive: updatedStream.isLive,
          },
        },
      });
    } catch (error) {
      console.error('[StreamController] Error going live:', error);

      if (error instanceof Error) {
        if (
          error.message.includes('creator application') ||
          error.message.includes('APPROVED')
        ) {
          return res.status(403).json({
            success: false,
            error: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to go live',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * End stream - Set stream status to offline
   * POST /api/stream/end-stream
   * Requirements: 2.3
   */
  static async endStream(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      console.log(`[StreamController] Ending stream for user: ${userId}`);

      // Set stream to offline
      await StreamService.setStreamLive(userId, false);

      res.json({
        success: true,
        message: 'Stream ended',
      });
    } catch (error) {
      console.error('[StreamController] Error ending stream:', error);

      if (error instanceof Error && error.message === 'Stream not found') {
        return res.status(404).json({
          success: false,
          error: 'Stream not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to end stream',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Setup stream - Create or update stream metadata
   * POST /api/stream/setup
   * Requirements: 5.2
   */
  static async setupStream(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Validate request body
      const data = setupStreamSchema.parse(req.body);

      console.log(`[StreamController] Setting up stream for user: ${userId}`);

      // Create or update stream
      const stream = await StreamService.createOrUpdateStream(userId, {
        title: data.title,
        description: data.description,
        isChatEnabled: data.isChatEnabled,
        isChatDelayed: data.isChatDelayed,
        isChatFollowersOnly: data.isChatFollowersOnly,
      });

      res.status(201).json({
        success: true,
        data: {
          id: stream.id,
          title: stream.title,
          description: stream.description,
          isLive: stream.isLive,
          isChatEnabled: stream.isChatEnabled,
          isChatDelayed: stream.isChatDelayed,
          isChatFollowersOnly: stream.isChatFollowersOnly,
        },
      });
    } catch (error) {
      console.error('[StreamController] Error setting up stream:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        if (
          error.message.includes('creator application') ||
          error.message.includes('APPROVED')
        ) {
          return res.status(403).json({
            success: false,
            error: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to setup stream',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get creator's stream info
   * GET /api/stream/info
   */
  static async getStreamInfo(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      console.log(`[StreamController] Getting stream info for user: ${userId}`);

      const stream = await StreamService.getCreatorStream(userId);

      if (!stream) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found',
          message: 'Please set up your stream first',
        });
      }

      res.json({
        success: true,
        data: stream,
      });
    } catch (error) {
      console.error('[StreamController] Error getting stream info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stream info',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update stream info (title, thumbnail)
   * PUT /api/stream/info
   */
  static async updateStreamInfo(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Validate request body
      const data = updateStreamInfoSchema.parse(req.body);

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No update data provided',
        });
      }

      console.log(`[StreamController] Updating stream info for user: ${userId}`);

      const stream = await StreamService.updateStreamInfo(userId, data);

      res.json({
        success: true,
        data: {
          id: stream.id,
          title: stream.title,
          thumbnail: stream.thumbnail,
          updatedAt: stream.updatedAt,
        },
        message: 'Stream info updated successfully',
      });
    } catch (error) {
      console.error('[StreamController] Error updating stream info:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update stream info',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update chat settings
   * PUT /api/stream/chat-settings
   */
  static async updateChatSettings(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Validate request body
      const settings = updateChatSettingsSchema.parse(req.body);

      if (Object.keys(settings).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No settings provided',
        });
      }

      console.log(`[StreamController] Updating chat settings for user: ${userId}`);

      const stream = await StreamService.updateChatSettings(userId, settings);

      res.json({
        success: true,
        data: {
          isChatEnabled: stream.isChatEnabled,
          isChatDelayed: stream.isChatDelayed,
          isChatFollowersOnly: stream.isChatFollowersOnly,
        },
        message: 'Chat settings updated successfully',
      });
    } catch (error) {
      console.error('[StreamController] Error updating chat settings:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update chat settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get stream status
   * GET /api/stream/status
   */
  static async getStreamStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      console.log(`[StreamController] Getting stream status for user: ${userId}`);

      const status = await StreamService.getStreamStatus(userId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error('[StreamController] Error getting stream status:', error);

      if (error instanceof Error && error.message === 'Stream not found') {
        return res.status(404).json({
          success: false,
          error: 'Stream not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to get stream status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get past streams for creator
   * GET /api/stream/past
   */
  static async getPastStreams(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      console.log(`[StreamController] Getting past streams for user: ${userId}`);

      const result = await StreamService.getPastStreams(userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('[StreamController] Error getting past streams:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get past streams',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

}
