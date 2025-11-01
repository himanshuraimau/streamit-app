import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Video, Users, Settings2, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStream } from '@/hooks/useStream';
import { StreamPlayer } from '@/components/stream/stream-player';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

export default function Streams() {
  const { data: session } = authClient.useSession();
  const { streamInfo, streamStatus, updateStreamInfo, updateChatSettings, fetchStreamStatus } = useStream();
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [chatSettings, setChatSettings] = useState({
    isChatEnabled: true,
    isChatDelayed: false,
    isChatFollowersOnly: false,
  });

  // Initialize title and chat settings when streamInfo loads
  useEffect(() => {
    if (streamInfo) {
      setTitle(streamInfo.title);
      setChatSettings({
        isChatEnabled: streamInfo.isChatEnabled,
        isChatDelayed: streamInfo.isChatDelayed,
        isChatFollowersOnly: streamInfo.isChatFollowersOnly,
      });
    }
  }, [streamInfo]);

  // Poll stream status every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStreamStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchStreamStatus]);

  const handleSaveTitle = async () => {
    if (!title.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    const result = await updateStreamInfo({ title: title.trim() });
    if (result) {
      setIsEditingTitle(false);
    }
  };

  const handleChatSettingChange = async (setting: keyof typeof chatSettings) => {
    const newValue = !chatSettings[setting];
    setChatSettings(prev => ({ ...prev, [setting]: newValue }));
    
    await updateChatSettings({ [setting]: newValue });
  };

  if (!streamInfo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Streams</h1>
            <p className="text-zinc-400">Loading your stream...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Streams</h1>
          <p className="text-zinc-400">Manage your live stream and viewer experience</p>
        </div>
        {streamStatus?.isLive && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
            <div className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-lg">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{streamStatus.viewerCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Stream Status Card */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Video className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Stream Status</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            streamStatus?.isLive 
              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
              : 'bg-zinc-700 text-zinc-300'
          }`}>
            {streamStatus?.isLive ? 'Live' : 'Offline'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-800 p-4 rounded-lg">
            <p className="text-zinc-400 text-sm mb-1">Status</p>
            <p className="text-white font-semibold">
              {streamStatus?.isLive ? '🔴 Broadcasting' : '⚫ Not Streaming'}
            </p>
          </div>
          <div className="bg-zinc-800 p-4 rounded-lg">
            <p className="text-zinc-400 text-sm mb-1">Viewers</p>
            <p className="text-white font-semibold">{streamStatus?.viewerCount || 0}</p>
          </div>
          <div className="bg-zinc-800 p-4 rounded-lg">
            <p className="text-zinc-400 text-sm mb-1">Chat</p>
            <p className="text-white font-semibold">
              {streamInfo.isChatEnabled ? '💬 Enabled' : '🔇 Disabled'}
            </p>
          </div>
        </div>
      </Card>

      {/* Stream Info Card */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Edit className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Stream Information</h3>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-zinc-300">Stream Title</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!isEditingTitle}
                className="flex-1 bg-zinc-800 border-zinc-700 text-white disabled:opacity-50"
                placeholder="Enter stream title..."
              />
              {isEditingTitle ? (
                <>
                  <Button 
                    onClick={handleSaveTitle}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Save
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsEditingTitle(false);
                      setTitle(streamInfo.title);
                    }}
                    className="border-zinc-700"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditingTitle(true)}
                  variant="outline"
                  className="border-zinc-700"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Chat Settings Card */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings2 className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Chat Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Enable Chat</p>
              <p className="text-zinc-400 text-sm">Allow viewers to send messages</p>
            </div>
            <Switch
              checked={chatSettings.isChatEnabled}
              onCheckedChange={() => handleChatSettingChange('isChatEnabled')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Followers Only</p>
              <p className="text-zinc-400 text-sm">Only followers can chat</p>
            </div>
            <Switch
              checked={chatSettings.isChatFollowersOnly}
              onCheckedChange={() => handleChatSettingChange('isChatFollowersOnly')}
              disabled={!chatSettings.isChatEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Delayed Chat</p>
              <p className="text-zinc-400 text-sm">Add 3-second delay to messages</p>
            </div>
            <Switch
              checked={chatSettings.isChatDelayed}
              onCheckedChange={() => handleChatSettingChange('isChatDelayed')}
              disabled={!chatSettings.isChatEnabled}
            />
          </div>
        </div>
      </Card>

      {/* Stream Preview */}
      {session?.user && streamInfo.ingressId && (
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Video className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Stream Preview</h3>
            <span className="ml-auto text-xs text-zinc-500">
              {streamInfo.isLive ? (
                <span className="text-green-400">● Live</span>
              ) : (
                <span className="text-zinc-400">● Offline</span>
              )}
            </span>
          </div>

          <StreamPlayer
            hostId={session.user.id}
            hostName={session.user.name || 'You'}
            streamInfo={{
              title: streamInfo.title,
              isChatEnabled: streamInfo.isChatEnabled,
              isChatDelayed: streamInfo.isChatDelayed,
              isChatFollowersOnly: streamInfo.isChatFollowersOnly,
            }}
            isFollowing={true}
          />
        </Card>
      )}

      {/* No Stream Setup Yet */}
      {session?.user && !streamInfo.ingressId && (
        <Card className="bg-zinc-900 border-zinc-800 p-8">
          <div className="text-center">
            <Video className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Stream Configured</h3>
            <p className="text-zinc-400 mb-4">
              Generate a stream key first to preview your stream.
            </p>
            <Button
              onClick={() => window.location.href = '/creator-dashboard/keys'}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Go to Keys
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}