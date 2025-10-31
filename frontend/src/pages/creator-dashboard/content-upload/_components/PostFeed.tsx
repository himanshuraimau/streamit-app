import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { PostCard } from './PostCard';
import { Button } from '@/components/ui/button';
import type { PostResponse } from '@/types/content';

interface PostFeedProps {
  posts: PostResponse[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onEditPost?: (post: PostResponse) => void;
  emptyMessage?: string;
}

export function PostFeed({
  posts,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onEditPost,
  emptyMessage = "No posts found.",
}: PostFeedProps) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Auto-load more posts when scrolling near bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 text-lg">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onEdit={onEditPost}
        />
      ))}

      {/* Infinite scroll trigger */}
      <div ref={ref} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading more posts...</span>
          </div>
        )}
        
        {hasNextPage && !isFetchingNextPage && (
          <Button
            variant="outline"
            onClick={fetchNextPage}
            className="w-full max-w-xs"
          >
            Load More Posts
          </Button>
        )}
        
        {!hasNextPage && posts.length > 0 && (
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            You've reached the end!
          </div>
        )}
      </div>
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 mb-4">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      </div>

      {/* Media placeholder */}
      <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4"></div>

      {/* Actions */}
      <div className="flex items-center space-x-6 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="w-8 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="w-8 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
  );
}