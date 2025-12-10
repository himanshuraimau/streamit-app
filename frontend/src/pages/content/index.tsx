import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePublicFeed, useFeed } from '@/hooks/useContent';
import { authClient } from '@/lib/auth-client';
import { useCreatorApplication } from '@/hooks/useCreatorApplication';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GridPostFeed } from '@/pages/creator-dashboard/content-upload/_components/GridPostFeed';
import { PostFeed } from '@/pages/creator-dashboard/content-upload/_components/PostFeed';
import { DashboardNavbar } from '@/pages/creator-dashboard/_components/dashboard-navbar';
import { CreatorSidebar } from '@/pages/creator-dashboard/_components/creator-sidebar';
import { Button } from '@/components/ui/button';
import { Globe, Users, Grid3X3, List } from 'lucide-react';

export default function ContentPage() {
  const [feedType, setFeedType] = useState<'public' | 'personalized'>('public');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data: session, isPending } = authClient.useSession();
  const { status, loading } = useCreatorApplication();

  // Use personalized feed if user is logged in and selected, otherwise public feed
  const usePersonalizedFeed = session?.user && feedType === 'personalized';
  
  const publicFeedQuery = usePublicFeed({ limit: 10 });
  const personalizedFeedQuery = useFeed({ limit: 10 });
  
  const activeQuery = usePersonalizedFeed ? personalizedFeedQuery : publicFeedQuery;

  const allPosts = activeQuery.data?.pages.flatMap(page => 
    page.success ? page.data?.posts || [] : []
  ) || [];

  // Show loading state
  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!session) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Redirect to application if not approved
  if (!status?.hasApplication || status.status !== 'APPROVED') {
    return <Navigate to="/creator-application" replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col bg-black">
        {/* Full-width navbar at the top */}
        <DashboardNavbar />

        {/* Sidebar and main content below navbar */}
        <div className="flex flex-1 pt-20">
          <CreatorSidebar />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-8">
              {/* Header */}
              <div className="text-center py-8">
                <h1 className="text-3xl font-bold text-white mb-2">Community Feed</h1>
                <p className="text-zinc-400">Discover amazing content from creators</p>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Feed Type Selector */}
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

              {/* Feed Content */}
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
                        : "No posts available. Be the first to share something!"
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
                        : "No posts available. Be the first to share something!"
                    }
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}