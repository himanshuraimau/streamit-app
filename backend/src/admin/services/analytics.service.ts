import { db } from '../../lib/db';
import { cache } from '../lib/cache';

interface DateRange {
  start: Date;
  end: Date;
}

interface OverviewMetrics {
  dau: number;
  mau: number;
  concurrentViewers: number;
  totalRevenue: number;
  conversionRate: number;
}

interface TopStreamer {
  id: string;
  name: string;
  username: string;
  totalRevenue: number;
  giftCount: number;
  averageViewers: number;
  streamHours: number;
}

interface TopContent {
  id: string;
  title: string;
  authorName: string;
  views: number;
  likes: number;
  engagement: number;
}

interface ConversionFunnel {
  totalViewers: number;
  viewersWhoSentGifts: number;
  averageGiftValue: number;
  conversionPercentage: number;
}

export class AnalyticsService {
  /**
   * Parse date range parameter into start and end dates
   */
  private static parseDateRange(dateRange: string): DateRange {
    const now = new Date();
    const end = now;
    let start: Date;

    switch (dateRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case '7days':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        // Default to last 30 days
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  /**
   * Get overview metrics: DAU, MAU, revenue, concurrent users, conversion rate
   * Cached for 5 minutes
   */
  static async getOverview(dateRange: string): Promise<OverviewMetrics> {
    const cacheKey = `analytics:overview:${dateRange}`;
    const cached = cache.get<OverviewMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const { start, end } = this.parseDateRange(dateRange);

    // Calculate DAU (Daily Active Users) - users who logged in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dau = await db.user.count({
      where: {
        lastLoginAt: {
          gte: today,
        },
      },
    });

    // Calculate MAU (Monthly Active Users) - users who logged in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const mau = await db.user.count({
      where: {
        lastLoginAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calculate concurrent viewers (users currently watching live streams)
    const concurrentViewers = await db.stream.aggregate({
      where: {
        isLive: true,
      },
      _sum: {
        // Note: This would need a currentViewers field in Stream model
        // For now, we'll use a placeholder calculation
      },
    });

    // Get concurrent viewers from stream stats
    const liveStreams = await db.streamStats.findMany({
      where: {
        stream: {
          isLive: true,
        },
      },
      select: {
        totalViewers: true,
      },
    });

    const totalConcurrentViewers = liveStreams.reduce(
      (sum, stat) => sum + stat.totalViewers,
      0
    );

    // Calculate total revenue from gift transactions in date range
    const giftRevenue = await db.giftTransaction.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        coinAmount: true,
      },
    });

    const totalRevenue = giftRevenue._sum.coinAmount || 0;

    // Calculate conversion rate (viewers who sent gifts / total viewers)
    const totalViewers = await db.user.count({
      where: {
        lastLoginAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const viewersWhoSentGifts = await db.user.count({
      where: {
        giftsSent: {
          some: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
      },
    });

    const conversionRate =
      totalViewers > 0 ? (viewersWhoSentGifts / totalViewers) * 100 : 0;

    const result = {
      dau,
      mau,
      concurrentViewers: totalConcurrentViewers,
      totalRevenue,
      conversionRate,
    };

    // Cache for 5 minutes (300 seconds)
    cache.set(cacheKey, result, 300);

    return result;
  }

  /**
   * Get top streamers ranked by revenue
   * Cached for 10 minutes
   */
  static async getTopStreamers(
    dateRange: string,
    limit: number = 10
  ): Promise<TopStreamer[]> {
    const cacheKey = `analytics:topStreamers:${dateRange}:${limit}`;
    const cached = cache.get<TopStreamer[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const { start, end } = this.parseDateRange(dateRange);

    // Get streamers with their gift revenue
    const topStreamers = await db.user.findMany({
      where: {
        role: 'CREATOR',
        giftsReceived: {
          some: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        username: true,
        giftsReceived: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          select: {
            coinAmount: true,
            quantity: true,
          },
        },
        stream: {
          select: {
            stats: {
              select: {
                totalViewers: true,
                startedAt: true,
                endedAt: true,
              },
            },
          },
        },
      },
      take: limit * 2, // Get more to sort and filter
    });

    // Calculate metrics for each streamer
    const streamersWithMetrics = topStreamers.map((streamer) => {
      const totalRevenue = streamer.giftsReceived.reduce(
        (sum, gift) => sum + gift.coinAmount * gift.quantity,
        0
      );

      const giftCount = streamer.giftsReceived.reduce(
        (sum, gift) => sum + gift.quantity,
        0
      );

      // Calculate stream hours
      let streamHours = 0;
      if (streamer.stream?.stats) {
        const { startedAt, endedAt } = streamer.stream.stats;
        if (startedAt && endedAt) {
          streamHours =
            (endedAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
        }
      }

      const averageViewers = streamer.stream?.stats?.totalViewers || 0;

      return {
        id: streamer.id,
        name: streamer.name,
        username: streamer.username,
        totalRevenue,
        giftCount,
        averageViewers,
        streamHours,
      };
    });

    // Sort by revenue and take top N
    const result = streamersWithMetrics
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    // Cache for 10 minutes (600 seconds)
    cache.set(cacheKey, result, 600);

    return result;
  }

  /**
   * Get top content (shorts, posts, streams) by engagement
   * Cached for 10 minutes
   */
  static async getTopContent(
    dateRange: string,
    type: 'shorts' | 'posts' | 'streams',
    limit: number = 10
  ): Promise<TopContent[]> {
    const cacheKey = `analytics:topContent:${dateRange}:${type}:${limit}`;
    const cached = cache.get<TopContent[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const { start, end } = this.parseDateRange(dateRange);

    if (type === 'shorts') {
      // Get top shorts by views
      const topShorts = await db.post.findMany({
        where: {
          isShort: true,
          type: 'VIDEO',
          isPublic: true,
          isHidden: false,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          content: true,
          viewsCount: true,
          likesCount: true,
          commentsCount: true,
          sharesCount: true,
          author: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          viewsCount: 'desc',
        },
        take: limit,
      });

      const result = topShorts.map((short) => ({
        id: short.id,
        title: short.content?.substring(0, 50) || 'Short Video',
        authorName: short.author.name,
        views: short.viewsCount,
        likes: short.likesCount,
        engagement:
          short.likesCount + short.commentsCount + short.sharesCount,
      }));

      // Cache for 10 minutes (600 seconds)
      cache.set(cacheKey, result, 600);
      return result;
    } else if (type === 'posts') {
      // Get top posts by engagement
      const topPosts = await db.post.findMany({
        where: {
          isShort: false,
          isPublic: true,
          isHidden: false,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          content: true,
          viewsCount: true,
          likesCount: true,
          commentsCount: true,
          sharesCount: true,
          author: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { likesCount: 'desc' },
          { commentsCount: 'desc' },
          { viewsCount: 'desc' },
        ],
        take: limit,
      });

      const result = topPosts.map((post) => ({
        id: post.id,
        title: post.content?.substring(0, 50) || 'Post',
        authorName: post.author.name,
        views: post.viewsCount,
        likes: post.likesCount,
        engagement:
          post.likesCount + post.commentsCount + post.sharesCount,
      }));

      // Cache for 10 minutes (600 seconds)
      cache.set(cacheKey, result, 600);
      return result;
    } else {
      // Get top streams by peak viewers
      const topStreams = await db.stream.findMany({
        where: {
          stats: {
            startedAt: {
              gte: start,
              lte: end,
            },
          },
        },
        select: {
          id: true,
          title: true,
          user: {
            select: {
              name: true,
            },
          },
          stats: {
            select: {
              peakViewers: true,
              totalViewers: true,
              totalLikes: true,
              totalGifts: true,
            },
          },
        },
        orderBy: {
          stats: {
            peakViewers: 'desc',
          },
        },
        take: limit,
      });

      const result = topStreams.map((stream) => ({
        id: stream.id,
        title: stream.title,
        authorName: stream.user.name,
        views: stream.stats?.totalViewers || 0,
        likes: stream.stats?.totalLikes || 0,
        engagement:
          (stream.stats?.totalLikes || 0) + (stream.stats?.totalGifts || 0),
      }));

      // Cache for 10 minutes (600 seconds)
      cache.set(cacheKey, result, 600);
      return result;
    }
  }

  /**
   * Get conversion funnel metrics
   * Cached for 10 minutes
   */
  static async getConversionFunnel(
    dateRange: string
  ): Promise<ConversionFunnel> {
    const cacheKey = `analytics:conversionFunnel:${dateRange}`;
    const cached = cache.get<ConversionFunnel>(cacheKey);
    if (cached) {
      return cached;
    }

    const { start, end } = this.parseDateRange(dateRange);

    // Total viewers (users who logged in during period)
    const totalViewers = await db.user.count({
      where: {
        lastLoginAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Viewers who sent gifts
    const viewersWhoSentGifts = await db.user.count({
      where: {
        giftsSent: {
          some: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
      },
    });

    // Calculate average gift value
    const giftStats = await db.giftTransaction.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _avg: {
        coinAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const averageGiftValue = giftStats._avg.coinAmount || 0;

    // Calculate conversion percentage
    const conversionPercentage =
      totalViewers > 0 ? (viewersWhoSentGifts / totalViewers) * 100 : 0;

    const result = {
      totalViewers,
      viewersWhoSentGifts,
      averageGiftValue,
      conversionPercentage,
    };

    // Cache for 10 minutes (600 seconds)
    cache.set(cacheKey, result, 600);

    return result;
  }
}
