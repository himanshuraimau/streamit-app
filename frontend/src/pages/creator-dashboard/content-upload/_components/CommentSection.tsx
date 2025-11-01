import { useState } from 'react';
import { Send, Heart, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePostComments, useAddComment } from '@/hooks/useContent';
import { useAuthSession } from '@/hooks/useAuthSession';
import type { CommentResponse } from '@/types/content';

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { data: session } = useAuthSession();
  const { data: commentsResponse, isLoading } = usePostComments(postId);
  const addComment = useAddComment();

  const comments = commentsResponse?.success ? commentsResponse.data || [] : [];

  const handleSubmitComment = async (parentId?: string) => {
    if (!newComment.trim() || !session?.user) return;

    try {
      await addComment.mutateAsync({
        content: newComment.trim(),
        postId,
        parentId,
      });
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* Add Comment Form */}
      {session?.user && (
        <div className="flex space-x-2">
          <img
            src={session.user.image || '/default-avatar.png'}
            alt={session.user.name || 'User'}
            className="w-6 h-6 rounded-full object-cover"
          />
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="min-h-[60px] resize-none text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400"
            />
            <div className="flex justify-end mt-2">
              <Button
                onClick={() => handleSubmitComment()}
                disabled={!newComment.trim() || addComment.isPending}
                size="sm"
                className="h-7 px-3 text-xs"
              >
                <Send className="w-3 h-3 mr-1" />
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
            onReply={(commentId) => setReplyingTo(commentId)}
            replyingTo={replyingTo}
            onSubmitReply={handleSubmitComment}
            newComment={newComment}
            setNewComment={setNewComment}
            isSubmitting={addComment.isPending}
          />
        ))}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-6 text-zinc-400 text-sm">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: CommentResponse;
  postId: string;
  onReply: (commentId: string) => void;
  replyingTo: string | null;
  onSubmitReply: (parentId: string) => void;
  newComment: string;
  setNewComment: (value: string) => void;
  isSubmitting: boolean;
}

function CommentItem({
  comment,
  postId,
  onReply,
  replyingTo,
  onSubmitReply,
  newComment,
  setNewComment,
  isSubmitting,
}: CommentItemProps) {
  const { data: session } = useAuthSession();
  const isReplying = replyingTo === comment.id;

  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        <img
          src={comment.user.image || '/default-avatar.png'}
          alt={comment.user.name}
          className="w-6 h-6 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="bg-zinc-800 rounded-lg p-2">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-xs text-white">
                {comment.user.name}
              </span>
              <span className="text-xs text-zinc-400">
                @{comment.user.username}
              </span>
              <span className="text-xs text-zinc-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-white text-xs leading-relaxed">
              {comment.content}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-400 hover:text-red-400 p-0 h-auto"
            >
              <Heart className={`w-3 h-3 mr-1 ${comment.isLiked ? 'fill-current text-red-400' : ''}`} />
              {comment.likesCount}
            </Button>
            
            {session?.user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="text-xs text-zinc-400 hover:text-blue-400 p-0 h-auto"
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && session?.user && (
            <div className="mt-3 flex space-x-2">
              <img
                src={session.user.image || '/default-avatar.png'}
                alt={session.user.name || 'User'}
                className="w-6 h-6 rounded-full object-cover"
              />
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Reply to ${comment.user.name}...`}
                  className="min-h-[60px] resize-none text-sm"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onReply('')}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => onSubmitReply(comment.id)}
                    disabled={!newComment.trim() || isSubmitting}
                    size="sm"
                  >
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onReply={onReply}
              replyingTo={replyingTo}
              onSubmitReply={onSubmitReply}
              newComment={newComment}
              setNewComment={setNewComment}
              isSubmitting={isSubmitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}