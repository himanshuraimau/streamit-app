import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';

export function useTrending(timeRange: '24h' | '7d' | '30d' = '7d') {
    return useQuery({
        queryKey: ['trending', timeRange],
        queryFn: async () => {
            const response = await contentApi.getTrending({ timeRange, limit: 20 });
            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to fetch trending content');
            }
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
}
