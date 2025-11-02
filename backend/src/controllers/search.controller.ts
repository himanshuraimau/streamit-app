import type { Request, Response } from 'express';
import { prisma } from '../lib/db';

export interface SearchQuery {
  q: string;
  type?: 'all' | 'streams' | 'users' | 'categories';
  live?: string | boolean;
  category?: string;
  sort?: 'relevance' | 'viewers' | 'recent';
  limit?: string | number;
  offset?: string | number;
}

export interface SearchResults {
  streams: Array<{
    id: string;
    name: string;
    thumbnailUrl: string | null;
    isLive: boolean;
    viewerCount: number;
    category: string | null;
    user: {
      id: string;
      username: string | null;
      imageUrl: string | null;
    };
  }>;
  users: Array<{
    id: string;
    username: string | null;
    imageUrl: string | null;
    bio: string | null;
    isLive: boolean;
    followerCount: number;
  }>;
  categories: Array<{
    name: string;
    streamCount: number;
    viewerCount: number;
  }>;
  total: {
    streams: number;
    users: number;
    categories: number;
  };
}

export class SearchController {
  /**
   * Search across streams, users, and categories
   */
  async search(req: Request, res: Response) {
    try {
      const {
        q,
        type = 'all',
        live,
        category,
        sort = 'relevance',
        limit = 20,
        offset = 0,
      } = req.query as unknown as SearchQuery;

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      const searchTerm = q.trim().toLowerCase();
      const limitNum = Math.min(Number(limit) || 20, 50); // Max 50 results
      const offsetNum = Number(offset) || 0;

      const results: SearchResults = {
        streams: [],
        users: [],
        categories: [],
        total: {
          streams: 0,
          users: 0,
          categories: 0,
        },
      };

      // Search Streams
      if (type === 'all' || type === 'streams') {
        const streamWhereClause: any = {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { user: { username: { contains: searchTerm, mode: 'insensitive' } } },
          ],
        };

        if (live !== undefined) {
          streamWhereClause.isLive = live === 'true' || live === true;
        }

        // Note: Removed category filter as Stream model doesn't have category field
        // This can be added later by updating the schema if needed

        // Get total count
        results.total.streams = await prisma.stream.count({
          where: streamWhereClause,
        });

        // Build order by clause
        let orderBy: any = {};
        switch (sort) {
          case 'viewers':
            // Can't sort by viewers since we don't have viewerCount in schema
            // Fall back to isLive + recent
            orderBy = [{ isLive: 'desc' }, { updatedAt: 'desc' }];
            break;
          case 'recent':
            orderBy = { updatedAt: 'desc' };
            break;
          default: // relevance
            orderBy = [
              { isLive: 'desc' }, // Live streams first
              { updatedAt: 'desc' }, // Then by most recent
            ];
        }

        const streams = await prisma.stream.findMany({
          where: streamWhereClause,
          take: limitNum,
          skip: offsetNum,
          orderBy,
          select: {
            id: true,
            title: true,
            thumbnail: true,
            isLive: true,
            user: {
              select: {
                id: true,
                username: true,
                image: true,
              },
            },
          },
        });

        // Transform to match expected response format
        results.streams = streams.map((stream: any) => ({
          id: stream.id,
          name: stream.title,
          thumbnailUrl: stream.thumbnail,
          isLive: stream.isLive,
          viewerCount: 0, // Will be updated with actual viewer count from LiveKit
          category: null, // Not available in current schema
          user: {
            id: stream.user.id,
            username: stream.user.username,
            imageUrl: stream.user.image,
          },
        }));
      }

      // Search Users
      if (type === 'all' || type === 'users') {
        const userWhereClause: any = {
          OR: [
            { username: { contains: searchTerm, mode: 'insensitive' } },
            { name: { contains: searchTerm, mode: 'insensitive' } },
          ],
        };

        // Get total count
        results.total.users = await prisma.user.count({
          where: userWhereClause,
        });

        const users = await prisma.user.findMany({
          where: userWhereClause,
          take: limitNum,
          skip: offsetNum,
          orderBy: {
            followedBy: {
              _count: 'desc',
            },
          },
          select: {
            id: true,
            username: true,
            image: true,
            name: true,
            stream: {
              select: {
                isLive: true,
              },
            },
            _count: {
              select: {
                followedBy: true,
              },
            },
            creatorApplication: {
              select: {
                profile: {
                  select: {
                    bio: true,
                  },
                },
              },
            },
          },
        });

        // Transform to include isLive at user level
        results.users = users.map((user: any) => ({
          id: user.id,
          username: user.username,
          imageUrl: user.image,
          bio: user.creatorApplication?.profile?.bio || null,
          isLive: user.stream?.isLive || false,
          followerCount: user._count.followedBy,
        }));
      }

      // Search Categories
      // Note: Categories are stored in CreatorProfile, not Stream
      if (type === 'all' || type === 'categories') {
        // Get categories from creator profiles
        const profiles = await prisma.creatorProfile.findMany({
          where: {
            creatorApplication: {
              status: 'APPROVED',
            },
          },
          select: {
            categories: true,
            creatorApplication: {
              select: {
                user: {
                  select: {
                    stream: {
                      select: {
                        isLive: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        // Count categories
        const categoryMap = new Map<string, { streamCount: number; viewerCount: number }>();
        
        profiles.forEach((profile) => {
          profile.categories.forEach((category) => {
            const catStr = category.toString();
            if (catStr.toLowerCase().includes(searchTerm)) {
              if (!categoryMap.has(catStr)) {
                categoryMap.set(catStr, { streamCount: 0, viewerCount: 0 });
              }
              const stats = categoryMap.get(catStr)!;
              stats.streamCount += 1;
              // ViewerCount will be 0 for now as we don't have it in the schema
            }
          });
        });

        results.total.categories = categoryMap.size;
        results.categories = Array.from(categoryMap.entries())
          .map(([name, stats]) => ({
            name,
            streamCount: stats.streamCount,
            viewerCount: stats.viewerCount,
          }))
          .slice(offsetNum, offsetNum + limitNum);
      }

      return res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error('[SearchController] Search error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to perform search',
      });
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async suggestions(req: Request, res: Response) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.json({
          success: true,
          data: [],
        });
      }

      const searchTerm = q.trim().toLowerCase();

      // Get suggestions from usernames and stream titles
      const [users, streams] = await Promise.all([
        prisma.user.findMany({
          where: {
            username: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          select: { username: true },
          take: 5,
        }),
        prisma.stream.findMany({
          where: {
            title: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          select: { title: true },
          take: 5,
        }),
      ]);

      const suggestions = [
        ...users.map((u) => u.username).filter(Boolean),
        ...streams.map((s) => s.title),
      ];

      // Remove duplicates and limit to 10
      const uniqueSuggestions = [...new Set(suggestions)].slice(0, 10);

      return res.json({
        success: true,
        data: uniqueSuggestions,
      });
    } catch (error) {
      console.error('[SearchController] Suggestions error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get suggestions',
      });
    }
  }
}
