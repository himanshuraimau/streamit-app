import { useEffect, useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { VideoPlayer } from './video-player';
import { Chat } from './chat';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { streamApi } from '@/lib/api/stream';
import { authClient } from '@/lib/auth-client';
import type { ViewerTokenResponse } from '@/lib/api/stream';

interface StreamPlayerProps {
  hostId: string;
  hostName: string;
  streamInfo: {
    title: string;
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
  streamInfo,
  isFollowing = false 
}: StreamPlayerProps) {
  const [token, setToken] = useState<ViewerTokenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const session = authClient.useSession();

  useEffect(() => {
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

    fetchToken();
  }, [hostId, session.data]);

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <span className="ml-3 text-white">Connecting to stream...</span>
        </div>
      </Card>
    );
  }

  if (error || !token) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to connect to stream</p>
          <p className="text-zinc-500 text-sm">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stream Title */}
      <div>
        <h2 className="text-2xl font-bold text-white">{streamInfo.title}</h2>
        <p className="text-zinc-400 mt-1">Streaming by {hostName}</p>
      </div>

      <LiveKitRoom
        token={token.token}
        serverUrl={token.wsUrl}
        connect={true}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Video Player - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <VideoPlayer 
            hostIdentity={hostId} 
            hostName={hostName} 
          />
        </div>

        {/* Chat - Takes 1 column on large screens */}
        <div className="lg:col-span-1 h-[600px]">
          <Chat
            hostName={hostName}
            isChatEnabled={streamInfo.isChatEnabled}
            isChatDelayed={streamInfo.isChatDelayed}
            isChatFollowersOnly={streamInfo.isChatFollowersOnly}
            isFollowing={isFollowing}
          />
        </div>
      </LiveKitRoom>
    </div>
  );
}
