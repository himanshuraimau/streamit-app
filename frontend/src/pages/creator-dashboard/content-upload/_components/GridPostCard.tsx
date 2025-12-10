import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash2, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTogglePostLike, useDeletePost } from '@/hooks/useContent';
import { useAuthSession } from '@/hooks/useAuthSession';
import { TruncatedText } from '@/components/common/TruncatedText';
import type { PostResponse, MediaResponse } from '@/types/content';
import { CommentSection } from './CommentSection';

interface GridPostCardProps {
  post: PostResponse;
  onEdit?: (post: PostResponse) => void;
}

export function GridPostCard({ post, onEdit }: GridPostCardProps) {
  const [showCommentsSection, setShowCommentsSection] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaResponse | null>(null);
  const { data: session } = useAuthSession();
  const toggleLike = useTogglePostLike();
  const deletePost = useDeletePost();

  const isOwner = session?.user?.id === post.author.id;
  const isLiked = post.isLiked || false;
  const primaryMedia = post.media?.[0];

  const handleLike = () => {
    if (!session?.user) return;
    toggleLike.mutate(post.id);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost.mutate(post.id);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author.name}`,
          text: post.content || 'Check out this post',
          url: window.location.origin + `/posts/${post.id}`,
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/posts/${post.id}`);
    }
  };

  const handleMediaClick = () => {
    if (primaryMedia) {
      setSelectedMedia(primaryMedia);
    }
  };

  return (
    <>
      <article className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-colors group">
        {/* Image/Media Section */}
        {primaryMedia && (
          <div className="relative aspect-4/3 overflow-hidden cursor-pointer" onClick={handleMediaClick}>
            {primaryMedia.type === 'VIDEO' ? (
              <div className="relative w-full h-full">
                <img
                  src={primaryMedia.thumbnailUrl || primaryMedia.url}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                  <Play className="w-8 h-8 text-white" fill="white" />
                </div>
                {primaryMedia.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(primaryMedia.duration)}
                  </div>
                )}
              </div>
            ) : (
              <img
                src={primaryMedia.url}
                alt="Post media"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            )}
            
            {/* Media count indicator */}
            {post.media && post.media.length > 1 && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                1/{post.media.length}
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Header with User Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src={post.author.image || '/default-avatar.png'}
                alt={post.author.name}
                className="w-7 h-7 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-white text-sm truncate">
                  {post.author.name}
                </h3>
                <p className="text-xs text-zinc-400 truncate">
                  @{post.author.username}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-xs text-zinc-500">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-400 hover:text-white">
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(post)} className="text-zinc-300 hover:text-white hover:bg-zinc-700">
                        <Edit className="w-3 h-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleDelete} className="text-red-400 hover:text-red-300 hover:bg-zinc-700">
                      <Trash2 className="w-3 h-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Post Content */}
          {post.content && (
            <TruncatedText 
              text={post.content} 
              maxLength={150} 
              className="text-white"
            />
          )}

          {/* Actions Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!session?.user || toggleLike.isPending}
                className={`flex items-center space-x-1 h-7 px-2 ${
                  isLiked ? 'text-red-400 hover:text-red-300' : 'text-zinc-400 hover:text-red-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{post.likesCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommentsSection(!showCommentsSection)}
                className="flex items-center space-x-1 text-zinc-400 hover:text-blue-400 h-7 px-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{post.commentsCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-zinc-400 hover:text-green-400 h-7 px-2"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {!post.isPublic && (
              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full">
                Private
              </span>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {showCommentsSection && post.allowComments && (
          <div className="border-t border-zinc-800">
            <CommentSection postId={post.id} />
          </div>
        )}
      </article>

      {/* Media Modal */}
      {selectedMedia && (
        <MediaModal
          media={selectedMedia}
          allMedia={post.media || []}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </>
  );
}

// Media Modal Component
interface MediaModalProps {
  media: MediaResponse;
  allMedia: MediaResponse[];
  onClose: () => void;
}

function MediaModal({ media, allMedia, onClose }: MediaModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const mediaIndex = allMedia.findIndex(m => m.id === media.id);
    return mediaIndex >= 0 ? mediaIndex : 0;
  });
  const [isMuted, setIsMuted] = useState(true);
  
  const currentMedia = allMedia[currentIndex] || media;
  const isVideo = currentMedia.type === 'VIDEO';

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allMedia.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white text-xl hover:text-gray-300 z-10"
        >
          ✕
        </button>
        
        {/* Navigation arrows for multiple media */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-2xl hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ‹
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-2xl hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ›
            </button>
          </>
        )}
        
        {isVideo ? (
          <video
            key={currentMedia.id}
            src={currentMedia.url}
            controls
            autoPlay
            muted={isMuted}
            className="max-w-full max-h-[80vh] object-contain"
            onVolumeChange={(e) => setIsMuted((e.target as HTMLVideoElement).muted)}
          />
        ) : (
          <img
            src={currentMedia.url}
            alt="Full size media"
            className="max-w-full max-h-[80vh] object-contain"
          />
        )}

        {/* Media counter */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded-full">
            {currentIndex + 1} / {allMedia.length}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}