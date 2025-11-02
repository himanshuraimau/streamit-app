import { LiveKitRoom } from '@livekit/components-react';
import { VideoComponent } from './video-component';
import { ChatComponent } from './chat-component';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreatorStreamLayoutProps {
  token: {
    token: string;
    identity: string;
    name: string;
    wsUrl: string;
  } | null;
  loading: boolean;
  error: string | null;
  streamInfo: {
    title: string;
    description?: string;
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
  };
  onRetry?: () => void;
}

export function CreatorStreamLayout({
  token,
  loading,
  error,
  streamInfo,
  onRetry
}: CreatorStreamLayoutProps) {
  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <div className="text-center">
            <p className="text-white font-medium">Connecting to stream preview...</p>
            <p className="text-zinc-500 text-sm mt-1">Setting up your broadcast</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !token) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <div>
            <p className="text-red-400 mb-2 font-semibold">Failed to connect</p>
            <p className="text-zinc-500 text-sm">{error || 'Unable to establish connection'}</p>
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Retry Connection
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <LiveKitRoom
      token={token.token}
      serverUrl={token.wsUrl}
      connect={true}
      className="w-full h-full"
      onConnected={() => {
        console.log('[CreatorStreamLayout] Connected to LiveKit room');
        console.log('[CreatorStreamLayout] Room identity:', token.identity);
        console.log('[CreatorStreamLayout] Room name:', token.identity.replace('Host-', ''));
      }}
      onDisconnected={() => {
        console.log('[CreatorStreamLayout] Disconnected from LiveKit room');
      }}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Preview - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <VideoComponent 
              hostName={token.name}
            />
          </Card>
          
          {/* Stream Info */}
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{streamInfo.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-sm font-medium text-red-400">LIVE</span>
                </div>
              </div>
              {streamInfo.description && (
                <p className="text-sm text-zinc-400 leading-relaxed">{streamInfo.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                <span className="px-2 py-1 bg-zinc-800 rounded">Preview Mode</span>
                <span>This is how viewers see your stream</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Chat Preview - 1 column */}
        {streamInfo.isChatEnabled ? (
          <div className="lg:col-span-1 h-[700px]">
            <ChatComponent
              hostName={token.name}
              isChatEnabled={streamInfo.isChatEnabled}
              isChatDelayed={streamInfo.isChatDelayed}
              isChatFollowersOnly={streamInfo.isChatFollowersOnly}
              isFollowing={false}
            />
          </div>
        ) : (
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800 h-[700px] flex items-center justify-center">
              <div className="text-center space-y-3 px-6">
                <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Chat Disabled</h4>
                  <p className="text-sm text-zinc-500">
                    Enable chat in settings to interact with your viewers
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </LiveKitRoom>
  );
}
