import { useEffect, useState } from 'react';
import { socialApi, type Creator } from '@/lib/api/social';
import { Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { MainLayout } from '@/layouts/main-layout';

export default function CreatorsPage() {
  const { data: session } = authClient.useSession();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        const response = await socialApi.getCreators();
        if (response.success && response.data) {
          setCreators(response.data);
        }
      } catch (error) {
        console.error('[CreatorsPage] Error fetching creators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-white">All Creators</h1>
          </div>
          <p className="text-zinc-400">Discover approved creators on the platform</p>
        </div>

        {creators.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 p-12">
            <div className="text-center space-y-4">
              <Users className="w-16 h-16 text-zinc-600 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">No Creators Found</h3>
                <p className="text-zinc-400 mb-4">
                  There are no approved creators yet. Check back later!
                </p>
                {session?.user && (
                  <Link to="/creator-application">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Become a Creator
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {creators.map((creator) => (
            <Link key={creator.id} to={`/${creator.username}`}>
              <Card className="bg-zinc-900 border-zinc-800 p-6 hover:border-purple-500 transition-all group">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-semibold overflow-hidden">
                      {creator.image ? (
                        <img
                          src={creator.image}
                          alt={creator.name || creator.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{(creator.name || creator.username).charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    {creator.isLive && (
                      <div className="absolute -bottom-1 -right-1 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                        LIVE
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h3 className="text-white font-semibold text-lg group-hover:text-purple-400 transition-colors">
                      {creator.name || creator.username}
                    </h3>
                    <p className="text-zinc-400 text-sm">@{creator.username}</p>
                  </div>

                  {/* Bio */}
                  {creator.bio && (
                    <p className="text-zinc-400 text-sm line-clamp-2">
                      {creator.bio}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-zinc-400" />
                      <span className="text-white font-medium">{creator.followerCount}</span>
                      <span className="text-zinc-500">followers</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </div>
    </MainLayout>
  );
}
