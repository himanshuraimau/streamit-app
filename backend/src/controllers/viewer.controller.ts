import type { Request, Response } from 'express';
import { StreamService } from '../services/stream.service';
import { TokenService } from '../services/token.service';
import { z } from 'zod';
import { prisma } from '../lib/db';
import { auth } from '../lib/auth';
import { updateProfileSchema, changePasswordSchema } from '../lib/validations/viewer.validation';
import { uploadFileToS3, generateFileName } from '../lib/s3';

/**
 * Viewer Controller - Handles HTTP requests for stream viewing
 * These endpoints are for viewers/users watching streams
 */
export class ViewerController {
  /**
   * Get current authenticated user info (protected endpoint)
   * GET /api/viewer/me
   */
  static async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          bio: true,
          age: true,
          phone: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('[ViewerController] Error getting current user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user info',
      });
    }
  }

  /**
   * Get stream by username (public endpoint)
   * GET /api/viewer/stream/:username
   */
  static async getStreamByUsername(req: Request, res: Response) {
    try {
      const { username } = req.params;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: 'Username is required',
        });
      }

      console.log(`[ViewerController] Getting stream for username: ${username}`);

      const stream = await StreamService.getStreamByUsername(username);

      if (!stream) {
        return res.status(404).json({
          success: false,
          error: 'Stream not found',
          message: 'This creator does not have a stream configured',
        });
      }

      res.json({
        success: true,
        data: stream,
      });
    } catch (error) {
      console.error('[ViewerController] Error getting stream:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stream',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get viewer token for joining a stream
   * POST /api/viewer/token
   * Body: { hostId, guestName? }
   */
  static async getViewerToken(req: Request, res: Response) {
    try {
      const { hostId, guestName } = req.body;

      if (!hostId) {
        return res.status(400).json({
          success: false,
          error: 'Host ID is required',
        });
      }

      // Check if user is authenticated (via optionalAuth middleware)
      const viewerId = req.user?.id;
      const viewerName = req.user?.name || req.user?.username || guestName;

      console.log(
        `[ViewerController] Token request - viewerId: ${viewerId || 'none'}, viewerName: ${viewerName || 'none'}, hostId: ${hostId}, guestName: ${guestName || 'none'}`
      );

      // Check if viewer IS the host (creator watching own stream)
      const isCreator = viewerId && viewerId === hostId;

      if (!viewerId && !guestName) {
        console.warn('[ViewerController] Neither authenticated user nor guest name provided');
        return res.status(400).json({
          success: false,
          error: 'Guest name is required for anonymous viewers',
        });
      }

      console.log(
        `[ViewerController] Generating token for ${viewerId ? `user ${viewerId}` : `guest ${guestName}`} to view ${hostId}${isCreator ? ' (creator self-view)' : ''}`
      );

      // Generate appropriate token
      let token: string;
      let identity: string;
      let name: string;

      if (isCreator) {
        // Creator watching their own stream - use viewer token with Host- prefix
        console.log(`[ViewerController] Detected creator self-view for ${viewerName}`);
        token = await TokenService.generateViewerToken(viewerId!, hostId, viewerName!);
        identity = `Host-${viewerId}`;
        name = viewerName!;
      } else if (viewerId && viewerName) {
        // Regular authenticated viewer - validate access
        const validation = await TokenService.validateTokenRequest(
          hostId,
          viewerId
        );

        if (!validation.valid) {
          return res.status(403).json({
            success: false,
            error: validation.reason || 'Access denied',
          });
        }

        token = await TokenService.generateViewerToken(
          viewerId,
          hostId,
          viewerName
        );
        identity = viewerId;
        name = viewerName;
      } else {
        // Guest viewer - validate access
        const validation = await TokenService.validateTokenRequest(hostId);

        if (!validation.valid) {
          return res.status(403).json({
            success: false,
            error: validation.reason || 'Access denied',
          });
        }

        token = await TokenService.generateGuestToken(hostId, guestName!);
        identity = `guest-${Date.now()}`;
        name = guestName!;
      }

      res.json({
        success: true,
        data: {
          token,
          identity,
          name,
          wsUrl: process.env.LIVEKIT_URL || '',
        },
        message: 'Token generated successfully',
      });
    } catch (error) {
      console.error('[ViewerController] Error generating token:', error);

      if (error instanceof Error) {
        if (error.message.includes('blocked')) {
          return res.status(403).json({
            success: false,
            error: error.message,
          });
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to generate token',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all live streams (public endpoint)
   * GET /api/viewer/live
   */
  static async getLiveStreams(req: Request, res: Response) {
    try {
      console.log('[ViewerController] Getting all live streams');

      const streams = await StreamService.getLiveStreams();

      res.json({
        success: true,
        data: streams,
        count: streams.length,
      });
    } catch (error) {
      console.error('[ViewerController] Error getting live streams:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get live streams',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get recommended streams (can be expanded with algorithm)
   * GET /api/viewer/recommended
   */
  static async getRecommendedStreams(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      console.log(
        `[ViewerController] Getting recommended streams${userId ? ` for user ${userId}` : ''}`
      );

      // For now, return all live streams
      // TODO: Implement recommendation algorithm based on:
      // - User's followed creators
      // - User's interests (content categories)
      // - Popular streams
      // - Similar viewers' preferences
      const streams = await StreamService.getLiveStreams();

      res.json({
        success: true,
        data: streams,
        count: streams.length,
        message: 'Basic recommendation (live streams only)',
      });
    } catch (error) {
      console.error('[ViewerController] Error getting recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get recommendations',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get followed streams (authenticated users only)
   * GET /api/viewer/following
   */
  static async getFollowedStreams(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const userId = req.user.id;

      console.log(`[ViewerController] Getting followed streams for user: ${userId}`);

      const streams = await StreamService.getFollowedStreams(userId);

      res.json({
        success: true,
        data: streams,
        count: streams.length,
      });
    } catch (error) {
      console.error('[ViewerController] Error getting followed streams:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get followed streams',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Search streams
   * GET /api/viewer/search?q=query
   */
  static async searchStreams(req: Request, res: Response) {
    try {
      const query = req.query.q as string;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      console.log(`[ViewerController] Searching streams with query: ${query}`);

      const streams = await StreamService.searchStreams(query);

      res.json({
        success: true,
        data: streams,
        count: streams.length,
        query,
      });
    } catch (error) {
      console.error('[ViewerController] Error searching streams:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search streams',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/viewer/profile
   */
  static async getProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          bio: true,
          image: true,
          age: true,
          phone: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error('[ViewerController] Error getting profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update user profile
   * PATCH /api/viewer/profile
   * Body: { name?, username?, bio? }
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const userId = req.user.id;

      // Validate request body
      const validatedData = updateProfileSchema.parse(req.body);

      // Check if username is already taken (if updating username)
      if (validatedData.username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username: validatedData.username,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: 'Username already taken',
          });
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: validatedData,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          bio: true,
          image: true,
          age: true,
          phone: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      }

      console.error('[ViewerController] Error updating profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Upload avatar/profile picture
   * POST /api/viewer/avatar
   */
  static async uploadAvatar(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed',
        });
      }

      // Upload to S3
      const fileName = generateFileName(file.originalname, 'AVATAR');
      const avatarUrl = await uploadFileToS3(file.buffer, fileName, file.mimetype);

      // Update user's avatar in database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { image: avatarUrl },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          image: true,
          age: true,
          phone: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: {
          user: updatedUser,
          avatarUrl,
        },
        message: 'Avatar uploaded successfully',
      });
    } catch (error) {
      console.error('[ViewerController] Error uploading avatar:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to upload avatar',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Change password
   * PATCH /api/viewer/password
   * Body: { currentPassword, newPassword, confirmPassword }
   */
  static async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const userId = req.user.id;
      const email = req.user.email;

      // Validate request body
      const validatedData = changePasswordSchema.parse(req.body);

      // Verify current password using Better Auth
      try {
        const signInResult = await auth.api.signInEmail({
          body: {
            email,
            password: validatedData.currentPassword,
          },
        });

        if (!signInResult?.user) {
          return res.status(401).json({
            success: false,
            error: 'Current password is incorrect',
          });
        }
      } catch (authError) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
        });
      }

      // Update password using Better Auth
      await auth.api.changePassword({
        body: {
          newPassword: validatedData.newPassword,
          currentPassword: validatedData.currentPassword,
        },
        headers: req.headers as any,
      });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        });
      }

      console.error('[ViewerController] Error changing password:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
