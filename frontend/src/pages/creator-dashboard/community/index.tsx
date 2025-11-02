import { Card } from '@/components/ui/card';
import { Users, MessageSquare } from 'lucide-react';
import { useSocialStats } from '@/hooks/useSocial';

export default function Community() {
  const { data: socialStats, isLoading: statsLoading } = useSocialStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
          <p className="text-zinc-400">Engage with your audience and build your community</p>
        </div>
      </div>

      {/* Community Stats - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Followers</h3>
              {statsLoading ? (
                <p className="text-2xl font-bold text-purple-400">...</p>
              ) : (
                <p className="text-2xl font-bold text-purple-400">
                  {socialStats?.followerCount?.toLocaleString() || 0}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Following</h3>
              {statsLoading ? (
                <p className="text-2xl font-bold text-blue-400">...</p>
              ) : (
                <p className="text-2xl font-bold text-blue-400">
                  {socialStats?.followingCount?.toLocaleString() || 0}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Coming Soon Features */}
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="text-center">
          <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Community Management</h3>
          <p className="text-zinc-400 mb-4">
            Advanced community features will be available here soon:
          </p>
          <div className="max-w-2xl mx-auto text-left space-y-2 text-zinc-400">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-pink-400" />
              <span>Community posts and announcements</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Detailed follower analytics and demographics</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>Engagement metrics and trending comments</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-400" />
              <span>Subscriber management and perks</span>
            </div>
          </div>
          <p className="text-zinc-500 text-sm mt-6">Coming soon...</p>
        </div>
      </Card>
    </div>
  );
}