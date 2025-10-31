import { useState } from 'react';
import { usePublicFeed, useFeed } from '@/hooks/useContent';
import { useSession } from '@/lib/auth-client';
import { PostFeed } from './PostFeed';
import { Button } from '@/components/ui/button';
import { Globe, Users } from 'lucide-react';

export function FeedTab() {
  const [feedType, setFeedType] = useState<'public' | 'personalized'>('public');
  const { data: session } = useSession();

  // Use personalized feed if user is logged in and selected, otherwise public feed
  const usePersonalizedFeed = session?.user && feedType === 'personalized';
  
  const publicFeedQuery = usePublicFeed({ limit: 10 });
  const personalizedFeedQuery = useFeed({ limit: 10 });
  
  const activeQuery = usePersonalizedFeed ? personalizedFeedQuery : publicFeedQuery;

  const allPosts = activeQuery.data?.pages.flatMap(page => 
    page.success ? page.data?.posts || [] : []
  ) || [];

  return (
    <div className="space-y-6">
      {/* Feed Type Selector */}
      {session?.user && (
        <div className="flex items-center justify-center space-x-4 p-4 bg-zinc-900/50 rounded-lg">
          <Button
            variant={feedType === 'public' ? 'default' : 'ghost'}
            onClick={() => setFeedType('public')}
            className="flex items-center space-x-2"
          >
            <Globe className="w-4 h-4" />
            <span>Public Feed</span>
          </Button>
          <Button
            variant={feedType === 'personalized' ? 'default' : 'ghost'}
            onClick={() => setFeedType('personalized')}
            className="flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Following</span>
          </Button>
        </div>
      )}

      {/* Feed Content */}
      <PostFeed
        posts={allPosts}
        isLoading={activeQuery.isLoading}
        hasNextPage={activeQuery.hasNextPage || false}
        isFetchingNextPage={activeQuery.isFetchingNextPage}
        fetchNextPage={activeQuery.fetchNextPage}
        emptyMessage={
          feedType === 'personalized' 
            ? "No posts from people you follow. Try switching to the public feed!"
            : "No posts available. Be the first to share something!"
        }
      />
    </div>
  );
}