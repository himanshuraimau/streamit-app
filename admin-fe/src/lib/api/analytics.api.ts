import { adminClient } from './client';

export type DateRange = 'today' | '7days' | '30days' | '90days' | 'custom';

export interface OverviewMetrics {
  dau: number;
  mau: number;
  concurrentViewers: number;
  totalRevenue: number;
  conversionRate: number;
  dauChange?: number;
  mauChange?: number;
  revenueChange?: number;
  conversionChange?: number;
  dauTrend?: Array<{ date: string; value: number }>;
  mauTrend?: Array<{ date: string; value: number }>;
}

export interface TopStreamer {
  id: string;
  name: string;
  totalRevenue: number;
  giftCount: number;
  averageViewers: number;
  streamHours: number;
}

export interface TopContent {
  id: string;
  title: string;
  authorName: string;
  views: number;
  likes: number;
  engagement: number;
  type?: 'short' | 'post' | 'stream';
}

export interface ConversionFunnel {
  totalViewers: number;
  viewersWhoSentGifts: number;
  averageGiftValue: number;
  conversionPercentage: number;
}

export const analyticsApi = {
  getOverview: async (dateRange: DateRange): Promise<OverviewMetrics> => {
    const response = await adminClient.get('/api/admin/analytics/overview', {
      params: { dateRange },
    });
    return response.data.data || response.data;
  },

  getTopStreamers: async (dateRange: DateRange, limit: number = 10): Promise<TopStreamer[]> => {
    const response = await adminClient.get('/api/admin/analytics/streamers', {
      params: { dateRange, limit },
    });
    return response.data.data || response.data;
  },

  getTopContent: async (dateRange: DateRange, type: 'shorts' | 'posts' | 'streams', limit: number = 50): Promise<TopContent[]> => {
    const response = await adminClient.get('/api/admin/analytics/content', {
      params: { dateRange, type, limit },
    });
    return response.data.data || response.data;
  },

  getConversionFunnel: async (dateRange: DateRange): Promise<ConversionFunnel> => {
    const response = await adminClient.get('/api/admin/analytics/conversion', {
      params: { dateRange },
    });
    return response.data.data || response.data;
  },
};
