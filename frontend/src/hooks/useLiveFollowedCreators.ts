import { useQuery } from '@tanstack/react-query';
import { socialApi } from '@/lib/api/social';

export function useLiveFollowedCreators() {
    return useQuery({
        queryKey: ['live-followed-creators'],
        queryFn: async () => {
            const response = await socialApi.getLiveFollowedCreators();
            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to fetch live creators');
            }
            return response.data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
        staleTime: 20000, // Consider stale after 20 seconds
        refetchOnWindowFocus: true,
    });
}
