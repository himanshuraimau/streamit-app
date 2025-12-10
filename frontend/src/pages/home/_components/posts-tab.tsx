import { useState } from 'react';
import { usePublicFeed, useFeed } from '@/hooks/useContent';
import { useSession } from '@/lib/auth-client';
import { PostFeed } from '../../creator-dashboard/content-upload/_components/PostFeed';
import { GridPostFeed } from '../../creator-dashboard/content-upload/_components/GridPostFeed';
import { Button } from '@/components/ui/button';
import { Globe, Users, MessageSquare, Grid3X3, List } from 'lucide-react';

export function PostsTab() {
  const [feedType, setFeedType] = useState<'public' | 'personalized'>('public');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
      {/* Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-linear-to-r from-pink-500 to-purple-600 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Community Posts</h2>
        <p className="text-lg text-zinc-400">
          Discover amazing content shared by creators
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Feed Type Selector */}
        {session?.user && (
          <div className="flex items-center justify-center sm:justify-start space-x-4 p-4 bg-zinc-900/50 rounded-lg">
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

        {/* View Mode Toggle */}
        <div className="flex items-center justify-center sm:justify-end space-x-2 p-4 bg-zinc-900/50 rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="flex items-center space-x-2"
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex items-center space-x-2"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </Button>
        </div>
      </div>

      {/* Posts Feed */}
      <div className={`${viewMode === 'grid' ? '' : 'max-w-4xl mx-auto'}`}>
        {viewMode === 'grid' ? (
          <GridPostFeed
            posts={allPosts}
            isLoading={activeQuery.isLoading}
            hasNextPage={activeQuery.hasNextPage || false}
            isFetchingNextPage={activeQuery.isFetchingNextPage}
            fetchNextPage={activeQuery.fetchNextPage}
            emptyMessage={
              feedType === 'personalized' 
                ? "No posts from people you follow. Try switching to the public feed!"
                : "No posts available yet. Check back soon for amazing content from creators!"
            }
          />
        ) : (
          <PostFeed
            posts={allPosts}
            isLoading={activeQuery.isLoading}
            hasNextPage={activeQuery.hasNextPage || false}
            isFetchingNextPage={activeQuery.isFetchingNextPage}
            fetchNextPage={activeQuery.fetchNextPage}
            emptyMessage={
              feedType === 'personalized' 
                ? "No posts from people you follow. Try switching to the public feed!"
                : "No posts available yet. Check back soon for amazing content from creators!"
            }
          />
        )}
      </div>
    </div>
  );
}