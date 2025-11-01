import { prisma } from '../lib/db';
import { LiveKitService } from './livekit.service';
import type { Stream } from '@prisma/client';

/**
 * Stream Service - Business logic for stream management
 * Handles stream creation, updates, and status management
 */
export class StreamService {
  /**
   * Validate that user is an approved creator
   * @param userId - User ID to check
   * @throws Error if user is not an approved creator
   */
  static async validateCreatorApproved(userId: string): Promise<void> {
    const application = await prisma.creatorApplication.findUnique({
      where: { userId },
      select: { status: true },
    });

    if (!application) {
      throw new Error('No creator application found. Please apply to become a creator.');
    }

    if (application.status !== 'APPROVED') {
      throw new Error(
        `Creator application status: ${application.status}. Only approved creators can stream.`
      );
    }
  }

  /**
   * Get creator's stream configuration
   * @param userId - Creator's user ID
   * @returns Stream configuration or null if not found
   */
  static async getCreatorStream(userId: string): Promise<Stream | null> {
    return await prisma.stream.findUnique({
      where: { userId },
    });
  }

  /**
   * Get stream by username
   * @param username - Creator's username
   * @returns Stream with user info or null if not found
   */
  static async getStreamByUsername(username: string) {
    return await prisma.stream.findFirst({
      where: {
        user: {
          username,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
    });
  }

  /**
   * Create stream ingress for a creator
   * @param userId - Creator's user ID
   * @param ingressType - Type of ingress (RTMP or WHIP)
   * @returns Stream configuration with ingress details
   */
  static async createStreamIngress(
    userId: string,
    ingressType: 'RTMP' | 'WHIP' = 'RTMP'
  ): Promise<Stream> {
    try {
      // Validate user is approved creator
      await this.validateCreatorApproved(userId);

      console.log(`[StreamService] Creating ingress for user: ${userId}`);

      // Get or create stream record
      let stream = await this.getCreatorStream(userId);

      // If stream exists with ingress, reset it first
      if (stream?.ingressId) {
        console.log(`[StreamService] Existing ingress found, resetting...`);
        await LiveKitService.resetUserIngresses(userId);
      }

      // Create new ingress in LiveKit
      const ingress = await LiveKitService.createIngress(userId, ingressType);

      // Update or create stream record in database
      stream = await prisma.stream.upsert({
        where: { userId },
        update: {
          ingressId: ingress.ingressId,
          serverUrl: ingress.url,
          streamKey: ingress.streamKey,
        },
        create: {
          userId,
          title: 'Untitled Stream',
          ingressId: ingress.ingressId,
          serverUrl: ingress.url,
          streamKey: ingress.streamKey,
          isLive: false,
          isChatEnabled: true,
          isChatDelayed: false,
          isChatFollowersOnly: false,
        },
      });

      console.log(`[StreamService] Ingress created successfully for user: ${userId}`);
      return stream;
    } catch (error) {
      console.error('[StreamService] Error creating stream ingress:', error);
      throw error;
    }
  }

  /**
   * Delete stream ingress and reset configuration
   * @param userId - Creator's user ID
   */
  static async deleteStreamIngress(userId: string): Promise<void> {
    try {
      console.log(`[StreamService] Deleting ingress for user: ${userId}`);

      const stream = await this.getCreatorStream(userId);
      if (!stream) {
        throw new Error('Stream not found');
      }

      // Reset ingresses in LiveKit
      await LiveKitService.resetUserIngresses(userId);

      // Update stream record to remove ingress details
      await prisma.stream.update({
        where: { userId },
        data: {
          ingressId: null,
          serverUrl: null,
          streamKey: null,
          isLive: false,
        },
      });

      console.log(`[StreamService] Ingress deleted successfully for user: ${userId}`);
    } catch (error) {
      console.error('[StreamService] Error deleting stream ingress:', error);
      throw error;
    }
  }

  /**
   * Update stream information (title, thumbnail)
   * @param userId - Creator's user ID
   * @param data - Stream data to update
   * @returns Updated stream
   */
  static async updateStreamInfo(
    userId: string,
    data: { title?: string; thumbnail?: string }
  ): Promise<Stream> {
    try {
      console.log(`[StreamService] Updating stream info for user: ${userId}`);

      const stream = await prisma.stream.update({
        where: { userId },
        data,
      });

      console.log(`[StreamService] Stream info updated for user: ${userId}`);
      return stream;
    } catch (error) {
      console.error('[StreamService] Error updating stream info:', error);
      throw new Error(
        `Failed to update stream info: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update chat settings
   * @param userId - Creator's user ID
   * @param settings - Chat settings to update
   * @returns Updated stream
   */
  static async updateChatSettings(
    userId: string,
    settings: {
      isChatEnabled?: boolean;
      isChatDelayed?: boolean;
      isChatFollowersOnly?: boolean;
    }
  ): Promise<Stream> {
    try {
      console.log(`[StreamService] Updating chat settings for user: ${userId}`);

      const stream = await prisma.stream.update({
        where: { userId },
        data: settings,
      });

      console.log(`[StreamService] Chat settings updated for user: ${userId}`);
      return stream;
    } catch (error) {
      console.error('[StreamService] Error updating chat settings:', error);
      throw new Error(
        `Failed to update chat settings: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Set stream live status
   * Called by webhook when stream starts/stops
   * @param ingressId - Ingress ID from webhook
   * @param isLive - Live status
   */
  static async setStreamLive(
    ingressId: string,
    isLive: boolean
  ): Promise<void> {
    try {
      console.log(
        `[StreamService] Setting stream ${isLive ? 'LIVE' : 'OFFLINE'} for ingress: ${ingressId}`
      );

      const stream = await prisma.stream.findUnique({
        where: { ingressId },
      });

      if (!stream) {
        console.warn(`[StreamService] Stream not found for ingress: ${ingressId}`);
        return;
      }

      await prisma.stream.update({
        where: { ingressId },
        data: { isLive },
      });

      console.log(
        `[StreamService] Stream ${isLive ? 'is now LIVE' : 'went OFFLINE'} for user: ${stream.userId}`
      );
    } catch (error) {
      console.error('[StreamService] Error setting stream live status:', error);
      throw error;
    }
  }

  /**
   * Get stream status
   * @param userId - Creator's user ID
   * @returns Stream status with viewer count
   */
  static async getStreamStatus(userId: string) {
    try {
      const stream = await this.getCreatorStream(userId);

      if (!stream) {
        throw new Error('Stream not found');
      }

      // Get viewer count from LiveKit if stream is live
      let viewerCount = 0;
      if (stream.isLive && stream.ingressId) {
        try {
          const participants = await LiveKitService.listParticipants(userId);
          // Exclude the creator from viewer count
          viewerCount = participants.filter(
            (p) => p.identity !== userId
          ).length;
        } catch (error) {
          console.error('[StreamService] Error getting viewer count:', error);
          // Continue without viewer count if there's an error
        }
      }

      return {
        isLive: stream.isLive,
        viewerCount,
        title: stream.title,
        thumbnail: stream.thumbnail,
        isChatEnabled: stream.isChatEnabled,
        isChatDelayed: stream.isChatDelayed,
        isChatFollowersOnly: stream.isChatFollowersOnly,
      };
    } catch (error) {
      console.error('[StreamService] Error getting stream status:', error);
      throw error;
    }
  }

  /**
   * Get list of all live streams
   * @returns Array of live streams with user info
   */
  static async getLiveStreams() {
    return await prisma.stream.findMany({
      where: { isLive: true },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Get followed streams for a user
   * @param userId - User ID
   * @returns Array of streams from followed creators
   */
  static async getFollowedStreams(userId: string) {
    return await prisma.stream.findMany({
      where: {
        user: {
          followedBy: {
            some: {
              followerId: userId,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { isLive: 'desc' }, // Live streams first
        { updatedAt: 'desc' },
      ],
    });
  }

  /**
   * Search streams by title or username
   * @param query - Search query
   * @returns Array of matching streams
   */
  static async searchStreams(query: string) {
    return await prisma.stream.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            user: {
              username: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            user: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: [
        { isLive: 'desc' }, // Live streams first
        { updatedAt: 'desc' },
      ],
      take: 20, // Limit results
    });
  }

  /**
   * Validate stream ownership
   * @param userId - User ID to check
   * @param streamId - Stream ID or userId to validate
   * @returns true if user owns the stream
   */
  static async validateStreamOwnership(
    userId: string,
    streamUserId: string
  ): Promise<boolean> {
    return userId === streamUserId;
  }
}
