import type { Request, Response } from 'express';
import { z } from 'zod';
import { StreamService } from '../services/stream.service';
import {
  createIngressSchema,
  updateStreamInfoSchema,
  updateChatSettingsSchema,
} from '../lib/validations/stream.validation';
import { TokenService } from '../services/token.service';
import { prisma } from '../lib/db';

/**
 * Stream Controller - Handles HTTP requests for streaming operations
 * All methods require authentication and creator approval
 */
export class StreamController {
  /**
   * Create stream ingress (generate stream key)
   * POST /api/stream/ingress
   */
  static async createIngress(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Validate request body
      const { ingressType } = createIngressSchema.parse(req.body);

      console.log(`[StreamController] Creating ingress for user: ${userId}`);

      // Create ingress through service
      const stream = await StreamService.createStreamIngress(userId, ingressType);

      res.status(201).json({
        success: true,
        data: {
          ingressId: stream.ingressId,
          serverUrl: stream.serverUrl,
          streamKey: stream.streamKey,
          userId: stream.userId,
        },
        message: 'Stream key created successfully',
      });
    } catch (error) {
      console.error('[StreamController] Error creating ingress:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        // Check for specific error messages
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
        error: 'Failed to create stream key',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete stream ingress (remove stream key)
   * DELETE /api/stream/ingress
   */
  static async deleteIngress(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      console.log(`[StreamController] Deleting ingress for user: ${userId}`);

      await StreamService.deleteStreamIngress(userId);

      res.json({
        success: true,
        message: 'Stream key deleted successfully',
      });
    } catch (error) {
      console.error('[StreamController] Error deleting ingress:', error);

      if (error instanceof Error && error.message === 'Stream not found') {
        return res.status(404).json({
          success: false,
          error: 'Stream not found',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete stream key',
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
          message: 'Please create a stream key first',
        });
      }

      // Don't expose stream key in regular info endpoint
      const { streamKey, ...streamInfo } = stream;

      res.json({
        success: true,
        data: streamInfo,
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
   * Get creator's stream credentials (including stream key)
   * GET /api/stream/credentials
   */
  static async getStreamCredentials(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      console.log(`[StreamController] Getting stream credentials for user: ${userId}`);

      const stream = await StreamService.getCreatorStream(userId);

      if (!stream) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found',
          message: 'Please create a stream key first',
        });
      }

      // Return credentials including streamKey
      res.json({
        success: true,
        data: {
          ingressId: stream.ingressId,
          serverUrl: stream.serverUrl,
          streamKey: stream.streamKey,
        },
      });
    } catch (error) {
      console.error('[StreamController] Error getting stream credentials:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stream credentials',
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
   * Create stream with metadata (NEW FLOW)
   * POST /api/stream/create
   */
  static async createStreamWithMetadata(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      // Validation schema will be imported from validations
      const data = req.body;

      if (!data.title || data.title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Title is required',
        });
      }

      console.log(`[StreamController] Creating stream with metadata for user: ${userId}`);

      // Create stream record with metadata
      const stream = await StreamService.createStreamWithMetadata(userId, {
        title: data.title.trim(),
        description: data.description?.trim(),
        thumbnail: data.thumbnail,
        isChatEnabled: data.chatSettings?.isChatEnabled ?? true,
        isChatDelayed: data.chatSettings?.isChatDelayed ?? false,
        isChatFollowersOnly: data.chatSettings?.isChatFollowersOnly ?? false,
      });

      // Generate ingress based on method
      const streamMethod = data.streamMethod || 'obs';
      const ingressType = streamMethod === 'browser' ? 'WHIP' : 'RTMP';

      const updatedStream = await StreamService.addIngressToStream(userId, ingressType);

      res.status(201).json({
        success: true,
        data: {
          stream: {
            id: updatedStream.id,
            title: updatedStream.title,
            description: updatedStream.description,
            thumbnail: updatedStream.thumbnail,
            isChatEnabled: updatedStream.isChatEnabled,
            isChatDelayed: updatedStream.isChatDelayed,
            isChatFollowersOnly: updatedStream.isChatFollowersOnly,
          },
          credentials: {
            serverUrl: updatedStream.serverUrl,
            streamKey: updatedStream.streamKey,
          },
          streamMethod,
        },
        message: 'Stream created successfully',
      });
    } catch (error) {
      console.error('[StreamController] Error creating stream with metadata:', error);

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
        error: 'Failed to create stream',
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

      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      console.log(`[StreamController] Getting past streams for user: ${userId}`);

      const result = await StreamService.getPastStreams(userId, limit, offset);

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

  /**
   * Get creator token for viewing own stream
   * POST /api/stream/creator-token
   */
  static async getCreatorToken(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      console.log(`[StreamController] Getting creator token for user: ${userId}`);

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Check if stream exists
      const stream = await StreamService.getCreatorStream(userId);
      if (!stream) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found',
          message: 'Please create a stream key first',
        });
      }

      // Generate creator token (has both publish and subscribe permissions)
      const token = await TokenService.generateCreatorToken(userId, userId);

      res.json({
        success: true,
        data: {
          token,
          identity: userId,
          name: user.name || user.username,
          wsUrl: process.env.LIVEKIT_URL,
        },
      });
    } catch (error) {
      console.error('[StreamController] Error getting creator token:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get creator token',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
