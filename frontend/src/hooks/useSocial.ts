import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface SocialStats {
  followerCount: number;
  followingCount: number;
}

/**
 * Hook to fetch social stats for a user
 */
export function useSocialStats(userId?: string) {
  const { data: session } = authClient.useSession();
  const targetUserId = userId || session?.user?.id;

  return useQuery({
    queryKey: ['social-stats', targetUserId],
    queryFn: async (): Promise<SocialStats> => {
      if (!targetUserId) {
        throw new Error('User ID is required');
      }

      // Fetch followers count
      const followersResponse = await fetch(
        `${API_BASE_URL}/api/social/followers/${targetUserId}`
      );
      const followersData = await followersResponse.json();

      // Fetch following count
      const followingResponse = await fetch(
        `${API_BASE_URL}/api/social/following/${targetUserId}`
      );
      const followingData = await followingResponse.json();

      return {
        followerCount: followersData.count || 0,
        followingCount: followingData.count || 0,
      };
    },
    enabled: !!targetUserId,
    staleTime: 30000, // Cache for 30 seconds
  });
}
