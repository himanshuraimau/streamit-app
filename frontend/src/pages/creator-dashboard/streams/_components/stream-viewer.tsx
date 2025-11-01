import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { LiveKitRoom } from '@livekit/components-react';
import { VideoPlayer } from '@/components/stream/video-player';
import { Chat } from '@/components/stream/chat';
import { streamApi } from '@/lib/api/stream';
import { authClient } from '@/lib/auth-client';

interface StreamViewerProps {
  streamInfo: {
    id: string;
    title: string;
    description?: string;
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
  };
}

export function StreamViewer({ streamInfo }: StreamViewerProps) {
  const { data: session } = authClient.useSession();
  const [token, setToken] = useState<{
    token: string;
    identity: string;
    name: string;
    wsUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCreatorToken = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[StreamViewer] Fetching creator token...');
        
        const response = await streamApi.getCreatorViewToken();
        
        if (response.success && response.data) {
          setToken(response.data);
          console.log('[StreamViewer] Creator token received successfully');
        } else {
          setError(response.error || 'Failed to get stream token');
        }
      } catch (err) {
        console.error('[StreamViewer] Error fetching creator token:', err);
        setError('Failed to connect to stream');
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorToken();
  }, []);

  if (!session?.user) {
    return null;
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-lg font-semibold text-white">Your Live Stream</h3>
        <p className="text-sm text-zinc-400">Preview how your stream appears to viewers</p>
      </div>
      
      <div className="aspect-video bg-black relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Connecting to stream...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && token && (
          <LiveKitRoom
            token={token.token}
            serverUrl={token.wsUrl}
            connect={true}
            className="w-full h-full"
          >
            <div className="flex w-full h-full">
              {/* Video Player */}
              <div className={streamInfo.isChatEnabled ? 'w-2/3' : 'w-full'}>
                <VideoPlayer 
                  hostIdentity={token.identity}
                  hostName={token.name}
                />
              </div>

              {/* Chat */}
              {streamInfo.isChatEnabled && (
                <div className="w-1/3 border-l border-zinc-800">
                  <Chat
                    hostName={token.name}
                    isFollowing={false}
                    isChatEnabled={streamInfo.isChatEnabled}
                    isChatDelayed={streamInfo.isChatDelayed}
                    isChatFollowersOnly={streamInfo.isChatFollowersOnly}
                  />
                </div>
              )}
            </div>
          </LiveKitRoom>
        )}
      </div>
    </Card>
  );
}
