import { useEffect, useState } from 'react';
import { viewerApi, type LiveStream } from '@/lib/api/stream';
import { Loader2 } from 'lucide-react';
import { HomeStreamCard, SectionEmptyState } from './discovery-cards';

export function LiveNowTab() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLiveStreams = async (showLoadingState = false) => {
      try {
        if (showLoadingState && isMounted) {
          setLoading(true);
        }

        const response = await viewerApi.getLiveStreams();

        if (!isMounted) {
          return;
        }

        if (response.success) {
          setStreams(response.data ?? []);
          setError(null);
        } else {
          setError(response.error || 'Failed to load live streams');
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        console.error('Error fetching live streams:', err);
        setError('Failed to load live streams');
      } finally {
        if (showLoadingState && isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchLiveStreams(true);

    const interval = setInterval(() => {
      void fetchLiveStreams();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <SectionEmptyState
        title="Couldn’t load live streams"
        description={error}
      />
    );
  }

  if (streams.length === 0) {
    return (
      <SectionEmptyState
        title="No live streams right now"
        description="No creators are live at the moment. Check back shortly for fresh broadcasts."
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Live now</h2>
        <p className="text-sm text-zinc-400">
          Join creators who are live right now, with real-time room viewer counts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {streams.map((stream) => (
          <HomeStreamCard key={stream.id} stream={stream} />
        ))}
      </div>
    </div>
  );
}
