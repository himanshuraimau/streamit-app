import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { viewerApi, type LiveStream } from '@/lib/api/stream';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, Sparkles } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useFeed } from '@/hooks/useContent';
import { useFollowingShorts } from '@/hooks/useShorts';
import {
  HomeMediaCard,
  HomeShortCard,
  HomeStreamCard,
  SectionEmptyState,
  isPhotoPost,
  isShortPost,
} from './discovery-cards';

export function FollowingTab() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [streamsError, setStreamsError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: session } = useSession();
  const followedFeedQuery = useFeed({ limit: 12 }, { enabled: !!session?.user });
  const followingShortsQuery = useFollowingShorts({ enabled: !!session?.user });

  useEffect(() => {
    if (!session?.user) {
      setStreams([]);
      setStreamsLoading(false);
      setStreamsError(null);
      return;
    }

    const fetchFollowedStreams = async () => {
      try {
        setStreamsLoading(true);
        setStreamsError(null);

        const response = await viewerApi.getFollowedStreams();

        if (response.success && response.data) {
          setStreams(response.data);
        } else {
          setStreamsError(response.error || 'Failed to load followed streams');
        }
      } catch (err) {
        console.error('Error fetching followed streams:', err);
        setStreamsError('Failed to load followed streams');
      } finally {
        setStreamsLoading(false);
      }
    };

    fetchFollowedStreams();

    const interval = setInterval(fetchFollowedStreams, 30000);
    return () => clearInterval(interval);
  }, [session?.user]);

  const followedPosts = useMemo(
    () =>
      (followedFeedQuery.data?.pages.flatMap((page) =>
        page.success ? page.data?.posts || [] : []
      ) || []).filter(isPhotoPost),
    [followedFeedQuery.data]
  );

  const followedShorts = useMemo(
    () =>
      (followingShortsQuery.data?.pages.flatMap((page) =>
        page.success ? page.data?.posts || [] : []
      ) || []).filter(isShortPost),
    [followingShortsQuery.data]
  );

  if (!session?.user) {
    return (
      <SectionEmptyState
        title="Sign in to unlock your Following feed"
        description="We’ll show photos, shorts, and live streams from creators you already follow."
        actionLabel="Sign in"
        onAction={() => navigate('/auth/signin')}
      />
    );
  }

  if (streamsLoading && followedFeedQuery.isLoading && followingShortsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-zinc-800 bg-linear-to-br from-zinc-950 via-zinc-950 to-zinc-900 p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              Following feed
            </div>
            <h2 className="text-3xl font-bold text-white">Photos, shorts, and live creators you follow</h2>
            <p className="max-w-2xl text-sm text-zinc-400">
              Your home feed now blends followed creators&apos; photo posts, short videos, and current live sessions in one place.
            </p>
          </div>

          <Button
            onClick={() => navigate('/creators')}
            variant="secondary"
            className="bg-white text-black hover:bg-zinc-200"
          >
            Discover creators
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Photos from followed creators</h3>
          <p className="text-sm text-zinc-400">Fresh image posts from the people you chose to keep up with.</p>
        </div>

        {followedFeedQuery.isError ? (
          <SectionEmptyState
            title="Couldn’t load followed photos"
            description="The followed-photo feed hit an error. Refresh the page and try again."
          />
        ) : followedPosts.length === 0 ? (
          <SectionEmptyState
            title="No followed photo posts yet"
            description="Once the creators you follow share photos, they’ll show up here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {followedPosts.slice(0, 6).map((post) => (
              <HomeMediaCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Shorts from followed creators</h3>
            <p className="text-sm text-zinc-400">Quick vertical clips from the creators you already follow.</p>
          </div>
          <Button
            onClick={() => navigate('/shorts')}
            variant="outline"
            className="border-zinc-700 bg-transparent text-white hover:bg-zinc-900"
          >
            Open shorts feed
          </Button>
        </div>

        {followingShortsQuery.isError ? (
          <SectionEmptyState
            title="Couldn’t load followed shorts"
            description="The followed-shorts feed hit an error. Refresh the page and try again."
          />
        ) : followedShorts.length === 0 ? (
          <SectionEmptyState
            title="No followed shorts yet"
            description="Follow creators who publish vertical video and their shorts will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {followedShorts.slice(0, 4).map((post) => (
              <HomeShortCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900">
            <Lock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Subscriber content</h3>
            <p className="text-sm text-zinc-400">Reserved for paid-followed and subscriber-only creator drops.</p>
          </div>
        </div>

        <SectionEmptyState
          title="Subscriber exclusives will appear here"
          description="This dedicated section is now mounted in the Following flow. Paid-only posts can plug in here as soon as creator subscriptions are enabled."
        />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-white">Live from creators you follow</h3>
          <p className="text-sm text-zinc-400">Jump straight into broadcasts from creators already in your circle.</p>
        </div>

        {streamsError ? (
          <SectionEmptyState
            title="Couldn’t load followed live streams"
            description={streamsError}
          />
        ) : streams.length === 0 ? (
          <SectionEmptyState
            title="No followed creators are live right now"
            description="We’ll light this section up the moment someone you follow goes live."
            actionLabel="Browse creators"
            onAction={() => navigate('/creators')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {streams.map((stream) => (
              <HomeStreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
