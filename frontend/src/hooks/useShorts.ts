import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content';

// Hook for following shorts (infinite scroll)
export function useFollowingShorts() {
    return useInfiniteQuery({
        queryKey: ['shorts', 'following'],
        queryFn: ({ pageParam }) =>
            contentApi.getFollowingShorts({ cursor: pageParam, limit: 10 }),
        getNextPageParam: (lastPage) => {
            if (!lastPage.success || !lastPage.data) return undefined;
            return lastPage.data.hasMore ? lastPage.data.nextCursor : undefined;
        },
        initialPageParam: undefined as string | undefined,
    });
}

// Hook for trending shorts
export function useTrendingShorts(timeRange: '24h' | '7d' | '30d' = '7d') {
    return useQuery({
        queryKey: ['shorts', 'trending', timeRange],
        queryFn: async () => {
            const response = await contentApi.getTrendingShorts({ timeRange, limit: 20 });
            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to fetch trending shorts');
            }
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// Hook for all shorts (discover, infinite scroll)
export function useAllShorts() {
    return useInfiniteQuery({
        queryKey: ['shorts', 'all'],
        queryFn: ({ pageParam }) =>
            contentApi.getAllShorts({ cursor: pageParam, limit: 10 }),
        getNextPageParam: (lastPage) => {
            if (!lastPage.success || !lastPage.data) return undefined;
            return lastPage.data.hasMore ? lastPage.data.nextCursor : undefined;
        },
        initialPageParam: undefined as string | undefined,
    });
}
