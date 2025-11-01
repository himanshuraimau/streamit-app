import type { Request, Response } from 'express';
import { prisma } from '../lib/db';

/**
 * Social Controller - Handles follow/unfollow operations
 */
export class SocialController {
  /**
   * Follow a user
   * POST /api/social/follow/:userId
   */
  static async followUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const followerId = req.user.id;
      const { userId: followingId } = req.params;

      if (!followingId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      // Can't follow yourself
      if (followerId === followingId) {
        return res.status(400).json({
          success: false,
          error: 'You cannot follow yourself',
        });
      }

      // Check if target user exists and is an approved creator
      const targetUser = await prisma.user.findUnique({
        where: { id: followingId },
        include: {
          creatorApplication: {
            select: {
              status: true,
            },
          },
        },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Validate target is an approved creator
      if (!targetUser.creatorApplication || targetUser.creatorApplication.status !== 'APPROVED') {
        return res.status(400).json({
          success: false,
          error: 'You can only follow approved creators',
          message: 'This user is not a creator or their application is not approved',
        });
      }

      // Check if already following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (existingFollow) {
        return res.status(400).json({
          success: false,
          error: 'Already following this creator',
        });
      }

      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      console.log(`[SocialController] User ${followerId} followed creator ${followingId}`);

      res.json({
        success: true,
        message: 'Successfully followed creator',
      });
    } catch (error) {
      console.error('[SocialController] Error following user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to follow creator',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Unfollow a user
   * DELETE /api/social/follow/:userId
   */
  static async unfollowUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const followerId = req.user.id;
      const { userId: followingId } = req.params;

      if (!followingId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      // Check if following exists
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (!existingFollow) {
        return res.status(404).json({
          success: false,
          error: 'Not following this creator',
        });
      }

      // Delete follow relationship
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      console.log(`[SocialController] User ${followerId} unfollowed creator ${followingId}`);

      res.json({
        success: true,
        message: 'Successfully unfollowed creator',
      });
    } catch (error) {
      console.error('[SocialController] Error unfollowing user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unfollow creator',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if following a user
   * GET /api/social/follow/:userId
   */
  static async checkFollowing(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.json({
          success: true,
          data: { isFollowing: false },
        });
      }

      const followerId = req.user.id;
      const { userId: followingId } = req.params;

      if (!followingId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      res.json({
        success: true,
        data: { isFollowing: !!follow },
      });
    } catch (error) {
      console.error('[SocialController] Error checking follow status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check follow status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get user's followers
   * GET /api/social/followers/:userId
   */
  static async getFollowers(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: followers.map((f) => f.follower),
        count: followers.length,
      });
    } catch (error) {
      console.error('[SocialController] Error getting followers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get followers',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get user's following
   * GET /api/social/following/:userId
   */
  static async getFollowing(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: following.map((f) => f.following),
        count: following.length,
      });
    } catch (error) {
      console.error('[SocialController] Error getting following:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get following',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Block a user
   * POST /api/social/block/:userId
   */
  static async blockUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const blockerId = req.user.id;
      const { userId: blockedId } = req.params;

      if (!blockedId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      // Can't block yourself
      if (blockerId === blockedId) {
        return res.status(400).json({
          success: false,
          error: 'You cannot block yourself',
        });
      }

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: blockedId },
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Check if already blocked
      const existingBlock = await prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });

      if (existingBlock) {
        return res.status(400).json({
          success: false,
          error: 'User is already blocked',
        });
      }

      // Remove follow relationships if they exist
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      });

      // Create block relationship
      await prisma.block.create({
        data: {
          blockerId,
          blockedId,
        },
      });

      console.log(`[SocialController] User ${blockerId} blocked ${blockedId}`);

      res.json({
        success: true,
        message: 'Successfully blocked user',
      });
    } catch (error) {
      console.error('[SocialController] Error blocking user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to block user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Unblock a user
   * DELETE /api/social/block/:userId
   */
  static async unblockUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const blockerId = req.user.id;
      const { userId: blockedId } = req.params;

      if (!blockedId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
      }

      // Check if block exists
      const existingBlock = await prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });

      if (!existingBlock) {
        return res.status(404).json({
          success: false,
          error: 'User is not blocked',
        });
      }

      // Delete block relationship
      await prisma.block.delete({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });

      console.log(`[SocialController] User ${blockerId} unblocked ${blockedId}`);

      res.json({
        success: true,
        message: 'Successfully unblocked user',
      });
    } catch (error) {
      console.error('[SocialController] Error unblocking user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unblock user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all approved creators (discoverable creators)
   * GET /api/social/creators
   */
  static async getCreators(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      console.log(`[SocialController] Getting approved creators (page ${page})`);

      // Get total count
      const totalCount = await prisma.user.count({
        where: {
          creatorApplication: {
            status: 'APPROVED',
          },
        },
      });

      // Get creators
      const creators = await prisma.user.findMany({
        where: {
          creatorApplication: {
            status: 'APPROVED',
          },
        },
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          creatorApplication: {
            select: {
              profile: {
                select: {
                  bio: true,
                  categories: true,
                },
              },
            },
          },
          stream: {
            select: {
              isLive: true,
              title: true,
              thumbnail: true,
            },
          },
          _count: {
            select: {
              followedBy: true, // Follower count
            },
          },
        },
        orderBy: [
          { stream: { isLive: 'desc' } }, // Live creators first
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      });

      res.json({
        success: true,
        data: creators.map((creator) => ({
          id: creator.id,
          username: creator.username,
          name: creator.name,
          image: creator.image,
          bio: creator.creatorApplication?.profile?.bio,
          categories: creator.creatorApplication?.profile?.categories,
          isLive: creator.stream?.isLive || false,
          streamTitle: creator.stream?.title,
          streamThumbnail: creator.stream?.thumbnail,
          followerCount: creator._count.followedBy,
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    } catch (error) {
      console.error('[SocialController] Error getting creators:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get creators',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get creator profile by username
   * GET /api/social/creator/:username
   */
  static async getCreatorProfile(req: Request, res: Response) {
    try {
      const { username } = req.params;
      const currentUserId = req.user?.id;

      if (!username) {
        return res.status(400).json({
          success: false,
          error: 'Username is required',
        });
      }

      console.log(`[SocialController] Getting creator profile: ${username}`);

      const creator = await prisma.user.findUnique({
        where: { username },
        include: {
          creatorApplication: {
            select: {
              status: true,
              profile: {
                select: {
                  bio: true,
                  categories: true,
                  profilePictureUrl: true,
                },
              },
            },
          },
          stream: {
            select: {
              isLive: true,
              title: true,
              thumbnail: true,
              isChatEnabled: true,
              isChatFollowersOnly: true,
            },
          },
          _count: {
            select: {
              followedBy: true, // Follower count
              following: true,  // Following count
            },
          },
        },
      });

      if (!creator) {
        return res.status(404).json({
          success: false,
          error: 'Creator not found',
        });
      }

      // Check if user is an approved creator
      if (
        !creator.creatorApplication ||
        creator.creatorApplication.status !== 'APPROVED'
      ) {
        return res.status(404).json({
          success: false,
          error: 'This user is not an approved creator',
        });
      }

      // Check if current user is following
      let isFollowing = false;
      if (currentUserId) {
        const follow = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUserId,
              followingId: creator.id,
            },
          },
        });
        isFollowing = !!follow;
      }

      res.json({
        success: true,
        data: {
          id: creator.id,
          username: creator.username,
          name: creator.name,
          image: creator.image,
          bio: creator.creatorApplication.profile?.bio,
          categories: creator.creatorApplication.profile?.categories,
          profilePicture: creator.creatorApplication.profile?.profilePictureUrl,
          isLive: creator.stream?.isLive || false,
          streamTitle: creator.stream?.title,
          streamThumbnail: creator.stream?.thumbnail,
          isChatEnabled: creator.stream?.isChatEnabled,
          isChatFollowersOnly: creator.stream?.isChatFollowersOnly,
          followerCount: creator._count.followedBy,
          followingCount: creator._count.following,
          isFollowing,
        },
      });
    } catch (error) {
      console.error('[SocialController] Error getting creator profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get creator profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
