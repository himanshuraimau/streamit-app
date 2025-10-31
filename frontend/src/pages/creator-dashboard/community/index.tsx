import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Heart, MessageSquare, TrendingUp, UserPlus } from 'lucide-react';

export default function Community() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
          <p className="text-zinc-400">Engage with your audience and build your community</p>
        </div>
        <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
          <MessageSquare className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Followers</h3>
              <p className="text-2xl font-bold text-purple-400">12.5K</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Total Likes</h3>
              <p className="text-2xl font-bold text-pink-400">45.2K</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Comments</h3>
              <p className="text-2xl font-bold text-blue-400">8.9K</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Growth Rate</h3>
              <p className="text-2xl font-bold text-green-400">+15%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Followers</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">User{i}23</p>
                  <p className="text-zinc-400 text-sm">Followed 2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Comments</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 bg-zinc-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600"></div>
                  <span className="text-white font-medium text-sm">Viewer{i}</span>
                </div>
                <p className="text-zinc-300 text-sm">
                  "Great stream! Love the content, keep it up! 🔥"
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-zinc-400 text-xs">{12 + i} likes</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Placeholder Content */}
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="text-center">
          <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Community Management</h3>
          <p className="text-zinc-400 mb-4">
            Advanced community features including polls, announcements, subscriber management, and community posts will be available here.
          </p>
          <p className="text-zinc-500 text-sm">Coming soon...</p>
        </div>
      </Card>
    </div>
  );
}