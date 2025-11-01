import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { viewerApi, type StreamByUsername } from '@/lib/api/stream';
import { StreamPlayer } from '@/components/stream/stream-player';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function WatchStream() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const [stream, setStream] = useState<StreamByUsername | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStream = async () => {
      if (!username) {
        setError('No username provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('[WatchStream] Fetching stream for username:', username);
        const response = await viewerApi.getStreamByUsername(username);
        
        if (response.success && response.data) {
          setStream(response.data);
          console.log('[WatchStream] Stream loaded:', response.data);
        } else {
          setError(response.error || 'Stream not found');
        }
      } catch (err) {
        console.error('[WatchStream] Error fetching stream:', err);
        setError('Failed to load stream');
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
          <p className="text-white">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-800 p-8 max-w-md w-full">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Stream Not Found</h2>
            <p className="text-zinc-400">
              {error || 'This stream does not exist or is not available.'}
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="border-zinc-700 hover:bg-zinc-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button
                onClick={() => navigate('/')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Browse Streams
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <img
                src={stream.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.user.username}`}
                alt={stream.user.username}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h1 className="font-semibold text-white">{stream.user.name || stream.user.username}</h1>
                <p className="text-sm text-zinc-400">@{stream.user.username}</p>
              </div>
            </div>
            {stream.isLive && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-600 text-white text-xs font-semibold ml-auto">
                <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse"></span>
                LIVE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stream Player */}
      <div className="container mx-auto px-4 py-6">
        {stream.isLive ? (
          <StreamPlayer
            hostId={stream.userId}
            hostName={stream.user.name || stream.user.username}
            streamInfo={{
              title: stream.title,
              isChatEnabled: stream.isChatEnabled,
              isChatDelayed: stream.isChatDelayed,
              isChatFollowersOnly: stream.isChatFollowersOnly,
            }}
            isFollowing={false} // TODO: Implement follow status check
          />
        ) : (
          <Card className="bg-zinc-900 border-zinc-800 p-12">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto">
                <svg
                  className="w-10 h-10 text-zinc-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <circle cx="10" cy="10" r="3" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Stream Offline</h2>
              <p className="text-zinc-400 max-w-md mx-auto">
                {stream.user.name || stream.user.username} is not streaming right now.
                Check back later!
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
