import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LiveKitRoom, 
  useLocalParticipant,
  useRoomContext,
  VideoTrack,
  AudioTrack,
} from '@livekit/components-react';
import { Track, LocalVideoTrack, LocalAudioTrack, RoomEvent } from 'livekit-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Edit, Check, X, VideoOff } from 'lucide-react';
import { CreatorStreamControls } from './creator-stream-controls';
import { ChatComponent } from './chat-component';
import type { GoLiveResponse, StreamInfo } from '@/lib/api/stream';

interface CreatorLiveViewProps {
  liveData: GoLiveResponse;
  streamInfo: StreamInfo;
  onEndStream: () => Promise<void>;
  onUpdateTitle: (title: string) => Promise<void>;
  onUpdateChatSettings: (settings: {
    isChatEnabled?: boolean;
    isChatDelayed?: boolean;
    isChatFollowersOnly?: boolean;
  }) => Promise<void>;
}

/**
 * CreatorLiveView - Main live streaming view for creators
 * Requirements: 1.4, 2.5, 3.1, 3.2, 3.3
 * - Self-preview video showing creator's camera (1.4)
 * - Stream controls integration (2.1-2.4)
 * - Chat panel alongside video (3.1, 3.2)
 * - Title editing while live (2.5)
 * - Chat settings toggle (3.3)
 */
