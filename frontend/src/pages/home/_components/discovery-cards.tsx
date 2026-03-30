import { Play, Users, Heart, MessageCircle, Eye, Share2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LiveStream } from '@/lib/api/stream';
import type { PostResponse } from '@/types/content';

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatMetric = (value: number) => compactNumberFormatter.format(value || 0);

const getAvatarUrl = (name: string, image: string | null | undefined) =>
  image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

const getPhotoMedia = (post: PostResponse) =>
  post.media.find((media) => media.type === 'IMAGE' || media.type === 'GIF') || post.media[0];

const getShortMedia = (post: PostResponse) =>
  post.media.find((media) => media.type === 'VIDEO') || post.media[0];

export const isPhotoPost = (post: PostResponse) =>
  !post.isShort && post.media.some((media) => media.type === 'IMAGE' || media.type === 'GIF');

export const isShortPost = (post: PostResponse) =>
  post.isShort && post.media.some((media) => media.type === 'VIDEO');

interface SectionEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: SectionEmptyStateProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-950/80 p-8 text-center">
      <div className="mx-auto max-w-xl space-y-3">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm text-zinc-400">{description}</p>
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="mt-2 bg-white text-black hover:bg-zinc-200"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function HomeStreamCard({ stream }: { stream: LiveStream }) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/${stream.user.username}/live`)}
      className="group cursor-pointer overflow-hidden border-zinc-800 bg-zinc-950 transition-all duration-300 hover:-translate-y-1 hover:border-red-500/60"
    >
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        {stream.thumbnail ? (
          <img
            src={stream.thumbnail}
            alt={stream.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-red-600/30 via-black to-black" />
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white">
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
          <span className="inline-flex items-center rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <Users className="mr-1.5 h-3 w-3" />
            {formatMetric(stream.viewerCount)}
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <img
            src={getAvatarUrl(stream.user.username, stream.user.image)}
            alt={stream.user.username}
            className="h-11 w-11 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{stream.title}</p>
            <p className="truncate text-sm text-zinc-400">
              {stream.user.name || stream.user.username}
            </p>
          </div>
        </div>

        <Button
          className="w-full justify-between bg-zinc-900 text-white hover:bg-zinc-800"
          variant="secondary"
        >
          Watch live
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

export function HomeMediaCard({ post }: { post: PostResponse }) {
  const navigate = useNavigate();
  const media = getPhotoMedia(post);

  if (!media) {
    return null;
  }

  return (
    <Card
      onClick={() => navigate(`/${post.author.username}`)}
      className="group cursor-pointer overflow-hidden border-zinc-800 bg-zinc-950 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/60"
    >
      <div className="aspect-[4/5] overflow-hidden bg-zinc-900">
        <img
          src={media.url}
          alt={post.content || `${post.author.name}'s post`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <img
            src={getAvatarUrl(post.author.username, post.author.image)}
            alt={post.author.username}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{post.author.name}</p>
            <p className="truncate text-xs text-zinc-400">@{post.author.username}</p>
          </div>
        </div>

        {post.content && <p className="line-clamp-2 text-sm text-zinc-200">{post.content}</p>}

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {formatMetric(post.likesCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {formatMetric(post.commentsCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatMetric(post.viewsCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" />
            {formatMetric(post.sharesCount)}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function HomeShortCard({ post }: { post: PostResponse }) {
  const navigate = useNavigate();
  const media = getShortMedia(post);

  if (!media) {
    return null;
  }

  return (
    <Card
      onClick={() => navigate(`/shorts?short=${post.id}`)}
      className="group cursor-pointer overflow-hidden border-zinc-800 bg-zinc-950 transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/60"
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-zinc-900">
        <img
          src={media.thumbnailUrl || media.url}
          alt={post.content || `${post.author.name}'s short`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm">
          <Play className="mr-1.5 h-3 w-3 fill-white" />
          SHORT
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="line-clamp-2 text-sm font-semibold text-white">
            {post.content || `${post.author.name}'s latest short`}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <img
            src={getAvatarUrl(post.author.username, post.author.image)}
            alt={post.author.username}
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{post.author.name}</p>
            <p className="truncate text-xs text-zinc-400">@{post.author.username}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {formatMetric(post.likesCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {formatMetric(post.commentsCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatMetric(post.viewsCount)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" />
            {formatMetric(post.sharesCount)}
          </span>
        </div>
      </div>
    </Card>
  );
}
