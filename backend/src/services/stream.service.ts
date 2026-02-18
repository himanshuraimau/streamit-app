import { prisma } from '../lib/db';
import type { Stream, StreamReportReason } from '@prisma/client';

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
        stats: {
          select: {
            startedAt: true,
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
        `Failed to update stream info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error }
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
        `Failed to update chat settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { cause: error }
      );
    }
  }

  /**
   * Set stream live status (for WebRTC flow)
   * Called when creator goes live or ends stream
   * @param userId - Creator's user ID
   * @param isLive - Live status
   * @returns Updated stream
   * Requirements: 1.1, 1.3, 9.2
   */
  static async setStreamLive(userId: string, isLive: boolean): Promise<Stream> {
    try {
      console.log(
        `[StreamService] Setting stream ${isLive ? 'LIVE' : 'OFFLINE'} for user: ${userId}`
      );

      const stream = await prisma.stream.findUnique({
        where: { userId },
        include: { stats: true },
      });

      if (!stream) {
        throw new Error('Stream not found');
      }

      if (isLive) {
        // Going live: Set startedAt and create StreamStats record
        const now = new Date();

        const updatedStream = await prisma.stream.update({
          where: { userId },
          data: {
            isLive: true,
            startedAt: now,
          },
        });

        // Create or reset StreamStats for this stream session
        await prisma.streamStats.upsert({
          where: { streamId: stream.id },
          create: {
            streamId: stream.id,
            startedAt: now,
            peakViewers: 0,
            totalViewers: 0,
            totalLikes: 0,
            totalGifts: 0,
            totalCoins: 0,
          },
          update: {
            startedAt: now,
            endedAt: null,
            peakViewers: 0,
            totalViewers: 0,
            totalLikes: 0,
            totalGifts: 0,
            totalCoins: 0,
          },
        });

        console.log(
          `[StreamService] Stream is now LIVE for user: ${userId}, startedAt: ${now.toISOString()}`
        );
        return updatedStream;
      } else {
        // Ending stream: Set endedAt in StreamStats and calculate final statistics
        const now = new Date();

        const updatedStream = await prisma.stream.update({
          where: { userId },
          data: { isLive: false },
        });

        // Update StreamStats with endedAt and final statistics
        if (stream.stats) {
          // Calculate final statistics from gift transactions
          const giftStats = await prisma.giftTransaction.aggregate({
            where: { streamId: stream.id },
            _sum: { coinAmount: true },
            _count: { id: true },
          });

          await prisma.streamStats.update({
            where: { streamId: stream.id },
            data: {
              endedAt: now,
              totalGifts: giftStats._count.id,
              totalCoins: giftStats._sum.coinAmount ?? 0,
            },
          });

          console.log(
            `[StreamService] Stream went OFFLINE for user: ${userId}, endedAt: ${now.toISOString()}`
          );
        }

        return updatedStream;
      }
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
  static async getStreamStatus(userId: string): Promise<{
    isLive: boolean;
    viewerCount: number;
    title: string;
    description: string | null;
    thumbnail: string | null;
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
  }> {
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
  static async validateStreamOwnership(userId: string, streamUserId: string): Promise<boolean> {
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

  /**
   * Get stream summary with statistics
   * @param streamId - Stream ID to get summary for
   * @returns Stream summary with totalViewers, peakViewers, topGifter
   * Requirements: 9.2, 9.3
   */
  static async getStreamSummary(streamId: string) {
    try {
      console.log(`[StreamService] Getting stream summary for: ${streamId}`);

      // Get stream with stats
      const stream = await prisma.stream.findUnique({
        where: { id: streamId },
        include: {
          stats: true,
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

      if (!stream) {
        throw new Error('Stream not found');
      }

      // Calculate top gifter from GiftTransaction aggregation
      const topGifterResult = await prisma.giftTransaction.groupBy({
        by: ['senderId'],
        where: { streamId },
        _sum: {
          coinAmount: true,
        },
        orderBy: {
          _sum: {
            coinAmount: 'desc',
          },
        },
        take: 1,
      });

      let topGifter = null;
      const topGifterData = topGifterResult[0];
      if (topGifterData) {
        const totalCoins = topGifterData._sum.coinAmount;

        if (totalCoins && totalCoins > 0) {
          const topGifterUser = await prisma.user.findUnique({
            where: { id: topGifterData.senderId },
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          });

          if (topGifterUser) {
            topGifter = {
              userId: topGifterUser.id,
              username: topGifterUser.username,
              name: topGifterUser.name,
              image: topGifterUser.image,
              totalCoins: totalCoins,
            };
          }
        }
      }

      // Calculate duration if stream has started and ended
      let duration: number | null = null;
      if (stream.stats?.startedAt && stream.stats?.endedAt) {
        duration = Math.floor(
          (stream.stats.endedAt.getTime() - stream.stats.startedAt.getTime()) / 1000
        );
      } else if (stream.stats?.startedAt && stream.isLive) {
        // Stream is still live, calculate current duration
        duration = Math.floor((Date.now() - stream.stats.startedAt.getTime()) / 1000);
      }

      const summary = {
        streamId: stream.id,
        title: stream.title,
        creator: stream.user,
        totalViewers: stream.stats?.totalViewers ?? 0,
        peakViewers: stream.stats?.peakViewers ?? 0,
        totalGifts: stream.stats?.totalGifts ?? 0,
        totalCoins: stream.stats?.totalCoins ?? 0,
        totalLikes: stream.stats?.totalLikes ?? 0,
        topGifter,
        duration,
        startedAt: stream.stats?.startedAt ?? null,
        endedAt: stream.stats?.endedAt ?? null,
        isLive: stream.isLive,
      };

      console.log(`[StreamService] Stream summary retrieved for: ${streamId}`);
      return summary;
    } catch (error) {
      console.error('[StreamService] Error getting stream summary:', error);
      throw error;
    }
  }

  /**
   * Create a stream report
   * @param reporterId - User ID of the reporter
   * @param streamId - Stream ID being reported
   * @param reason - Report reason
   * @param description - Optional description
   * @returns Created stream report
   * Requirements: 2.3
   */
  static async createReport(
    reporterId: string,
    streamId: string,
    reason: StreamReportReason,
    description?: string
  ) {
    try {
      console.log(`[StreamService] Creating report for stream: ${streamId} by user: ${reporterId}`);

      // Validate stream exists and is live
      const stream = await prisma.stream.findUnique({
        where: { id: streamId },
        select: { id: true, isLive: true },
      });

      if (!stream) {
        throw new Error('Stream not found');
      }

      if (!stream.isLive) {
        throw new Error('Can only report live streams');
      }

      // Create the stream report
      const report = await prisma.streamReport.create({
        data: {
          streamId,
          reporterId,
          reason,
          description,
        },
        select: {
          id: true,
          streamId: true,
          reason: true,
          status: true,
          createdAt: true,
        },
      });

      console.log(`[StreamService] Report created: ${report.id}`);
      return report;
    } catch (error) {
      console.error('[StreamService] Error creating report:', error);
      throw error;
    }
  }
}
