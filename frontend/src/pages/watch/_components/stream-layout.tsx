import { useState, useCallback } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { VideoComponent } from './video-component';
import { ChatComponent } from './chat-component';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EngagementPopup } from '@/components/stream/engagement-popup';
import { ChatVisibilityToggle, useChatVisibility } from '@/components/stream/chat-visibility-toggle';
import { ImmersiveModeOverlay, useImmersiveMode, useSwipeToImmersive } from '@/components/stream/immersive-mode-overlay';
import { PostStreamSummary } from '@/components/stream/post-stream-summary';
import { ScreenRecordingProtection } from '@/components/stream/screen-recording-protection';
import { BlockedUsersProvider } from '@/contexts/BlockedUsersContext';
import { useDataChannelEvents } from '@/hooks/useDataChannelEvents';
import { paymentApi } from '@/lib/api/payment';

interface StreamLayoutProps {
  token: {
    token: string;
    identity: string;
    name: string;
    wsUrl: string;
  } | null;
  loading: boolean;
  error: string | null;
  streamInfo: {
    id?: string;
    title: string;
    description?: string;
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
    startedAt?: string | null;
  };
  hostName: string;
  hostIdentity: string;
  hostUsername?: string;
  hostImage?: string | null;
  isFollowing?: boolean;
  onRetry?: () => void;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: 'viewer' | 'creator';
}

