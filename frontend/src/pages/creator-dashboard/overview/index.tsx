import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Users, 
  Play,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { useCreatorApplication } from '@/hooks/useCreatorApplication';
import { useSocialStats } from '@/hooks/useSocial';
import { authClient } from '@/lib/auth-client';
import { useNavigate } from 'react-router-dom';

export default function Overview() {
  const { data: session } = authClient.useSession();
  const { application } = useCreatorApplication();
  const { data: socialStats, isLoading: statsLoading } = useSocialStats();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {session?.user.name}!
          </h1>
          <p className="text-zinc-400">
            Here's what's happening with your channel today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            Verified Creator
          </Badge>
          <Button 
            onClick={() => navigate('/creator-dashboard/streams')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Video className="w-4 h-4 mr-2" />
            Go Live
          </Button>
        </div>
      </div>

      {/* Quick Stats - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-zinc-400 text-sm">Followers</h3>
              {statsLoading ? (
                <p className="text-2xl font-bold text-white">...</p>
              ) : (
                <p className="text-2xl font-bold text-white">
                  {socialStats?.followerCount?.toLocaleString() || 0}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-zinc-400 text-sm">Following</h3>
              {statsLoading ? (
                <p className="text-2xl font-bold text-white">...</p>
              ) : (
                <p className="text-2xl font-bold text-white">
                  {socialStats?.followingCount?.toLocaleString() || 0}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-auto p-4 flex-col gap-2"
              onClick={() => navigate('/creator-dashboard/streams')}
            >
              <Video className="w-6 h-6" />
              <span className="text-sm">Start Stream</span>
            </Button>
            <Button 
              variant="outline" 
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-auto p-4 flex-col gap-2"
              onClick={() => navigate('/creator-dashboard/chat')}
            >
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm">Check Chat</span>
            </Button>
            <Button 
              variant="outline" 
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-auto p-4 flex-col gap-2"
              onClick={() => navigate('/creator-dashboard/community')}
            >
              <TrendingUp className="w-6 h-6" />
              <span className="text-sm">View Community</span>
            </Button>
            <Button 
              variant="outline" 
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-auto p-4 flex-col gap-2"
              onClick={() => navigate('/creator-dashboard/content-upload')}
            >
              <Play className="w-6 h-6" />
              <span className="text-sm">Upload Post</span>
            </Button>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Creator Profile</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                {session?.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <p className="text-white font-medium">{session?.user.name}</p>
                <p className="text-zinc-400 text-sm">{session?.user.email}</p>
              </div>
            </div>
            
            {application?.profile && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {application.profile.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="bg-zinc-800 text-zinc-300">
                      {category.toLowerCase()}
                    </Badge>
                  ))}
                </div>
                <p className="text-zinc-400 text-sm line-clamp-3">
                  {application.profile.bio}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}