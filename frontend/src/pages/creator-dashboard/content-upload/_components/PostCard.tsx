import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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
import type { PostResponse } from '@/types/content';
import { MediaGrid } from './MediaGrid';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: PostResponse;
  onEdit?: (post: PostResponse) => void;
  showComments?: boolean;
}

export function PostCard({ post, onEdit, showComments = false }: PostCardProps) {
  const [showCommentsSection, setShowCommentsSection] = useState(showComments);
  const { data: session } = useAuthSession();
  const toggleLike = useTogglePostLike();
  const deletePost = useDeletePost();

  const isOwner = session?.user?.id === post.author.id;
  const isLiked = post.isLiked || false;

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
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + `/posts/${post.id}`);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3">
          <img
            src={post.author.image || '/default-avatar.png'}
            alt={post.author.name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium text-white text-sm">
              {post.author.name}
            </h3>
            <p className="text-xs text-zinc-400">
              @{post.author.username} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

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

      {/* Content */}
      {post.content && (
        <div className="px-3 pb-2">
          <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>
        </div>
      )}

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="px-3 pb-2">
          <MediaGrid media={post.media} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800">
        <div className="flex items-center space-x-4">
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
            className="flex items-center space-x-1 text-zinc-400 hover:text-green-400 h-7 px-2"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
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
    </div>
  );
}