export function CreatorLiveView({
  liveData,
  streamInfo,
  onEndStream,
  onUpdateTitle,
  onUpdateChatSettings,
}: CreatorLiveViewProps) {
  const [isEnding, setIsEnding] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // Prevent multiple connection attempts (React Strict Mode protection)
  const hasConnectedRef = useRef(false);
  const roomIdRef = useRef(liveData.roomId);
  
  // ✅ Generate stable room key once that never changes
  const stableRoomKeyRef = useRef(`livekit-${liveData.roomId}-${Date.now()}`);

  // Debug: Log component lifecycle
  useEffect(() => {
    console.log('🔄 [CreatorLiveView] Component mounted');
    return () => {
      console.log('🔄 [CreatorLiveView] Component unmounted');
    };
  }, []);

  // Reset connection flag if roomId changes
  useEffect(() => {
    if (roomIdRef.current !== liveData.roomId) {
      console.log('[CreatorLiveView] 🔄 Room ID changed, resetting connection flag');
      hasConnectedRef.current = false;
      roomIdRef.current = liveData.roomId;
      stableRoomKeyRef.current = `livekit-${liveData.roomId}-${Date.now()}`;
    }
  }, [liveData.roomId]);

  const handleEndStream = async () => {
    setIsEnding(true);
    await onEndStream();
    setIsEnding(false);
    // Reset connection flag when stream ends
    hasConnectedRef.current = false;
  };

  // ✅ Memoized callbacks to prevent unnecessary re-renders
  const handleConnected = useCallback(() => {
    if (hasConnectedRef.current) {
      console.log('[CreatorLiveView] ⚠️ Already connected, ignoring duplicate connection event');
      return;
    }
    console.log('[CreatorLiveView] ✅ Connected to LiveKit room:', liveData.roomId);
    hasConnectedRef.current = true;
    setConnectionState('connected');
  }, [liveData.roomId]);

  const handleDisconnected = useCallback((reason?: any) => {
    console.log('[CreatorLiveView] ⚠️ Disconnected from LiveKit room. Reason:', reason);
    setConnectionState('disconnected');
    // Allow reconnection after disconnect
    hasConnectedRef.current = false;
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('[CreatorLiveView] ❌ LiveKit error:', error);
    setConnectionState('disconnected');
    // Allow reconnection after error
    hasConnectedRef.current = false;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">You're Live!</h1>
          <p className="text-zinc-400">
            {connectionState === 'connecting' && 'Connecting to LiveKit...'}
            {connectionState === 'connected' && 'Broadcasting to your audience'}
            {connectionState === 'disconnected' && 'Connection lost, reconnecting...'}
          </p>
        </div>
      </div>

      {/* LiveKit Room */}
      <LiveKitRoom
        key={stableRoomKeyRef.current} // ✅ Stable key that never changes during session
        token={liveData.token}
        serverUrl={liveData.wsUrl}
        connect={true}
        video={true}
        audio={true}
        className="w-full"
        options={{
          // Optimize for better connection stability
          publishDefaults: {
            simulcast: true,
            videoCodec: 'vp8',
            stopMicTrackOnMute: false, // Keep mic track alive when muted
          },
          // Adaptive streaming for better quality
          adaptiveStream: true,
          dynacast: true,
          // Reconnection policy
          reconnectPolicy: {
            nextRetryDelayInMs: (context) => {
              // Stop after 5 attempts
              if (context.retryCount > 5) {
                console.error('[CreatorLiveView] ❌ Max reconnection attempts reached');
                return null;
              }
              // Exponential backoff: 1s, 2s, 4s, 8s, max 15s
              return Math.min(1000 * Math.pow(2, context.retryCount), 15000);
            },
          },
        }}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        onError={handleError}
      >
        <LiveViewContent
          streamInfo={streamInfo}
          onEndStream={handleEndStream}
          onUpdateTitle={onUpdateTitle}
          onUpdateChatSettings={onUpdateChatSettings}
          isEnding={isEnding}
        />
      </LiveKitRoom>
    </div>
  );
}

interface LiveViewContentProps {
  streamInfo: StreamInfo;
  onEndStream: () => Promise<void>;
  onUpdateTitle: (title: string) => Promise<void>;
  onUpdateChatSettings: (settings: {
    isChatEnabled?: boolean;
    isChatDelayed?: boolean;
    isChatFollowersOnly?: boolean;
  }) => Promise<void>;
  isEnding: boolean;
}

function LiveViewContent(props: LiveViewContentProps) {
  const { streamInfo, onEndStream, onUpdateTitle, isEnding } = props;
  // Note: props.onUpdateChatSettings is available for future chat settings UI implementation
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const [viewerCount, setViewerCount] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(streamInfo.title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | null>(null);

  // Get local tracks
  useEffect(() => {
    if (localParticipant) {
      const camTrack = localParticipant.getTrackPublication(Track.Source.Camera);
      const micTrack = localParticipant.getTrackPublication(Track.Source.Microphone);
      
      if (camTrack?.track) {
        setVideoTrack(camTrack.track as LocalVideoTrack);
      }
      if (micTrack?.track) {
        setAudioTrack(micTrack.track as LocalAudioTrack);
      }
    }
  }, [localParticipant, isCameraEnabled, isMicrophoneEnabled]);

  // Update viewer count
  useEffect(() => {
    const updateViewerCount = () => {
      // Count remote participants (excluding the creator)
      const count = room.remoteParticipants.size;
      setViewerCount(count);
    };

    updateViewerCount();

    room.on(RoomEvent.ParticipantConnected, updateViewerCount);
    room.on(RoomEvent.ParticipantDisconnected, updateViewerCount);

    return () => {
      room.off(RoomEvent.ParticipantConnected, updateViewerCount);
      room.off(RoomEvent.ParticipantDisconnected, updateViewerCount);
    };
  }, [room]);

  // Toggle camera - Requirements: 2.1
  const handleToggleCamera = useCallback(async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (error) {
      console.error('[CreatorLiveView] Failed to toggle camera:', error);
    }
  }, [localParticipant, isCameraEnabled]);

  // Toggle microphone - Requirements: 2.2
  const handleToggleMic = useCallback(async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (error) {
      console.error('[CreatorLiveView] Failed to toggle microphone:', error);
    }
  }, [localParticipant, isMicrophoneEnabled]);

  // Save title - Requirements: 2.5
  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return;
    
    setIsSavingTitle(true);
    try {
      await onUpdateTitle(editedTitle.trim());
      setIsEditingTitle(false);
    } catch (error) {
      console.error('[CreatorLiveView] Failed to update title:', error);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(streamInfo.title);
    setIsEditingTitle(false);
  };

  return (
    <div className="space-y-4">
      {/* Stream Controls */}
      <CreatorStreamControls
        onToggleCamera={handleToggleCamera}
        onToggleMic={handleToggleMic}
        onEndStream={onEndStream}
        isCameraOn={isCameraEnabled}
        isMicOn={isMicrophoneEnabled}
        viewerCount={viewerCount}
        isEnding={isEnding}
      />

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Preview - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Self-preview video - Requirements: 1.4 */}
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <div className="relative aspect-video bg-black">
              {videoTrack && isCameraEnabled ? (
                <VideoTrack
                  trackRef={{
                    participant: localParticipant,
                    publication: localParticipant.getTrackPublication(Track.Source.Camera)!,
                    source: Track.Source.Camera,
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto">
                      <VideoOff className="w-10 h-10 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Camera is off</p>
                      <p className="text-zinc-500 text-sm">Click the camera button to turn it on</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Audio track (hidden) */}
              {audioTrack && isMicrophoneEnabled && (
                <AudioTrack
                  trackRef={{
                    participant: localParticipant,
                    publication: localParticipant.getTrackPublication(Track.Source.Microphone)!,
                    source: Track.Source.Microphone,
                  }}
                  // Don't set volume on local track - it causes warnings
                />
              )}

              {/* Live indicator overlay */}
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-semibold text-sm shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>
            </div>
          </Card>

          {/* Stream Info with editable title - Requirements: 2.5 */}
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveTitle();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveTitle}
                      disabled={isSavingTitle || !editedTitle.trim()}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isSavingTitle ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="border-zinc-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-white">{streamInfo.title}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingTitle(true)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              {streamInfo.description && !isEditingTitle && (
                <p className="text-sm text-zinc-400 leading-relaxed">{streamInfo.description}</p>
              )}
            </div>
          </Card>
        </div>

        {/* Chat Panel - 1 column */}
        {/* Requirements: 3.1, 3.2, 3.3 */}
        {streamInfo.isChatEnabled ? (
          <div className="lg:col-span-1 h-[600px]">
            <ChatComponent
              hostName="You"
              isChatEnabled={streamInfo.isChatEnabled}
              isChatDelayed={streamInfo.isChatDelayed}
              isChatFollowersOnly={streamInfo.isChatFollowersOnly}
              isFollowing={true} // Creator is always "following" themselves
            />
          </div>
        ) : (
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800 h-[600px] flex items-center justify-center">
              <div className="text-center space-y-3 px-6">
                <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-zinc-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Chat Disabled</h4>
                  <p className="text-sm text-zinc-500">
                    Chat is currently disabled for this stream
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
