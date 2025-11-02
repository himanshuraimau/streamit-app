import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Heart, Eye } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { socialApi } from '@/lib/api/social';
import { toast } from 'sonner';

interface StreamerInfoCardProps {
  hostId: string;
  hostName: string;
  hostUsername: string;
  hostImage?: string;
  hostBio?: string;
  followerCount?: number;
  isFollowing?: boolean;
  isLive?: boolean;
  viewerCount?: number;
  categories?: string[];
}

export function StreamerInfoCard({
  hostId,
  hostName,
  hostUsername,
  hostImage,
  hostBio,
  followerCount = 0,
  isFollowing: initialIsFollowing = false,
  isLive = false,
  viewerCount = 0,
  categories = [],
}: StreamerInfoCardProps) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollowToggle = async () => {
    if (!session) {
      toast.error('Please sign in to follow creators');
      navigate('/auth/signin');
      return;
    }

    try {
      setFollowLoading(true);
      if (isFollowing) {
        await socialApi.unfollowUser(hostId);
        setIsFollowing(false);
        toast.success(`Unfollowed ${hostName}`);
      } else {
        await socialApi.followUser(hostId);
        setIsFollowing(true);
        toast.success(`Following ${hostName}!`);
      }
    } catch (error) {
      console.error('Follow toggle failed:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleVisitProfile = () => {
    navigate(`/${hostUsername}`);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <div className="flex items-start gap-4">
        {/* Profile Picture */}
        <button
          onClick={handleVisitProfile}
          className="shrink-0 transition-transform hover:scale-105"
        >
          <img
            src={hostImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${hostUsername}`}
            alt={hostName}
            className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700 hover:border-purple-500 transition-colors"
          />
        </button>

        {/* Creator Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleVisitProfile}
              className="text-white font-semibold text-lg hover:text-purple-400 transition-colors truncate"
            >
              {hostName}
            </button>
            <span className="text-zinc-400 text-sm">@{hostUsername}</span>
            {isLive && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-600 text-white text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"></span>
                LIVE
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-3 text-sm text-zinc-400">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{followerCount.toLocaleString()} followers</span>
            </div>
            {isLive && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{viewerCount.toLocaleString()} watching</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {hostBio && (
            <p className="text-zinc-300 text-sm mb-3 line-clamp-2">
              {hostBio}
            </p>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.slice(0, 3).map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded-md text-xs"
                >
                  {category}
                </span>
              ))}
              {categories.length > 3 && (
                <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md text-xs">
                  +{categories.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            onClick={handleFollowToggle}
            disabled={followLoading}
            variant={isFollowing ? "outline" : "default"}
            className={`min-w-[100px] ${
              isFollowing 
                ? 'border-zinc-600 text-zinc-300 hover:bg-zinc-800' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {followLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isFollowing ? (
              <>
                <Heart className="w-4 h-4 mr-2 fill-current" />
                Following
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Follow
              </>
            )}
          </Button>
          
          <Button
            onClick={handleVisitProfile}
            variant="outline"
            size="sm"
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
          >
            View Profile
          </Button>
        </div>
      </div>
    </Card>
  );
}