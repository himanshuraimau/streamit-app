import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { 
  LiveKitRoom, 
  useLocalParticipant,
  useRoomContext,
  VideoTrack,
} from '@livekit/components-react';
import {
  Track,
  LocalVideoTrack,
  RoomEvent,
} from 'livekit-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Edit,
  Check,
  X,
  VideoOff,
  Clock3,
  Heart,
  Coins,
  Signal,
  Trophy,
  UserPlus,
  Pin,
  MessageSquare,
  Music4,
  Waves,
} from 'lucide-react';
import { CreatorStreamControls } from './creator-stream-controls';
import { ChatComponent } from './chat-component';
import { useAuthSession } from '@/hooks/useAuthSession';
import { streamApi, type GoLiveResponse, type StreamInfo, type StreamSummary } from '@/lib/api/stream';
import { socialApi } from '@/lib/api/social';
import type { GiftTransaction } from '@/types/payment.types';
import { cn, formatDuration } from '@/lib/utils';
import { toast } from 'sonner';
import {
  calculateStreamEarnings,
  fetchAllReceivedGiftsForStream,
} from './stream-metrics';

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

type CreatorOverlay = {
  id: string;
  type: 'top-gifter' | 'new-follower';
  title: string;
  message: string;
};

type CreatorPanel = 'viewers' | 'gifts' | 'pin' | 'moderation' | 'filters' | null;

const previewFilterClasses: Record<StreamInfo['filterPreset'], string> = {
  NONE: '',
  WARM: 'sepia-[0.18] saturate-150 brightness-105',
  COOL: 'brightness-95 contrast-110 hue-rotate-[12deg]',
  NOIR: 'grayscale contrast-125 brightness-90',
  POP: 'saturate-200 contrast-110',
};

const previewFilterOptions: Array<{
  id: StreamInfo['filterPreset'];
  label: string;
  description: string;
}> = [
  { id: 'NONE', label: 'Natural', description: 'No visual filter' },
  { id: 'WARM', label: 'Warm Glow', description: 'Softer highlights and warmer tones' },
  { id: 'COOL', label: 'Cool Studio', description: 'Sharper blue-toned look' },
  { id: 'NOIR', label: 'Noir', description: 'Black-and-white contrast look' },
  { id: 'POP', label: 'Pop', description: 'Extra saturation for a bold feed look' },
];

function findPreferredCamera(
  cameras: MediaDeviceInfo[],
  facingMode: StreamInfo['cameraFacingMode']
): MediaDeviceInfo | null {
  if (!cameras.length) {
    return null;
  }

  const searchTerms =
    facingMode === 'BACK'
      ? ['back', 'rear', 'environment']
      : ['front', 'user', 'face'];

  const matchedCamera = cameras.find((camera) =>
    searchTerms.some((term) => camera.label.toLowerCase().includes(term))
  );

  if (matchedCamera) {
    return matchedCamera;
  }

  return facingMode === 'BACK' ? cameras[cameras.length - 1] : cameras[0];
}

function MetricsCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-zinc-800 p-2.5 text-white">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
          <p className="text-lg font-semibold text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function CreatorOverlayStack({
  overlays,
  onDismiss,
}: {
  overlays: CreatorOverlay[];
  onDismiss: (id: string) => void;
}) {
  if (!overlays.length) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-20 space-y-3">
      {overlays.map((overlay) => {
        const isTopGifter = overlay.type === 'top-gifter';

        return (
          <div
            key={overlay.id}
            className={cn(
              'w-[280px] rounded-2xl border p-4 shadow-2xl backdrop-blur',
              isTopGifter
                ? 'border-yellow-500/40 bg-yellow-500/15'
                : 'border-emerald-500/40 bg-emerald-500/15'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'mt-0.5 rounded-full p-2',
                  isTopGifter ? 'bg-yellow-400/15 text-yellow-300' : 'bg-emerald-400/15 text-emerald-300'
                )}
              >
                {isTopGifter ? (
                  <Trophy className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{overlay.title}</p>
                  <button
                    type="button"
                    onClick={() => onDismiss(overlay.id)}
                    className="text-zinc-400 transition-colors hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-zinc-200">{overlay.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
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
  const { data: session } = useAuthSession();
  const [isEnding, setIsEnding] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [summary, setSummary] = useState<StreamSummary | null>(null);
  const [giftTransactions, setGiftTransactions] = useState<GiftTransaction[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [overlays, setOverlays] = useState<CreatorOverlay[]>([]);
  const [, setTimerTick] = useState(0);
  
  const hasConnectedRef = useRef(false);
  const roomIdRef = useRef(liveData.roomId);
  const lastKnownTopGifterRef = useRef<string | null>(null);
  const lastFollowerCountRef = useRef<number | null>(null);
  const metricsBootstrappedRef = useRef(false);
  const liveStartedFallbackRef = useRef(new Date().toISOString());
  const stableRoomKeyRef = useRef(`livekit-${liveData.roomId}-${Date.now()}`);

  useEffect(() => {
    console.log('🔄 [CreatorLiveView] Component mounted');
    return () => {
      console.log('🔄 [CreatorLiveView] Component unmounted');
    };
  }, []);

  useEffect(() => {
    if (roomIdRef.current !== liveData.roomId) {
      console.log('[CreatorLiveView] 🔄 Room ID changed, resetting connection flag');
      hasConnectedRef.current = false;
      roomIdRef.current = liveData.roomId;
      stableRoomKeyRef.current = `livekit-${liveData.roomId}-${Date.now()}`;
    }
  }, [liveData.roomId]);

  const dismissOverlay = useCallback((overlayId: string) => {
    setOverlays((current) => current.filter((overlay) => overlay.id !== overlayId));
  }, []);

  const addOverlay = useCallback((overlay: Omit<CreatorOverlay, 'id'>) => {
    const overlayId = `${overlay.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setOverlays((current) => [...current.slice(-1), { ...overlay, id: overlayId }]);

    window.setTimeout(() => {
      setOverlays((current) => current.filter((entry) => entry.id !== overlayId));
    }, 4500);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTimerTick((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const fetchLiveMetrics = useCallback(async () => {
    try {
      const [summaryResponse, currentGiftTransactions, profileResponse] = await Promise.all([
        streamApi.getStreamSummary(streamInfo.id),
        fetchAllReceivedGiftsForStream(streamInfo.id),
        session?.user?.username
          ? socialApi.getCreatorProfile(session.user.username)
          : Promise.resolve(null),
      ]);

      if (summaryResponse.success && summaryResponse.data) {
        const nextSummary = summaryResponse.data;
        setSummary(nextSummary);

        if (nextSummary.startedAt) {
          liveStartedFallbackRef.current = nextSummary.startedAt;
        }

        const nextTopGifterId = nextSummary.topGifter?.userId ?? null;
        if (
          metricsBootstrappedRef.current &&
          nextTopGifterId &&
          nextTopGifterId !== lastKnownTopGifterRef.current
        ) {
          addOverlay({
            type: 'top-gifter',
            title: 'Top gifter update',
            message: `${nextSummary.topGifter?.name || nextSummary.topGifter?.username} is leading with ${nextSummary.topGifter?.totalCoins.toLocaleString()} coins.`,
          });
        }

        lastKnownTopGifterRef.current = nextTopGifterId;
      }

      setGiftTransactions(currentGiftTransactions);
      setEarnings(calculateStreamEarnings(currentGiftTransactions));

      if (profileResponse?.success && profileResponse.data) {
        const nextFollowerCount = profileResponse.data.followerCount;
        setFollowerCount(nextFollowerCount);

        if (
          metricsBootstrappedRef.current &&
          lastFollowerCountRef.current !== null &&
          nextFollowerCount > lastFollowerCountRef.current
        ) {
          const followerDelta = nextFollowerCount - lastFollowerCountRef.current;
          addOverlay({
            type: 'new-follower',
            title: followerDelta > 1 ? 'New followers' : 'New follower',
            message:
              followerDelta > 1
                ? `${followerDelta} new followers joined your community during this live.`
                : 'Someone just followed you from this live stream.',
          });
        }

        lastFollowerCountRef.current = nextFollowerCount;
      }

      metricsBootstrappedRef.current = true;
    } catch (error) {
      console.error('[CreatorLiveView] Failed to fetch live metrics:', error);
    }
  }, [addOverlay, session?.user?.username, streamInfo.id]);

  useEffect(() => {
    fetchLiveMetrics();

    const interval = window.setInterval(() => {
      fetchLiveMetrics();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [fetchLiveMetrics]);

  const handleEndStream = async () => {
    setIsEnding(true);
    await onEndStream();
    setIsEnding(false);
    // Reset connection flag when stream ends
    hasConnectedRef.current = false;
  };

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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="bg-zinc-900 border-zinc-800 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white hover:bg-red-600">Creator Live</Badge>
                <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                  {connectionState === 'connecting' && 'Connecting'}
                  {connectionState === 'connected' && 'Broadcasting'}
                  {connectionState === 'disconnected' && 'Reconnecting'}
                </Badge>
              </div>
              <h1 className="mt-3 text-3xl font-bold text-white">You’re Live!</h1>
              <p className="mt-2 text-zinc-400">
                {connectionState === 'connecting' && 'Connecting to LiveKit...'}
                {connectionState === 'connected' && 'Broadcasting to your audience with live insights.'}
                {connectionState === 'disconnected' && 'Connection lost, attempting to recover.'}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Followers</p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {followerCount.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricsCard
            icon={<Clock3 className="w-5 h-5 text-sky-400" />}
            label="Live Timer"
            value={formatDuration(summary?.startedAt || liveStartedFallbackRef.current)}
          />
          <MetricsCard
            icon={<Heart className="w-5 h-5 text-fuchsia-400" />}
            label="Likes"
            value={(summary?.totalLikes ?? 0).toLocaleString()}
          />
          <MetricsCard
            icon={<Coins className="w-5 h-5 text-yellow-400" />}
            label="Earnings"
            value={`${earnings.toLocaleString()} coins`}
          />
        </div>
      </div>

      <LiveKitRoom
        key={stableRoomKeyRef.current}
        token={liveData.token}
        serverUrl={liveData.wsUrl}
        connect={true}
        video={!streamInfo.audioOnlyMode}
        audio={true}
        className="w-full"
        options={{
          publishDefaults: {
            simulcast: true,
            videoCodec: 'vp8',
            stopMicTrackOnMute: false,
          },
          adaptiveStream: true,
          dynacast: true,
          reconnectPolicy: {
            nextRetryDelayInMs: (context) => {
              if (context.retryCount > 5) {
                console.error('[CreatorLiveView] ❌ Max reconnection attempts reached');
                return null;
              }
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
          summary={summary}
          giftTransactions={giftTransactions}
          earnings={earnings}
          overlays={overlays}
          onDismissOverlay={dismissOverlay}
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
  summary: StreamSummary | null;
  giftTransactions: GiftTransaction[];
  earnings: number;
  overlays: CreatorOverlay[];
  onDismissOverlay: (id: string) => void;
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
  const {
    streamInfo,
    summary,
    giftTransactions,
    earnings,
    overlays,
    onDismissOverlay,
    onEndStream,
    onUpdateTitle,
    onUpdateChatSettings,
    isEnding,
  } = props;
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const [viewerCount, setViewerCount] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(streamInfo.title);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [isChatPanelVisible, setIsChatPanelVisible] = useState(true);
  const [activePanel, setActivePanel] = useState<CreatorPanel>(null);
  const [pinnedMessageDraft, setPinnedMessageDraft] = useState('');
  const [pinnedMessage, setPinnedMessage] = useState('');
  const [isAudioOnly, setIsAudioOnly] = useState(streamInfo.audioOnlyMode);
  const [selectedFilter, setSelectedFilter] = useState<StreamInfo['filterPreset']>(
    streamInfo.filterPreset || 'NONE'
  );
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const audioOnlyMutedCameraRef = useRef(false);
  const initialCameraAppliedRef = useRef(false);

  const participants = Array.from(room.remoteParticipants.values());

  const loadAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableCameras(devices.filter((device) => device.kind === 'videoinput'));
    } catch (error) {
      console.error('[CreatorLiveView] Failed to enumerate cameras:', error);
    }
  }, []);

  useEffect(() => {
    if (localParticipant) {
      const camTrack = localParticipant.getTrackPublication(Track.Source.Camera);
      
      if (camTrack?.track) {
        setVideoTrack(camTrack.track as LocalVideoTrack);
      }
    }
  }, [localParticipant, isCameraEnabled, isMicrophoneEnabled]);

  useEffect(() => {
    const updateViewerCount = () => {
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

  useEffect(() => {
    loadAvailableCameras();

    const handleDeviceChange = () => {
      loadAvailableCameras();
    };

    navigator.mediaDevices?.addEventListener?.('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', handleDeviceChange);
    };
  }, [loadAvailableCameras]);

  useEffect(() => {
    setIsAudioOnly(streamInfo.audioOnlyMode);
    setSelectedFilter(streamInfo.filterPreset || 'NONE');
  }, [streamInfo.audioOnlyMode, streamInfo.filterPreset]);

  useEffect(() => {
    if (initialCameraAppliedRef.current || !isCameraEnabled || !localParticipant) {
      return;
    }

    const preferredCamera = findPreferredCamera(availableCameras, streamInfo.cameraFacingMode);
    if (!preferredCamera) {
      return;
    }

    const activeCameraId = localParticipant
      .getTrackPublication(Track.Source.Camera)
      ?.track?.mediaStreamTrack.getSettings().deviceId;

    if (preferredCamera.deviceId === activeCameraId) {
      initialCameraAppliedRef.current = true;
      return;
    }

    room
      .switchActiveDevice('videoinput', preferredCamera.deviceId)
      .then(() => {
        initialCameraAppliedRef.current = true;
      })
      .catch((error) => {
        console.error('[CreatorLiveView] Failed to apply preferred camera:', error);
      });
  }, [availableCameras, isCameraEnabled, localParticipant, room, streamInfo.cameraFacingMode]);

  const handleToggleCamera = useCallback(async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
      if (!isCameraEnabled && isAudioOnly) {
        setIsAudioOnly(false);
        audioOnlyMutedCameraRef.current = false;
      }
    } catch (error) {
      console.error('[CreatorLiveView] Failed to toggle camera:', error);
    }
  }, [isAudioOnly, isCameraEnabled, localParticipant]);

  const handleToggleMic = useCallback(async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (error) {
      console.error('[CreatorLiveView] Failed to toggle microphone:', error);
    }
  }, [localParticipant, isMicrophoneEnabled]);

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

  const handleToggleAudioOnly = useCallback(async () => {
    try {
      if (isAudioOnly) {
        if (audioOnlyMutedCameraRef.current) {
          await localParticipant.setCameraEnabled(true);
        }
        audioOnlyMutedCameraRef.current = false;
        setIsAudioOnly(false);
        return;
      }

      if (isCameraEnabled) {
        await localParticipant.setCameraEnabled(false);
        audioOnlyMutedCameraRef.current = true;
      } else {
        audioOnlyMutedCameraRef.current = false;
      }

      setIsAudioOnly(true);
    } catch (error) {
      console.error('[CreatorLiveView] Failed to toggle audio-only mode:', error);
      toast.error('Unable to switch audio-only mode right now');
    }
  }, [isAudioOnly, isCameraEnabled, localParticipant]);

  const handleSwitchCamera = useCallback(async () => {
    if (availableCameras.length < 2) {
      toast.error('No alternate camera found');
      return;
    }

    try {
      const activeCameraId = localParticipant
        .getTrackPublication(Track.Source.Camera)
        ?.track?.mediaStreamTrack.getSettings().deviceId;

      const currentIndex = availableCameras.findIndex(
        (camera) => camera.deviceId === activeCameraId
      );

      const nextCamera =
        availableCameras[(currentIndex + 1 + availableCameras.length) % availableCameras.length];

      await room.switchActiveDevice('videoinput', nextCamera.deviceId);
      toast.success(`Switched to ${nextCamera.label || 'next camera'}`);
      await loadAvailableCameras();
    } catch (error) {
      console.error('[CreatorLiveView] Failed to switch camera:', error);
      toast.error('Unable to switch camera');
    }
  }, [availableCameras, loadAvailableCameras, localParticipant, room]);

  const handlePinMessage = () => {
    const nextPinnedMessage = pinnedMessageDraft.trim();
    setPinnedMessage(nextPinnedMessage);
    setPinnedMessageDraft(nextPinnedMessage);
    setActivePanel(null);
  };

  const handleRemovePinnedMessage = () => {
    setPinnedMessage('');
    setPinnedMessageDraft('');
    setActivePanel(null);
  };

  const handleUpdateModerationSetting = async (
    key: 'isChatEnabled' | 'isChatDelayed' | 'isChatFollowersOnly',
    value: boolean
  ) => {
    await onUpdateChatSettings({ [key]: value });
  };

  const filterClassName = previewFilterClasses[selectedFilter] ?? previewFilterClasses.NONE;

  return (
    <div className="space-y-4">
      <CreatorStreamControls
        onToggleCamera={handleToggleCamera}
        onToggleMic={handleToggleMic}
        onEndStream={onEndStream}
        onToggleChatPanel={() => setIsChatPanelVisible((current) => !current)}
        onOpenViewerList={() => setActivePanel('viewers')}
        onOpenGiftTransactions={() => setActivePanel('gifts')}
        onOpenPinMessage={() => {
          setPinnedMessageDraft(pinnedMessage);
          setActivePanel('pin');
        }}
        onOpenModerationTools={() => setActivePanel('moderation')}
        onOpenFilters={() => setActivePanel('filters')}
        onToggleAudioOnly={handleToggleAudioOnly}
        onSwitchCamera={handleSwitchCamera}
        isCameraOn={isCameraEnabled}
        isMicOn={isMicrophoneEnabled}
        isChatPanelVisible={isChatPanelVisible}
        isAudioOnly={isAudioOnly}
        canSwitchCamera={availableCameras.length > 1}
        hasPinnedMessage={!!pinnedMessage}
        viewerCount={viewerCount}
        isEnding={isEnding}
      />

      <div className={cn('grid gap-6', isChatPanelVisible ? 'lg:grid-cols-3' : 'lg:grid-cols-1')}>
        <div className={cn('space-y-4', isChatPanelVisible ? 'lg:col-span-2' : 'lg:col-span-1')}>
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <div className="relative aspect-video bg-black">
              <div className={cn('h-full w-full', filterClassName)}>
                {videoTrack && isCameraEnabled && !isAudioOnly ? (
                  <VideoTrack
                    trackRef={{
                      participant: localParticipant,
                      publication: localParticipant.getTrackPublication(Track.Source.Camera)!,
                      source: Track.Source.Camera,
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(120,119,198,0.18),_transparent_55%),linear-gradient(180deg,_rgba(24,24,27,0.92),_rgba(9,9,11,1))]">
                    <div className="text-center space-y-4 px-6">
                      <div className="w-20 h-20 rounded-full bg-zinc-800/70 flex items-center justify-center mx-auto border border-zinc-700">
                        {isAudioOnly ? (
                          <Waves className="w-10 h-10 text-sky-300" />
                        ) : (
                          <VideoOff className="w-10 h-10 text-zinc-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {isAudioOnly ? 'Audio-only mode is live' : 'Camera is off'}
                        </p>
                        <p className="text-zinc-400 text-sm">
                          {isAudioOnly
                            ? 'Your audience can hear you while your live preview stays off-camera.'
                            : 'Click the camera button to return to video.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-semibold text-sm shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>

              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="border-zinc-600 bg-black/50 text-white">
                  <Signal className="mr-1 h-3.5 w-3.5 text-emerald-300" />
                  {viewerCount.toLocaleString()} watching
                </Badge>
                <Badge variant="outline" className="border-zinc-600 bg-black/50 text-white">
                  <Heart className="mr-1 h-3.5 w-3.5 text-fuchsia-300" />
                  {(summary?.totalLikes ?? 0).toLocaleString()} likes
                </Badge>
                <Badge variant="outline" className="border-zinc-600 bg-black/50 text-white">
                  <Coins className="mr-1 h-3.5 w-3.5 text-yellow-300" />
                  {earnings.toLocaleString()} earned
                </Badge>
                {streamInfo.musicPreset !== 'NONE' && (
                  <Badge variant="outline" className="border-zinc-600 bg-black/50 text-white">
                    <Music4 className="mr-1 h-3.5 w-3.5 text-sky-300" />
                    {streamInfo.musicPreset.toLowerCase()} mode
                  </Badge>
                )}
              </div>

              {pinnedMessage && (
                <div className="absolute left-4 top-16 z-10 max-w-[70%] rounded-2xl border border-sky-400/30 bg-black/70 px-4 py-3 backdrop-blur">
                  <div className="flex items-start gap-3">
                    <Pin className="mt-0.5 h-4 w-4 text-sky-300" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sky-200/80">
                        Pinned message
                      </p>
                      <p className="mt-1 text-sm text-white">{pinnedMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <CreatorOverlayStack overlays={overlays} onDismiss={onDismissOverlay} />
            </div>
          </Card>

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

        {isChatPanelVisible && (
          <div className="lg:col-span-1 h-[600px]">
            {streamInfo.isChatEnabled ? (
              <ChatComponent
                hostName="You"
                isChatEnabled={streamInfo.isChatEnabled}
                isChatDelayed={streamInfo.isChatDelayed}
                isChatFollowersOnly={streamInfo.isChatFollowersOnly}
                isFollowing={true}
              />
            ) : (
              <Card className="bg-zinc-900 border-zinc-800 h-[600px] flex items-center justify-center">
                <div className="text-center space-y-3 px-6">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-8 h-8 text-zinc-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-white mb-2">Chat Disabled</h4>
                    <p className="text-sm text-zinc-500">
                      Re-open chat from the moderation tools when you are ready.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <Sheet open={activePanel !== null} onOpenChange={(isOpen) => !isOpen && setActivePanel(null)}>
        <SheetContent className="border-zinc-800 bg-zinc-950 text-white sm:max-w-lg">
          {activePanel === 'viewers' && (
            <>
              <SheetHeader>
                <SheetTitle>Viewer List</SheetTitle>
                <SheetDescription>
                  Active participants currently connected to your live room.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-3 px-4 pb-6">
                {participants.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800 p-6 text-center text-zinc-400">
                    No viewers are connected yet.
                  </Card>
                ) : (
                  participants.map((participant) => (
                    <Card key={participant.identity} className="bg-zinc-900 border-zinc-800 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
                            {(participant.name || participant.identity || 'V').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {participant.name || participant.identity}
                            </p>
                            <p className="text-xs text-zinc-500">{participant.identity}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
                          Watching
                        </Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}

          {activePanel === 'gifts' && (
            <>
              <SheetHeader>
                <SheetTitle>Gift Transactions</SheetTitle>
                <SheetDescription>
                  Recent gifting activity and live earnings for this stream.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-zinc-900 border-zinc-800 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Actual Earnings</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {earnings.toLocaleString()} coins
                    </p>
                  </Card>
                  <Card className="bg-zinc-900 border-zinc-800 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Gift Events</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {giftTransactions.length.toLocaleString()}
                    </p>
                  </Card>
                </div>

                {giftTransactions.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800 p-6 text-center text-zinc-400">
                    No gifts have been sent on this stream yet.
                  </Card>
                ) : (
                  giftTransactions.map((gift) => (
                    <Card key={gift.id} className="bg-zinc-900 border-zinc-800 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <img
                            src={gift.gift.imageUrl}
                            alt={gift.gift.name}
                            className="h-12 w-12 rounded-xl object-cover bg-zinc-800"
                          />
                          <div>
                            <p className="font-medium text-white">
                              {gift.sender.name || gift.sender.username}
                            </p>
                            <p className="text-sm text-zinc-400">
                              sent {gift.gift.name} for {gift.coinAmount.toLocaleString()} coins
                            </p>
                            {gift.message && (
                              <p className="mt-1 text-xs text-zinc-500">{gift.message}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-zinc-500">
                          {new Date(gift.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}

          {activePanel === 'pin' && (
            <>
              <SheetHeader>
                <SheetTitle>Pin Message</SheetTitle>
                <SheetDescription>
                  Highlight a callout, schedule note, or house rule on the live preview.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <div className="space-y-2">
                  <Label htmlFor="pinned-message">Message</Label>
                  <Input
                    id="pinned-message"
                    value={pinnedMessageDraft}
                    onChange={(event) => setPinnedMessageDraft(event.target.value)}
                    placeholder="Welcome in. Highlights drop at the 30-minute mark."
                    className="bg-zinc-900 border-zinc-800 text-white"
                    maxLength={180}
                  />
                  <p className="text-xs text-zinc-500">{pinnedMessageDraft.length}/180</p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handlePinMessage} className="bg-purple-600 hover:bg-purple-700">
                    Save Pin
                  </Button>
                  <Button
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800"
                    onClick={handleRemovePinnedMessage}
                    disabled={!pinnedMessage}
                  >
                    Remove Pin
                  </Button>
                </div>
              </div>
            </>
          )}

          {activePanel === 'moderation' && (
            <>
              <SheetHeader>
                <SheetTitle>Moderation Tools</SheetTitle>
                <SheetDescription>
                  Tune live chat and community settings without leaving the stream.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">Enable chat</p>
                        <p className="text-sm text-zinc-500">Turn conversation on or off.</p>
                      </div>
                      <Switch
                        checked={streamInfo.isChatEnabled}
                        onCheckedChange={(checked) =>
                          handleUpdateModerationSetting('isChatEnabled', checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">Followers only</p>
                        <p className="text-sm text-zinc-500">
                          Restrict chat to viewers who follow you.
                        </p>
                      </div>
                      <Switch
                        checked={streamInfo.isChatFollowersOnly}
                        disabled={!streamInfo.isChatEnabled}
                        onCheckedChange={(checked) =>
                          handleUpdateModerationSetting('isChatFollowersOnly', checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">Slow mode</p>
                        <p className="text-sm text-zinc-500">
                          Add a 3-second delay between messages.
                        </p>
                      </div>
                      <Switch
                        checked={streamInfo.isChatDelayed}
                        disabled={!streamInfo.isChatEnabled}
                        onCheckedChange={(checked) =>
                          handleUpdateModerationSetting('isChatDelayed', checked)
                        }
                      />
                    </div>
                  </div>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 p-4">
                  <p className="font-medium text-white">Pinned safety reminders</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Use the pinned message panel for house rules, giveaway timing, or sponsor disclaimers.
                  </p>
                </Card>
              </div>
            </>
          )}

          {activePanel === 'filters' && (
            <>
              <SheetHeader>
                <SheetTitle>Visual Filters</SheetTitle>
                <SheetDescription>
                  Adjust the mood of your live preview without leaving the stream.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-3 px-4 pb-6">
                {previewFilterOptions.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setSelectedFilter(filter.id)}
                    className={cn(
                      'w-full rounded-2xl border p-4 text-left transition-colors',
                      selectedFilter === filter.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{filter.label}</p>
                        <p className="mt-1 text-sm text-zinc-500">{filter.description}</p>
                      </div>
                      {selectedFilter === filter.id && (
                        <Badge className="bg-purple-600 text-white hover:bg-purple-600">
                          Active
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
