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
import { useSession } from '@/lib/auth-client';
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
  const { data: session } = useSession();
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <img
            src={post.author.image || '/default-avatar.png'}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {post.author.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              @{post.author.email?.split('@')[0] || 'user'} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(post)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>    
  {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
            {post.content}
          </p>
        </div>
      )}

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <div className="px-4 pb-3">
          <MediaGrid media={post.media} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={!session?.user || toggleLike.isPending}
            className={`flex items-center space-x-2 ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{post.likesCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCommentsSection(!showCommentsSection)}
            className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.commentsCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-500 hover:text-green-500"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {!post.isPublic && (
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            Private
          </span>
        )}
      </div>

      {/* Comments Section */}
      {showCommentsSection && post.allowComments && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <CommentSection postId={post.id} />
        </div>
      )}
    </div>
  );
}