/**
 * Inner content component that uses LiveKit room context
 * Must be rendered inside LiveKitRoom to access room context
 * 
 * Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
interface StreamLayoutContentProps {
  streamInfo: {
    id?: string;
    title: string;
    description?: string;
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
    startedAt?: string | null;
  };
  hostName: string;
  hostIdentity: string;
  hostUsername?: string;
  hostImage?: string | null;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  variant: 'viewer' | 'creator';
}

function StreamLayoutContent({
  streamInfo,
  hostName,
  hostIdentity,
  hostUsername,
  hostImage,
  isFollowing,
  onFollowChange,
  variant,
}: StreamLayoutContentProps) {
  // Chat visibility state - Requirements: 6.1, 6.2, 6.3
  const [isChatVisible, setChatVisible] = useChatVisibility();
  
  // Immersive mode state - Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
  const { isImmersive, enterImmersiveMode, exitImmersiveMode } = useImmersiveMode();
  
  // Post-stream summary state - Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
  const [showPostStreamSummary, setShowPostStreamSummary] = useState(false);
  const [currentIsFollowing, setCurrentIsFollowing] = useState(isFollowing);
  
  // Handle stream ended event
  const handleStreamEnded = useCallback(() => {
    setShowPostStreamSummary(true);
  }, []);
  
  // Use data channel events hook to listen for engagement events
  // Requirements: 4.1, 4.2, 4.3, 9.1
  const { events, dismissEvent, hasStreamEnded } = useDataChannelEvents({
    onStreamEnded: handleStreamEnded,
  });
  
  // Show post-stream summary when stream ends via data channel
  useState(() => {
    if (hasStreamEnded) {
      setShowPostStreamSummary(true);
    }
  });
  
  // Swipe to enter immersive mode - Requirements: 5.1
  const swipeHandlers = useSwipeToImmersive(enterImmersiveMode);
  
  // Handle double-tap like in immersive mode - Requirements: 5.4
  const handleImmersiveDoubleTap = useCallback(async () => {
    if (streamInfo.id) {
      try {
        await paymentApi.sendPennyTip({
          creatorId: hostIdentity,
          streamId: streamInfo.id,
        });
      } catch (error) {
        console.error('[StreamLayout] Failed to send penny tip:', error);
      }
    }
  }, [hostIdentity, streamInfo.id]);
  
  // Handle follow change
  const handleFollowChange = useCallback((newIsFollowing: boolean) => {
    setCurrentIsFollowing(newIsFollowing);
    onFollowChange?.(newIsFollowing);
  }, [onFollowChange]);

  return (
    <BlockedUsersProvider>
      {/* Screen Recording Protection - Requirements: 8.1, 8.2 */}
      <ScreenRecordingProtection enabled={variant === 'viewer'}>
        {/* Engagement Popup Overlay - Requirements: 4.1, 4.2, 4.3, 4.4, 4.5 */}
        <EngagementPopup events={events} onDismiss={dismissEvent} />

        {/* Immersive Mode Overlay - Requirements: 5.1, 5.2, 5.3, 5.4, 5.5 */}
        <ImmersiveModeOverlay
          isActive={isImmersive}
          onExit={exitImmersiveMode}
          onDoubleTap={handleImmersiveDoubleTap}
        >
          <VideoComponent 
            hostIdentity={hostIdentity}
            hostName={hostName}
            streamId={streamInfo.id}
            startedAt={streamInfo.startedAt}
            showControls={false}
          />
        </ImmersiveModeOverlay>

        <div className="grid lg:grid-cols-3 gap-6 h-full" {...swipeHandlers}>
          {/* Video Section - Takes 2 columns */}
          <div className={`${isChatVisible && streamInfo.isChatEnabled ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
            <VideoComponent 
              hostIdentity={hostIdentity}
              hostName={hostName}
              streamId={streamInfo.id}
              startedAt={streamInfo.startedAt}
            />
            
            {/* Stream Info Card */}
            <Card className="bg-zinc-900 border-zinc-800 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{streamInfo.title}</h3>
                  <div className="flex items-center gap-3">
                    {/* Chat Visibility Toggle - Requirements: 6.1, 6.2, 6.3 */}
                    {streamInfo.isChatEnabled && (
                      <ChatVisibilityToggle
                        isVisible={isChatVisible}
                        onToggle={setChatVisible}
                        variant="icon-only"
                      />
                    )}
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span className="text-sm font-medium text-red-400">LIVE</span>
                    </div>
                  </div>
                </div>
                {streamInfo.description && (
                  <p className="text-sm text-zinc-400 leading-relaxed">{streamInfo.description}</p>
                )}
              </div>
            </Card>
          </div>

          {/* Chat Section - Takes 1 column - Requirements: 6.1, 7.1, 7.2 */}
          {streamInfo.isChatEnabled && isChatVisible && (
            <div className="lg:col-span-1 h-[700px]">
              <ChatComponent
                hostName={hostName}
                isChatEnabled={streamInfo.isChatEnabled}
                isChatDelayed={streamInfo.isChatDelayed}
                isChatFollowersOnly={streamInfo.isChatFollowersOnly}
                isFollowing={currentIsFollowing}
                variant={variant === 'creator' ? 'default' : 'default'}
              />
            </div>
          )}

          {/* Chat Disabled Message */}
          {!streamInfo.isChatEnabled && (
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
                      The streamer has disabled chat for this stream.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Post-Stream Summary Modal - Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6 */}
        {streamInfo.id && (
          <PostStreamSummary
            streamId={streamInfo.id}
            creatorId={hostIdentity}
            creatorName={hostName}
            creatorUsername={hostUsername || hostName}
            creatorImage={hostImage}
            isFollowing={currentIsFollowing}
            open={showPostStreamSummary}
            onClose={() => setShowPostStreamSummary(false)}
            onFollowChange={handleFollowChange}
          />
        )}
      </ScreenRecordingProtection>
    </BlockedUsersProvider>
  );
}

export function StreamLayout({
  token,
  loading,
  error,
  streamInfo,
  hostName,
  hostIdentity,
  hostUsername,
  hostImage,
  isFollowing = false,
  onRetry,
  onFollowChange,
  variant = 'viewer'
}: StreamLayoutProps) {
  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <div className="text-center">
            <p className="text-white font-medium">Connecting to stream...</p>
            <p className="text-zinc-500 text-sm mt-1">This may take a few seconds</p>
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
            <p className="text-red-400 mb-2 font-semibold">Failed to connect to stream</p>
            <p className="text-zinc-500 text-sm">{error || 'Unknown error occurred'}</p>
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
    <div className="w-full h-full">
      <LiveKitRoom
        token={token.token}
        serverUrl={token.wsUrl}
        connect={true}
        className="w-full h-full"
      >
        <StreamLayoutContent
          streamInfo={streamInfo}
          hostName={hostName}
          hostIdentity={hostIdentity}
          hostUsername={hostUsername}
          hostImage={hostImage}
          isFollowing={isFollowing}
          onFollowChange={onFollowChange}
          variant={variant}
        />
      </LiveKitRoom>
    </div>
  );
}
