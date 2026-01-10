import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  Trophy, 
  Heart, 
  Gift, 
  Coins, 
  Play,
  Loader2,
  Eye
} from 'lucide-react';
import { streamApi, viewerApi, type StreamSummary, type LiveStream } from '@/lib/api/stream';
import { socialApi } from '@/lib/api/social';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

interface PostStreamSummaryProps {
  streamId: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorImage?: string | null;
  isFollowing: boolean;
  open: boolean;
  onClose: () => void;
  onFollowChange?: (isFollowing: boolean) => void;
}

/**
 * PostStreamSummary - Modal shown when a stream ends
 * Displays stream statistics, top gifter, follow button, and recommended streams
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
export function PostStreamSummary({
  streamId,
  creatorId,
  creatorName,
  creatorUsername,
  creatorImage,
  isFollowing: initialIsFollowing,
  open,
  onClose,
  onFollowChange,
}: PostStreamSummaryProps) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  
  const [summary, setSummary] = useState<StreamSummary | null>(null);
  const [recommendedStreams, setRecommendedStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followLoading, setFollowLoading] = useState(false);

  // Fetch stream summary and recommended streams when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch stream summary and recommended streams in parallel
        const [summaryResponse, recommendedResponse] = await Promise.all([
          streamApi.getStreamSummary(streamId),
          viewerApi.getRecommendedStreams(streamId, 4),
        ]);

        if (summaryResponse.success && summaryResponse.data) {
          setSummary(summaryResponse.data);
        }

        if (recommendedResponse.success && recommendedResponse.data) {
          setRecommendedStreams(recommendedResponse.data);
        }
      } catch (error) {
        console.error('[PostStreamSummary] Error fetching data:', error);
        toast.error('Failed to load stream summary');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, streamId]);

  // Handle follow/unfollow action
  // Requirements: 9.4
  const handleFollowToggle = async () => {
    if (!session) {
      toast.error('Please sign in to follow creators');
      navigate('/auth/signin');
      return;
    }

    try {
      setFollowLoading(true);
      if (isFollowing) {
        await socialApi.unfollowUser(creatorId);
        setIsFollowing(false);
        onFollowChange?.(false);
        toast.success(`Unfollowed ${creatorName}`);
      } else {
        await socialApi.followUser(creatorId);
        setIsFollowing(true);
        onFollowChange?.(true);
        toast.success(`Now following ${creatorName}!`);
      }
    } catch (error) {
      console.error('[PostStreamSummary] Follow toggle failed:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle navigation to recommended stream
  // Requirements: 9.6
  const handleStreamClick = (username: string) => {
    onClose();
    navigate(`/watch/${username}`);
  };

  // Format duration from seconds to readable string
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Stream Ended
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Creator Info Section */}
            <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg">
              <img
                src={creatorImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creatorUsername}`}
                alt={creatorName}
                className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{creatorName}</h3>
                <p className="text-zinc-400 text-sm">@{creatorUsername}</p>
              </div>
              {/* Follow button - only show if not following */}
              {/* Requirements: 9.4 */}
              {!isFollowing && (
                <Button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
              {isFollowing && (
                <Button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  variant="outline"
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2 fill-current" />
                      Following
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Stream Statistics */}
            {/* Requirements: 9.2 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={<Users className="w-5 h-5 text-blue-400" />}
                label="Total Viewers"
                value={summary?.totalViewers?.toLocaleString() ?? '0'}
              />
              <StatCard
                icon={<Eye className="w-5 h-5 text-green-400" />}
                label="Peak Viewers"
                value={summary?.peakViewers?.toLocaleString() ?? '0'}
              />
              <StatCard
                icon={<Gift className="w-5 h-5 text-pink-400" />}
                label="Gifts"
                value={summary?.totalGifts?.toLocaleString() ?? '0'}
              />
              <StatCard
                icon={<Coins className="w-5 h-5 text-yellow-400" />}
                label="Coins Earned"
                value={summary?.totalCoins?.toLocaleString() ?? '0'}
              />
            </div>

            {/* Top Gifter Section */}
            {/* Requirements: 9.3 */}
            {summary?.topGifter && (
              <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg border border-yellow-700/50">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-200/80">Top Gifter</p>
                    <div className="flex items-center gap-2">
                      <img
                        src={summary.topGifter.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${summary.topGifter.username}`}
                        alt={summary.topGifter.name || summary.topGifter.username}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="font-semibold text-white">
                        {summary.topGifter.name || summary.topGifter.username}
                      </span>
                      <span className="text-yellow-400 font-bold">
                        {summary.topGifter.totalCoins.toLocaleString()} coins
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stream Duration */}
            {summary?.duration && (
              <div className="text-center text-zinc-400 text-sm">
                Stream duration: {formatDuration(summary.duration)}
              </div>
            )}

            {/* Recommended Streams */}
            {/* Requirements: 9.5 */}
            {recommendedStreams.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
                  Watch More Live Streams
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {recommendedStreams.map((stream) => (
                    <RecommendedStreamCard
                      key={stream.id}
                      stream={stream}
                      onClick={() => handleStreamClick(stream.user.username)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Stat card component for displaying statistics
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <Card className="bg-zinc-800/50 border-zinc-700 p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-400">{label}</p>
    </Card>
  );
}

// Recommended stream card component
// Requirements: 9.5, 9.6
interface RecommendedStreamCardProps {
  stream: LiveStream;
  onClick: () => void;
}

function RecommendedStreamCard({ stream, onClick }: RecommendedStreamCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-zinc-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all text-left"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-zinc-700 relative">
        {stream.thumbnail ? (
          <img
            src={stream.thumbnail}
            alt={stream.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-zinc-500" />
          </div>
        )}
        {/* Live badge */}
        {stream.isLive && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded">
            LIVE
          </span>
        )}
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-10 h-10 text-white fill-white" />
        </div>
      </div>
      {/* Stream info */}
      <div className="p-2">
        <p className="text-sm font-medium text-white truncate">{stream.title}</p>
        <p className="text-xs text-zinc-400 truncate">
          {stream.user.name || stream.user.username}
        </p>
      </div>
    </button>
  );
}
