import { StreamPlayer } from '@/components/stream/stream-player';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Heart, Share2 } from 'lucide-react';
import type { StreamByUsername } from '@/lib/api/stream';
import { GiftButton } from '@/components/payment/GiftButton';

interface StreamContainerProps {
  stream: StreamByUsername;
  isFollowing?: boolean;
  onFollow?: () => void;
  onShare?: () => void;
}

export function StreamContainer({ 
  stream,
  isFollowing = false,
  onFollow,
  onShare
}: StreamContainerProps) {
  const navigate = useNavigate();

  if (!stream.isLive) {
    return (
      <div className="space-y-6">
        {/* Offline Video Display */}
        <div className="aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
          <div className="text-center space-y-4 px-6">
            <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto backdrop-blur-sm">
              <svg className="w-10 h-10 text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Stream Offline</h2>
              <p className="text-zinc-400">
                {stream.user.name || stream.user.username} is not streaming right now.
              </p>
            </div>
            <Button
              onClick={() => navigate(`/${stream.user.username}`)}
              className="bg-purple-600 hover:bg-purple-700 mt-4"
            >
              Visit Profile
            </Button>
          </div>
        </div>

        {/* Stream Info */}
        <StreamInfo 
          stream={stream} 
          isFollowing={isFollowing}
          onFollow={onFollow}
          onShare={onShare}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Stream Player with Chat */}
      <StreamPlayer
        hostId={stream.userId}
        hostName={stream.user.name || stream.user.username}
        streamInfo={{
          title: stream.title,
          isChatEnabled: stream.isChatEnabled,
          isChatDelayed: stream.isChatDelayed,
          isChatFollowersOnly: stream.isChatFollowersOnly,
        }}
        isFollowing={isFollowing}
      />

      {/* Stream Info */}
      <StreamInfo 
        stream={stream} 
        isFollowing={isFollowing}
        onFollow={onFollow}
        onShare={onShare}
      />
    </div>
  );
}

function StreamInfo({ 
  stream, 
  isFollowing,
  onFollow,
  onShare
}: {
  stream: StreamByUsername;
  isFollowing: boolean;
  onFollow?: () => void;
  onShare?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <div className="space-y-4">
        {/* Title and Live Badge */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-white flex-1">{stream.title}</h1>
          {stream.isLive && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-red-400 font-semibold text-sm">LIVE</span>
            </div>
          )}
        </div>

        {/* Creator Info and Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => navigate(`/${stream.user.username}`)}
            className="flex items-center gap-3 group"
          >
            <img
              src={stream.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${stream.user.username}`}
              alt={stream.user.name || stream.user.username}
              className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700 group-hover:border-purple-500 transition-colors"
            />
            <div className="text-left">
              <p className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                {stream.user.name || stream.user.username}
              </p>
              <p className="text-zinc-400 text-sm">@{stream.user.username}</p>
            </div>
          </button>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={onFollow}
              variant="outline"
              size="sm"
              className={`border-zinc-600 hover:bg-zinc-800 ${
                isFollowing ? 'bg-purple-600/20 border-purple-600 text-purple-400' : 'text-zinc-300'
              }`}
            >
              <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <GiftButton
              receiverId={stream.userId}
              receiverName={stream.user.name || stream.user.username}
              streamId={stream.id}
              variant="outline"
              size="sm"
              showLabel={true}
              className="border-zinc-600 text-purple-400 hover:bg-zinc-800"
            />
            <Button
              onClick={onShare}
              variant="outline"
              size="sm"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
