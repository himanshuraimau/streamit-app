import { useEffect, useState } from 'react';
import { viewerApi, type LiveStream } from '@/lib/api/stream';
import { Loader2, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { MainLayout } from '@/layouts/main-layout';

export default function LivePage() {
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        setLoading(true);
        const response = await viewerApi.getLiveStreams();
        if (response.success && response.data) {
          setLiveStreams(response.data);
        }
      } catch (error) {
        console.error('[LivePage] Error fetching live streams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveStreams();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Radio className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-white">Live Now</h1>
          </div>
          <p className="text-zinc-400">Watch live streams from your favorite creators</p>
        </div>

      {liveStreams.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800 p-12">
          <div className="text-center space-y-4">
            <Radio className="w-16 h-16 text-zinc-600 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">No Live Streams</h3>
              <p className="text-zinc-400">
                There are no live streams at the moment. Check back later!
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {liveStreams.map((stream) => (
            <Link key={stream.id} to={`/${stream.user.username}`}>
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden hover:border-purple-500 transition-all group">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-zinc-800">
                  {stream.thumbnail ? (
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Radio className="w-12 h-12 text-zinc-600" />
                    </div>
                  )}
                  {/* Live Badge */}
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </div>
                </div>

                {/* Stream Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0">
                      {stream.user.image ? (
                        <img
                          src={stream.user.image}
                          alt={stream.user.name || stream.user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{(stream.user.name || stream.user.username).charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold line-clamp-2 group-hover:text-purple-400 transition-colors">
                        {stream.title}
                      </h3>
                      <p className="text-zinc-400 text-sm mt-1">
                        {stream.user.name || stream.user.username}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </div>
    </MainLayout>
  );
}
