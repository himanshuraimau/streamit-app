import { prisma } from '../lib/db';
import type { Stream } from '@prisma/client';

/**
 * Stream Service - Business logic for stream management
 * Handles stream creation, updates, and status management for WebRTC streaming
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
   * Create or update stream metadata (for WebRTC flow)
   * @param userId - Creator's user ID
   * @param data - Stream metadata
   * @returns Created or updated stream
   */
  static async createOrUpdateStream(
    userId: string,
    data: {
      title: string;
      description?: string;
      thumbnail?: string;
      isChatEnabled?: boolean;
      isChatDelayed?: boolean;
      isChatFollowersOnly?: boolean;
    }
  ): Promise<Stream> {
    try {
      // Validate user is approved creator
      await this.validateCreatorApproved(userId);

      console.log(`[StreamService] Creating/updating stream for user: ${userId}`);

      // Create or update stream with metadata
      const stream = await prisma.stream.upsert({
        where: { userId },
        update: {
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          isChatEnabled: data.isChatEnabled ?? true,
          isChatDelayed: data.isChatDelayed ?? false,
          isChatFollowersOnly: data.isChatFollowersOnly ?? false,
        },
        create: {
          userId,
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          isChatEnabled: data.isChatEnabled ?? true,
          isChatDelayed: data.isChatDelayed ?? false,
          isChatFollowersOnly: data.isChatFollowersOnly ?? false,
          isLive: false,
        },
      });

      console.log(`[StreamService] Stream created/updated for user: ${userId}`);
      return stream;
    } catch (error) {
      console.error('[StreamService] Error creating/updating stream:', error);
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
    data: { title?: string; thumbnail?: string; description?: string }
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
   * Set stream live status (for WebRTC flow)
   * Called when creator goes live or ends stream
   * @param userId - Creator's user ID
   * @param isLive - Live status
   * @returns Updated stream
   */
  static async setStreamLive(userId: string, isLive: boolean): Promise<Stream> {
    try {
      console.log(
        `[StreamService] Setting stream ${isLive ? 'LIVE' : 'OFFLINE'} for user: ${userId}`
      );

      const stream = await prisma.stream.findUnique({
        where: { userId },
      });

      if (!stream) {
        throw new Error('Stream not found');
      }

      const updatedStream = await prisma.stream.update({
        where: { userId },
        data: { isLive },
      });

      console.log(
        `[StreamService] Stream ${isLive ? 'is now LIVE' : 'went OFFLINE'} for user: ${userId}`
      );
      return updatedStream;
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

      return {
        isLive: stream.isLive,
        viewerCount: 0, // Viewer count will be managed by LiveKit room events
        title: stream.title,
        description: stream.description,
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
   * @param streamUserId - Stream owner's userId to validate
   * @returns true if user owns the stream
   */
  static async validateStreamOwnership(
    userId: string,
    streamUserId: string
  ): Promise<boolean> {
    return userId === streamUserId;
  }

  /**
   * Get past streams for a creator
   * Note: Current schema only supports one stream per user
   * This returns the stream if it exists and was live before
   * TODO: Add StreamSession model for proper stream history
   * @param userId - Creator's user ID
   * @returns Past streams with metadata
   */
  static async getPastStreams(userId: string) {
    try {
      // For now, return current stream if it exists and is not live
      const stream = await prisma.stream.findUnique({
        where: { userId },
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

      if (!stream || stream.isLive) {
        return { streams: [], total: 0 };
      }

      return {
        streams: [stream],
        total: 1,
      };
    } catch (error) {
      console.error('[StreamService] Error getting past streams:', error);
      throw error;
    }
  }
}
