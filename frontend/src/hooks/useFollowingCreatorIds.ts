import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { socialApi } from '@/lib/api/social';

export function useFollowingCreatorIds() {
  const { data: session } = useSession();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setFollowingIds(new Set());
      setPendingIds(new Set());
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchFollowing = async () => {
      try {
        setLoading(true);
        const response = await socialApi.getFollowing(session.user.id);

        if (!isActive || !response.success || !response.data) {
          return;
        }

        setFollowingIds(new Set(response.data.map((creator) => creator.id)));
      } catch (error) {
        console.error('Error fetching following creator ids:', error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchFollowing();

    return () => {
      isActive = false;
    };
  }, [session?.user?.id]);

  const toggleFollow = useCallback(
    async (creatorId: string) => {
      if (!session?.user) {
        throw new Error('AUTH_REQUIRED');
      }

      const wasFollowing = followingIds.has(creatorId);

      setPendingIds((prev) => {
        const next = new Set(prev);
        next.add(creatorId);
        return next;
      });

      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (wasFollowing) {
          next.delete(creatorId);
        } else {
          next.add(creatorId);
        }
        return next;
      });

      try {
        const response = wasFollowing
          ? await socialApi.unfollowUser(creatorId)
          : await socialApi.followUser(creatorId);

        if (!response.success) {
          throw new Error(response.message || 'Failed to update follow state');
        }
      } catch (error) {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          if (wasFollowing) {
            next.add(creatorId);
          } else {
            next.delete(creatorId);
          }
          return next;
        });

        throw error;
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(creatorId);
          return next;
        });
      }
    },
    [followingIds, session?.user]
  );

  const isFollowing = useCallback(
    (creatorId: string) => followingIds.has(creatorId),
    [followingIds]
  );

  const isPending = useCallback(
    (creatorId: string) => pendingIds.has(creatorId),
    [pendingIds]
  );

  return {
    session,
    loading,
    isFollowing,
    isPending,
    toggleFollow,
  };
}
