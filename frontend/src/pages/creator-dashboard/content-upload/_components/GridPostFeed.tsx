import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2 } from 'lucide-react';
import { GridPostCard } from './GridPostCard';
import { Button } from '@/components/ui/button';
import type { PostResponse } from '@/types/content';

interface GridPostFeedProps {
  posts: PostResponse[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onEditPost?: (post: PostResponse) => void;
  emptyMessage?: string;
}

export function GridPostFeed({
  posts,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onEditPost,
  emptyMessage = "No posts found.",
}: GridPostFeedProps) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <GridPostSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-zinc-400 text-base">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {posts.map((post) => (
          <GridPostCard
            key={post.id}
            post={post}
            onEdit={onEditPost}
          />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={ref} className="flex justify-center py-6">
        {isFetchingNextPage && (
          <div className="flex items-center space-x-2 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading more posts...</span>
          </div>
        )}
        
        {hasNextPage && !isFetchingNextPage && (
          <Button
            variant="outline"
            onClick={fetchNextPage}
            className="w-full max-w-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Load More Posts
          </Button>
        )}
        
        {!hasNextPage && posts.length > 0 && (
          <div className="text-zinc-400 text-sm">
            You've reached the end!
          </div>
        )}
      </div>
    </div>
  );
}

function GridPostSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-4/3 bg-zinc-700"></div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-zinc-700 rounded-full"></div>
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
            <div className="h-2 bg-zinc-700 rounded w-1/3"></div>
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-2">
          <div className="h-3 bg-zinc-700 rounded w-full"></div>
          <div className="h-3 bg-zinc-700 rounded w-3/4"></div>
          <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-2 border-t border-zinc-800">
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-zinc-700 rounded"></div>
            <div className="w-6 h-3 bg-zinc-700 rounded"></div>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-4 h-4 bg-zinc-700 rounded"></div>
            <div className="w-6 h-3 bg-zinc-700 rounded"></div>
          </div>
          <div className="w-4 h-4 bg-zinc-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}