import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/pages/home/_components/navbar';
import { HomeSidebar } from '@/pages/home/_components/sidebar';
import { socialApi, type CreatorProfile } from '@/lib/api/social';
import { useUserPosts } from '@/hooks/useContent';
import { PostCard } from '@/pages/creator-dashboard/content-upload/_components/PostCard';
import type { PostResponse } from '@/types/content';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Video, Gift, TrendingUp } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { socialApi as socialApiClient } from '@/lib/api/social';
import { SidebarProvider } from '@/components/ui/sidebar';
import { usePaymentStore } from '@/stores/payment.store';

type TabType = 'posts' | 'livestreams' | 'videos' | 'about' | 'community';

export default function CreatorPage() {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Determine active tab from URL path
  const getActiveTabFromPath = (): TabType => {
    const path = location.pathname;
    if (path.endsWith('/videos')) return 'videos';
    if (path.endsWith('/about')) return 'about';
    if (path.endsWith('/community')) return 'community';
    if (path.endsWith('/livestreams')) return 'livestreams';
    return 'posts'; // default
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getActiveTabFromPath());

  // Update active tab when location changes
  useEffect(() => {
    const getActiveTab = (): TabType => {
      const path = location.pathname;
      if (path.endsWith('/videos')) return 'videos';
      if (path.endsWith('/about')) return 'about';
      if (path.endsWith('/community')) return 'community';
      if (path.endsWith('/livestreams')) return 'livestreams';
      return 'posts'; // default
    };
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Navigate to tab
  const handleTabChange = (tab: TabType) => {
    const basePath = `/${username}`;
    const tabPath = tab === 'posts' ? basePath : `${basePath}/${tab}`;
    navigate(tabPath);
  };

  useEffect(() => {
    const load = async () => {
      if (!username) return;
      setLoading(true);
      setError(null);
      try {
        const res = await socialApi.getCreatorProfile(username);
        if (res.success && res.data) {
          setProfile(res.data);
        } else {
          setError(res.error || 'Creator not found');
        }
      } catch (err) {
        console.error('Error loading creator:', err);
        setError('Failed to load creator');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [username]);

  // Fetch user posts using hook once we have userId
  const userId = profile?.id;
  const postsQuery = useUserPosts(userId || '', { limit: 12 });
  const session = authClient.useSession();
  const { fetchGiftsSent, fetchGiftsReceived, giftsSent, giftsReceived } = usePaymentStore();

  // Follow/unfollow local state
  const [isFollowing, setIsFollowing] = useState<boolean>(!!profile?.isFollowing);
  const [followLoading, setFollowLoading] = useState(false);
  const [giftStats, setGiftStats] = useState<{ sent?: number; received?: number; earnings?: number }>({});
  const [loadingGifts, setLoadingGifts] = useState(false);

  // Fetch gift statistics
  useEffect(() => {
    const loadGiftStats = async () => {
      if (!profile?.id) return;
      
      setLoadingGifts(true);
      try {
        // Check if viewing own profile
        const isOwnProfile = session.data?.user?.id === profile.id;
        
        if (isOwnProfile) {
          // Load both sent and received for own profile
          await Promise.all([
            fetchGiftsSent({ page: 1, limit: 1 }),
            fetchGiftsReceived({ page: 1, limit: 1 })
          ]);
        } else {
          // For other profiles, we can't fetch their stats directly
          // This would need a public stats endpoint on the backend
          // For now, we'll skip this
        }
      } catch (err) {
        console.error('Failed to load gift stats:', err);
      } finally {
        setLoadingGifts(false);
      }
    };

    loadGiftStats();
  }, [profile?.id, session.data?.user?.id, fetchGiftsSent, fetchGiftsReceived]);

  // Calculate gift statistics from store data
  useEffect(() => {
    const stats: { sent?: number; received?: number; earnings?: number } = {};
    
    if (giftsSent.length > 0) {
      const totalSent = giftsSent.reduce((sum, gift) => sum + gift.coinAmount, 0);
      stats.sent = totalSent;
    }
    
    if (giftsReceived.length > 0) {
      const totalReceived = giftsReceived.reduce((sum, gift) => sum + gift.coinAmount, 0);
      const earnings = Math.floor(totalReceived * 0.7); // 70% after commission
      stats.received = totalReceived;
      stats.earnings = earnings;
    }
    
    setGiftStats(stats);
  }, [giftsSent, giftsReceived]);

  const handleFollowToggle = async () => {
    if (!profile?.id) return;
    if (!session.data) {
      // redirect to signin
      window.location.href = '/auth/signin';
      return;
    }

    try {
      setFollowLoading(true);
      if (isFollowing) {
        await socialApiClient.unfollowUser(profile.id);
        setIsFollowing(false);
      } else {
        await socialApiClient.followUser(profile.id);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Follow toggle failed', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
          <p className="text-white">Loading creator...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-800 p-8 max-w-md w-full">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Creator Not Found</h2>
            <p className="text-zinc-400">{error || 'This creator was not found or is not available.'}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full flex-col bg-black">
        <Navbar />
        <div className="flex flex-1 pt-20">
          <HomeSidebar />

          <main className="flex-1 overflow-auto container mx-auto px-4 py-8">
            {/* Header */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-6">
                <img
                  src={profile.profilePicture || profile.image || `/api/avatar/${profile.username}`}
                  alt={profile.username}
                  className="w-28 h-28 rounded-full object-cover"
                />
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.name || profile.username}</h1>
                  <p className="text-zinc-400">@{profile.username}</p>
                  <p className="mt-2 text-zinc-300 max-w-xl">{profile.bio}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-sm text-zinc-400">{profile.followerCount} followers</span>
                    <span className="text-sm text-zinc-400">{profile.followingCount} following</span>
                    {profile.isLive && (
                      <Button
                        onClick={() => navigate(`/${username}/live`)}
                        className="ml-4 bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 text-sm"
                      >
                        <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse"></span>
                        Watch Live
                      </Button>
                    )}
                  </div>
                </div>
                <div className="ml-auto">
                  <Button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`${isFollowing ? 'bg-zinc-700 text-white' : 'bg-purple-600 text-white'}`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs: Posts (default) */}
            <div className="mb-6">
              <div className="border-b border-zinc-800">
                <div className="flex gap-8">
                  <button
                    onClick={() => handleTabChange('posts')}
                    className={`pb-4 px-2 font-medium transition-colors relative ${
                      activeTab === 'posts'
                        ? 'text-purple-400'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Posts
                    {activeTab === 'posts' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTabChange('videos')}
                    className={`pb-4 px-2 font-medium transition-colors relative ${
                      activeTab === 'videos'
                        ? 'text-purple-400'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Videos
                    {activeTab === 'videos' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTabChange('livestreams')}
                    className={`pb-4 px-2 font-medium transition-colors relative ${
                      activeTab === 'livestreams'
                        ? 'text-purple-400'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Past Livestreams
                    {activeTab === 'livestreams' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleTabChange('about')}
                    className={`pb-4 px-2 font-medium transition-colors relative ${
                      activeTab === 'about'
                        ? 'text-purple-400'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    About
                    {activeTab === 'about' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {activeTab === 'posts' && (
                  <>
                    {/* Posts list */}
                    {postsQuery.isLoading ? (
                      <Card className="bg-zinc-900 border-zinc-800 p-6">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                      </Card>
                    ) : postsQuery.data?.pages?.flatMap((p) => p.data?.posts || []).length === 0 ? (
                      <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                        <p className="text-zinc-400">No posts yet</p>
                      </Card>
                    ) : (
                      postsQuery.data?.pages?.flatMap((p) => p.data?.posts || []).map((post: PostResponse) => (
                        <PostCard key={post.id} post={post} />
                      ))
                    )}
                  </>
                )}

                {activeTab === 'videos' && (
                  <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                    <Video className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Videos</h3>
                    <p className="text-zinc-400">Video content will appear here</p>
                  </Card>
                )}

                {activeTab === 'livestreams' && (
                  <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
                    <Video className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Past Livestreams</h3>
                    <p className="text-zinc-400">Past livestream recordings will appear here</p>
                  </Card>
                )}

                {activeTab === 'about' && (
                  <Card className="bg-zinc-900 border-zinc-800 p-6">
                    <h3 className="text-white font-semibold mb-4">About {profile?.name || profile?.username}</h3>
                    <div className="space-y-4 text-zinc-300">
                      <div>
                        <p className="text-zinc-400 text-sm mb-1">Bio</p>
                        <p>{profile?.bio || 'No bio available'}</p>
                      </div>
                      {profile?.categories && profile.categories.length > 0 && (
                        <div>
                          <p className="text-zinc-400 text-sm mb-1">Categories</p>
                          <div className="flex flex-wrap gap-2">
                            {profile.categories.map((cat: string) => (
                              <span
                                key={cat}
                                className="px-3 py-1 bg-zinc-800 rounded-full text-sm"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-zinc-400 text-sm mb-1">Stats</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-zinc-800 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-white">{profile?.followerCount || 0}</p>
                            <p className="text-zinc-400 text-sm">Followers</p>
                          </div>
                          <div className="bg-zinc-800 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-white">{profile?.followingCount || 0}</p>
                            <p className="text-zinc-400 text-sm">Following</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              <aside className="lg:col-span-1 space-y-4">
                {activeTab !== 'about' && (
                  <>
                    <Card className="bg-zinc-900 border-zinc-800 p-4">
                      <h3 className="text-white font-semibold mb-3">About</h3>
                      <p className="text-zinc-400 text-sm">{profile?.bio || 'No bio available'}</p>
                    </Card>
                    
                    {/* Gift Statistics Card - only show for own profile */}
                    {session.data?.user?.id === profile?.id && (
                      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-800/50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Gift className="w-5 h-5 text-purple-400" />
                          <h3 className="text-white font-semibold">Gift Statistics</h3>
                        </div>
                        
                        {loadingGifts ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Gifts Received */}
                            {typeof giftStats.received !== 'undefined' && (
                              <div className="bg-zinc-800/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-zinc-400 text-sm">Gifts Received</span>
                                  <TrendingUp className="w-4 h-4 text-green-400" />
                                </div>
                                <p className="text-2xl font-bold text-white">{giftStats.received}</p>
                                <p className="text-xs text-green-400 mt-1">
                                  ~{giftStats.earnings} coins earned (70%)
                                </p>
                                <Button
                                  onClick={() => navigate('/gifts/received')}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full mt-2 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                                >
                                  View History
                                </Button>
                              </div>
                            )}
                            
                            {/* Gifts Sent */}
                            {typeof giftStats.sent !== 'undefined' && (
                              <div className="bg-zinc-800/50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-zinc-400 text-sm">Gifts Sent</span>
                                  <Gift className="w-4 h-4 text-amber-400" />
                                </div>
                                <p className="text-2xl font-bold text-white">{giftStats.sent}</p>
                                <p className="text-xs text-zinc-400 mt-1">Total coins spent</p>
                                <Button
                                  onClick={() => navigate('/gifts/sent')}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full mt-2 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                                >
                                  View History
                                </Button>
                              </div>
                            )}
                            
                            {/* Empty State */}
                            {!giftStats.received && !giftStats.sent && (
                              <div className="text-center py-4">
                                <Gift className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                                <p className="text-zinc-400 text-sm">No gift activity yet</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    )}
                    
                    {profile?.categories && profile.categories.length > 0 && (
                      <Card className="bg-zinc-900 border-zinc-800 p-4">
                        <h3 className="text-white font-semibold mb-3">Categories</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.categories.map((cat: string) => (
                            <span
                              key={cat}
                              className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-300"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </Card>
                    )}
                  </>
                )}
              </aside>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
