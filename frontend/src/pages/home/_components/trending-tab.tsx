import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, TrendingUp as TrendingUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrending } from '@/hooks/useTrending';
import { useTrendingShorts } from '@/hooks/useShorts';
import {
  HomeMediaCard,
  HomeShortCard,
  SectionEmptyState,
  isPhotoPost,
  isShortPost,
} from './discovery-cards';

export function TrendingTab() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const navigate = useNavigate();
  const trendingPhotosQuery = useTrending(timeRange);
  const trendingShortsQuery = useTrendingShorts(timeRange);

  const trendingPhotos = useMemo(
    () => (trendingPhotosQuery.data?.posts || []).filter(isPhotoPost),
    [trendingPhotosQuery.data]
  );

  const trendingShorts = useMemo(
    () => (trendingShortsQuery.data?.posts || []).filter(isShortPost),
    [trendingShortsQuery.data]
  );

  if (trendingPhotosQuery.isLoading || trendingShortsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-zinc-800 bg-linear-to-br from-zinc-950 via-zinc-950 to-zinc-900 p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-300">
              <TrendingUpIcon className="h-3.5 w-3.5 text-orange-400" />
              Trending discovery
            </div>
            <h2 className="text-3xl font-bold text-white">Trending photos and shorts</h2>
            <p className="max-w-2xl text-sm text-zinc-400">
              Ranked by likes, comments, views, shares, and recency so the most engaging creator content rises to the top.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: '24h', value: '24h' as const },
              { label: '7 days', value: '7d' as const },
              { label: '30 days', value: '30d' as const },
            ].map((option) => (
              <Button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                variant={timeRange === option.value ? 'default' : 'outline'}
                className={
                  timeRange === option.value
                    ? 'bg-white text-black hover:bg-zinc-200'
                    : 'border-zinc-700 bg-transparent text-white hover:bg-zinc-900'
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Trending photos</h3>
          <p className="text-sm text-zinc-400">High-engagement photo posts from across the platform.</p>
        </div>

        {trendingPhotosQuery.isError ? (
          <SectionEmptyState
            title="Couldn’t load trending photos"
            description="The engagement-ranked photo feed hit an error. Refresh the page and try again."
          />
        ) : trendingPhotos.length === 0 ? (
          <SectionEmptyState
            title="No trending photos yet"
            description="As creator photo posts pick up traction, they’ll appear here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {trendingPhotos.slice(0, 6).map((post) => (
              <HomeMediaCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Trending shorts</h3>
            <p className="text-sm text-zinc-400">Short-form clips ranked by engagement instead of recycled live streams.</p>
          </div>
          <Button
            onClick={() => navigate('/shorts')}
            variant="outline"
            className="border-zinc-700 bg-transparent text-white hover:bg-zinc-900"
          >
            Watch shorts
          </Button>
        </div>

        {trendingShortsQuery.isError ? (
          <SectionEmptyState
            title="Couldn’t load trending shorts"
            description="The ranked shorts feed hit an error. Refresh the page and try again."
          />
        ) : trendingShorts.length === 0 ? (
          <SectionEmptyState
            title="No trending shorts yet"
            description="Once short videos start moving, they’ll show up here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {trendingShorts.slice(0, 4).map((post) => (
              <HomeShortCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
