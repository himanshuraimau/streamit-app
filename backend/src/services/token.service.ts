import { AccessToken } from 'livekit-server-sdk';
import { prisma } from '../lib/db';

/**
 * Token Service - Generate LiveKit access tokens for joining rooms
 * Handles token generation for creators, viewers, and guests
 */
export class TokenService {
  /**
   * Generate token for creator (with publish permissions)
   * @param userId - Creator's user ID
   * @param roomId - Room ID (typically the creator's userId)
   * @returns JWT token
   */
  static async generateCreatorToken(
    userId: string,
    roomId: string
  ): Promise<string> {
    try {
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;

      if (!apiKey || !apiSecret) {
        throw new Error('Missing LiveKit API credentials');
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, name: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      console.log(`[TokenService] Generating creator token for ${user.username}`);

      const token = new AccessToken(apiKey, apiSecret, {
        identity: userId,
        name: user.name || user.username,
      });

      token.addGrant({
        room: roomId,
        roomJoin: true,
        canPublish: true, // Creator can publish video/audio
        canPublishData: true, // Creator can send chat messages
        canSubscribe: true, // Creator can receive data
      });

      const jwt = await token.toJwt();
      console.log(`[TokenService] Creator token generated for ${user.username}`);
      return jwt;
    } catch (error) {
      console.error('[TokenService] Error generating creator token:', error);
      throw new Error(
        `Failed to generate creator token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate token for viewer (without publish permissions)
   * @param viewerId - Viewer's user ID
   * @param hostId - Host's user ID (room name)
   * @param username - Viewer's username
   * @returns JWT token
   */
  static async generateViewerToken(
    viewerId: string,
    hostId: string,
    username: string
  ): Promise<string> {
    try {
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;

      if (!apiKey || !apiSecret) {
        throw new Error('Missing LiveKit API credentials');
      }

      // Check if viewer is blocked by host
      const isBlocked = await this.isUserBlocked(viewerId, hostId);
      if (isBlocked) {
        throw new Error('You are blocked by this creator');
      }

      console.log(`[TokenService] Generating viewer token for ${username}`);

      const token = new AccessToken(apiKey, apiSecret, {
        identity: viewerId,
        name: username,
      });

      token.addGrant({
        room: hostId,
        roomJoin: true,
        canPublish: false, // Viewers cannot publish video/audio
        canPublishData: true, // Viewers can send chat messages
        canSubscribe: true, // Viewers can receive video/audio
      });

      const jwt = await token.toJwt();
      console.log(`[TokenService] Viewer token generated for ${username}`);
      return jwt;
    } catch (error) {
      console.error('[TokenService] Error generating viewer token:', error);
      throw new Error(
        `Failed to generate viewer token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate token for guest (anonymous viewer)
   * @param hostId - Host's user ID (room name)
   * @param guestName - Guest's display name
   * @returns JWT token
   */
  static async generateGuestToken(
    hostId: string,
    guestName: string
  ): Promise<string> {
    try {
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;

      if (!apiKey || !apiSecret) {
        throw new Error('Missing LiveKit API credentials');
      }

      // Generate a unique guest ID
      const guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      console.log(`[TokenService] Generating guest token for ${guestName}`);

      const token = new AccessToken(apiKey, apiSecret, {
        identity: guestId,
        name: guestName,
      });

      token.addGrant({
        room: hostId,
        roomJoin: true,
        canPublish: false, // Guests cannot publish video/audio
        canPublishData: true, // Guests can send chat messages (can be restricted later)
        canSubscribe: true, // Guests can receive video/audio
      });

      const jwt = await token.toJwt();
      console.log(`[TokenService] Guest token generated for ${guestName}`);
      return jwt;
    } catch (error) {
      console.error('[TokenService] Error generating guest token:', error);
      throw new Error(
        `Failed to generate guest token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a user is blocked by another user
   * @param userId - User ID to check
   * @param blockerId - User ID who might have blocked
   * @returns true if blocked, false otherwise
   */
  private static async isUserBlocked(
    userId: string,
    blockerId: string
  ): Promise<boolean> {
    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId: userId,
        },
      },
    });

    return !!block;
  }

  /**
   * Check if a user is following another user
   * @param followerId - Follower's user ID
   * @param followingId - User being followed
   * @returns true if following, false otherwise
   */
  static async isFollowing(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  /**
   * Validate token request
   * Checks if viewer is blocked or if other restrictions apply
   * @param hostId - Host's user ID
   * @param viewerId - Viewer's user ID (optional for guests)
   * @returns Validation result
   */
  static async validateTokenRequest(
    hostId: string,
    viewerId?: string
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // Check if host exists and has a stream
      const host = await prisma.user.findUnique({
        where: { id: hostId },
        include: {
          stream: true,
        },
      });

      if (!host) {
        return { valid: false, reason: 'Host not found' };
      }

      if (!host.stream) {
        return { valid: false, reason: 'Stream not found' };
      }

      // If viewer is authenticated, check blocking
      if (viewerId) {
        const isBlocked = await this.isUserBlocked(viewerId, hostId);
        if (isBlocked) {
          return { valid: false, reason: 'You are blocked by this creator' };
        }

        // Check if chat is followers-only and viewer is not following
        if (host.stream.isChatFollowersOnly) {
          const isFollower = await this.isFollowing(viewerId, hostId);
          if (!isFollower && viewerId !== hostId) {
            return {
              valid: false,
              reason: 'Chat is restricted to followers only',
            };
          }
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('[TokenService] Error validating token request:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }
}
