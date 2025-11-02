import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { viewerApi, type LiveStream } from '@/lib/api/stream';
import { Card } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';

export function LiveNowTab() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await viewerApi.getLiveStreams();
        
        if (response.success && response.data) {
          setStreams(response.data);
        } else {
          setError(response.error || 'Failed to load live streams');
        }
      } catch (err) {
        console.error('Error fetching live streams:', err);
        setError('Failed to load live streams');
      } finally {
        setLoading(false);
      }
    };

    fetchLiveStreams();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchLiveStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="text-center space-y-4 max-w-2xl">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-linear-to-r from-pink-500 to-purple-600 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <circle cx="10" cy="10" r="3" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">No Live Streams</h2>
          <p className="text-lg text-zinc-400">
            No one is streaming right now. Check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Live Now ({streams.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {streams.map((stream) => (
          <Card
            key={stream.id}
            onClick={() => navigate(`/${stream.user.username}/live`)}
            className="group cursor-pointer bg-zinc-900 border-zinc-800 overflow-hidden hover:border-purple-500 transition-all duration-300 hover:scale-105"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-zinc-800">
              {stream.thumbnail ? (
                <img
                  src={stream.thumbnail}
                  alt={stream.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-linear-to-r from-pink-500 to-purple-600 flex items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Live badge */}
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center px-2 py-1 rounded bg-red-600 text-white text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"></span>
                  LIVE
                </span>
              </div>

              {/* Viewer count (placeholder for now) */}
              <div className="absolute top-2 right-2">
                <span className="inline-flex items-center px-2 py-1 rounded bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                  <Users className="w-3 h-3 mr-1" />
                  {Math.floor(Math.random() * 1000)}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              {/* User info */}
              <div className="flex items-start gap-3">
                <img
                  src={stream.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.user.username}`}
                  alt={stream.user.username}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                    {stream.title}
                  </h3>
                  <p className="text-sm text-zinc-400 truncate">
                    {stream.user.name || stream.user.username}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
