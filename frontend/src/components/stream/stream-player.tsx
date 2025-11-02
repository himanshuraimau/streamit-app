import { useEffect, useState } from 'react';
import { streamApi } from '@/lib/api/stream';
import { authClient } from '@/lib/auth-client';
import { StreamLayout } from '@/pages/watch/_components/stream-layout';
import type { ViewerTokenResponse } from '@/lib/api/stream';

interface StreamPlayerProps {
  hostId: string;
  hostName: string;
  streamInfo?: {
    title: string;
    description?: string;
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
  };
  isFollowing?: boolean;
}

// Generate a random guest name
const generateGuestName = () => {
  const adjectives = ['Happy', 'Lucky', 'Clever', 'Swift', 'Brave', 'Bright', 'Cool', 'Epic', 'Noble', 'Wise'];
  const nouns = ['Panda', 'Tiger', 'Eagle', 'Fox', 'Wolf', 'Lion', 'Bear', 'Hawk', 'Dragon', 'Phoenix'];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

export function StreamPlayer({ 
  hostId, 
  hostName,
  streamInfo: providedStreamInfo,
  isFollowing = false
}: StreamPlayerProps) {
  const [token, setToken] = useState<ViewerTokenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const session = authClient.useSession();

  // Default stream info if not provided
  const streamInfo = providedStreamInfo || {
    title: `${hostName}'s Stream`,
    description: '',
    isChatEnabled: true,
    isChatDelayed: false,
    isChatFollowersOnly: false,
  };

  const fetchToken = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If not authenticated, generate a guest name
      const isAuthenticated = session.data?.user != null;
      const guestName = !isAuthenticated ? generateGuestName() : undefined;
      
      console.log('[StreamPlayer] Fetching token - authenticated:', isAuthenticated, 'hostId:', hostId, 'guestName:', guestName);
      const response = await streamApi.getViewerToken(hostId, guestName);
      console.log('[StreamPlayer] Token response:', response);
      
      if (response.success && response.data) {
        setToken(response.data);
      } else {
        const errorMsg = response.error || 'Failed to get viewer token';
        console.error('[StreamPlayer] Token error:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to stream';
      console.error('[StreamPlayer] Fetch error:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostId, session.data]);

  return (
    <StreamLayout
      token={token}
      loading={loading}
      error={error}
      streamInfo={streamInfo}
      hostName={hostName}
      hostIdentity={hostId}
      isFollowing={isFollowing}
      onRetry={fetchToken}
      variant="viewer"
    />
  );
}
