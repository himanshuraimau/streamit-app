import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PostResponse } from '@/types/content';
import { contentApi } from '@/lib/api/content';
import { useSession } from '@/lib/auth-client';
import { useTogglePostLike } from '@/hooks/useContent';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CommentSection } from '@/pages/creator-dashboard/content-upload/_components/CommentSection';

interface ShortsPlayerProps {
  short: PostResponse;
  isActive: boolean;
  isFollowing?: boolean;
  followPending?: boolean;
  onToggleFollow?: (creatorId: string) => void | Promise<void>;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function ShortsPlayer({
  short,
  isActive,
  isFollowing = false,
  followPending = false,
  onToggleFollow,
  onSwipeUp,
  onSwipeDown,
}: ShortsPlayerProps) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const toggleLike = useTogglePostLike();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(short.isLiked || false);
  const [likesCount, setLikesCount] = useState(short.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(short.commentsCount || 0);
  const [sharesCount, setSharesCount] = useState(short.sharesCount || 0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    setIsLiked(short.isLiked || false);
    setLikesCount(short.likesCount || 0);
    setCommentsCount(short.commentsCount || 0);
    setSharesCount(short.sharesCount || 0);
  }, [short.commentsCount, short.id, short.isLiked, short.likesCount, short.sharesCount]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      contentApi.trackView(short.id);
    }
  }, [isActive, short.id]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndY.current = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY.current;

    if (diff > 50 && onSwipeUp) {
      onSwipeUp();
    } else if (diff < -50 && onSwipeDown) {
      onSwipeDown();
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = async () => {
    if (!session?.user) {
      navigate('/auth/signin');
      return;
    }

    try {
      const response = await toggleLike.mutateAsync(short.id);
      if (response.success && response.data) {
        setIsLiked(response.data.isLiked);
        setLikesCount(response.data.likesCount);
      }
    } catch (error) {
      console.error('Error toggling short like:', error);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/shorts?short=${short.id}`;

    try {
      const response = await contentApi.trackShare(short.id);
      if (response.success) {
        setSharesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Error tracking short share:', error);
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Short by ${short.author.name}`,
          text: short.content || `Watch ${short.author.name}'s short`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (error) {
      console.error('Error sharing short:', error);
    }
  };

  const handleFollow = async () => {
    if (!session?.user) {
      navigate('/auth/signin');
      return;
    }

    if (!onToggleFollow) {
      return;
    }

    try {
      await onToggleFollow(short.author.id);
    } catch (error) {
      console.error('Error toggling follow from shorts player:', error);
    }
  };

  if (!short.media || short.media.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="relative h-screen w-screen bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <video
          ref={videoRef}
          src={short.media[0]?.url}
          className="absolute inset-0 h-full w-full object-contain"
          loop
          playsInline
          muted={isMuted}
          onClick={togglePlayPause}
        />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-4 right-4 top-4 flex items-center gap-3 pointer-events-auto">
            <div
              className="flex flex-1 cursor-pointer items-center gap-3"
              onClick={() => navigate(`/${short.author.username}`)}
            >
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white">
                {short.author.image ? (
                  <img
                    src={short.author.image}
                    alt={short.author.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary font-semibold text-primary-foreground">
                    {short.author.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{short.author.name}</p>
                <p className="text-xs text-white/80">@{short.author.username}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFollow}
              disabled={followPending}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isFollowing
                  ? 'border border-white/30 bg-black/40 text-white hover:bg-black/60'
                  : 'bg-white text-black hover:bg-zinc-200'
              }`}
            >
              {followPending ? '...' : isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>

          <div className="absolute bottom-24 right-4 flex flex-col gap-6 pointer-events-auto">
            <button
              type="button"
              onClick={handleLike}
              disabled={toggleLike.isPending}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30">
                <Heart className={`h-6 w-6 text-white ${isLiked ? 'fill-current text-red-400' : ''}`} />
              </div>
              <span className="text-xs font-medium text-white">{likesCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowComments(true)}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-white">{commentsCount}</span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center gap-1"
              onClick={handleShare}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-white">{sharesCount}</span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center gap-1"
              onClick={() => navigate(`/${short.author.username}`)}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30">
                <MoreVertical className="h-6 w-6 text-white" />
              </div>
            </button>

            <button
              type="button"
              className="flex flex-col items-center gap-1"
              onClick={toggleMute}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/30">
                {isMuted ? (
                  <VolumeX className="h-6 w-6 text-white" />
                ) : (
                  <Volume2 className="h-6 w-6 text-white" />
                )}
              </div>
            </button>
          </div>

          {short.content && (
            <div className="pointer-events-auto absolute bottom-4 left-4 right-20">
              <p className="line-clamp-3 text-sm text-white drop-shadow-lg">{short.content}</p>
            </div>
          )}

          {!isPlaying && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 backdrop-blur">
                <div className="ml-2 h-0 w-0 border-b-[12px] border-l-[20px] border-t-[12px] border-b-transparent border-l-white border-t-transparent" />
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-h-[80vh] overflow-hidden border-zinc-800 bg-black p-0 text-white sm:max-w-2xl">
          <DialogHeader className="border-b border-zinc-800 px-6 py-4">
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="max-h-[calc(80vh-80px)] overflow-y-auto">
            <CommentSection
              postId={short.id}
              onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
