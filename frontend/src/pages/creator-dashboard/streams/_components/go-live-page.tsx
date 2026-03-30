import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import { useStream } from '@/hooks/useStream';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Video,
  Loader2,
  AlertCircle,
  Radio,
  Settings,
  Image as ImageIcon,
  Coins,
  Camera,
} from 'lucide-react';
import { CreatorLiveView } from './creator-live-view';
import { StreamEndedView } from './stream-ended-view';
import type {
  GoLiveResponse,
  SetupStreamRequest,
  StreamAudience,
  StreamCameraFacingMode,
  StreamFilterPreset,
  StreamInfo,
  StreamMusicPreset,
} from '@/lib/api/stream';

type StreamState = 'idle' | 'connecting' | 'live' | 'ended';

interface GoLivePageState {
  streamState: StreamState;
  permissionError: string | null;
}

interface SetupFormState {
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  tagsInput: string;
  audience: StreamAudience;
  allowGifts: boolean;
  allowAds: boolean;
  allowPayPerView: boolean;
  cameraFacingMode: StreamCameraFacingMode;
  audioOnlyMode: boolean;
  filterPreset: StreamFilterPreset;
  musicPreset: StreamMusicPreset;
  isChatEnabled: boolean;
  isChatDelayed: boolean;
  isChatFollowersOnly: boolean;
}

const CATEGORY_OPTIONS = [
  'Lifestyle',
  'Gaming',
  'Music',
  'Fitness',
  'Education',
  'Travel',
  'Fashion',
  'Food',
  'Comedy',
];

const AUDIENCE_OPTIONS: Array<{
  value: StreamAudience;
  label: string;
  description: string;
}> = [
  { value: 'PUBLIC', label: 'Public', description: 'Anyone can discover and join the stream.' },
  { value: 'FOLLOWERS', label: 'Followers', description: 'Only followers are invited into the room.' },
  { value: 'INVITE_ONLY', label: 'Invite-only', description: 'Use a private audience setting for closed sessions.' },
];

const FILTER_OPTIONS: Array<{
  value: StreamFilterPreset;
  label: string;
  description: string;
}> = [
  { value: 'NONE', label: 'Natural', description: 'No visual filter.' },
  { value: 'WARM', label: 'Warm Glow', description: 'Softer highlights and warmer tones.' },
  { value: 'COOL', label: 'Cool Studio', description: 'Sharper, blue-toned presentation.' },
  { value: 'NOIR', label: 'Noir', description: 'Black-and-white contrast mode.' },
  { value: 'POP', label: 'Pop', description: 'Bold saturation for high-energy streams.' },
];

const MUSIC_OPTIONS: Array<{
  value: StreamMusicPreset;
  label: string;
  description: string;
}> = [
  { value: 'NONE', label: 'No Music', description: 'Keep the room clean and voice-led.' },
  { value: 'AMBIENT', label: 'Ambient', description: 'Soft background atmosphere.' },
  { value: 'HYPE', label: 'Hype', description: 'Higher-energy intro vibe.' },
  { value: 'LOFI', label: 'Lo-fi', description: 'Relaxed community session tone.' },
  { value: 'ACOUSTIC', label: 'Acoustic', description: 'Warmer unplugged-style mood.' },
];

const defaultSetupForm: SetupFormState = {
  title: '',
  description: '',
  thumbnail: '',
  category: CATEGORY_OPTIONS[0],
  tagsInput: '',
  audience: 'PUBLIC',
  allowGifts: true,
  allowAds: false,
  allowPayPerView: false,
  cameraFacingMode: 'FRONT',
  audioOnlyMode: false,
  filterPreset: 'NONE',
  musicPreset: 'NONE',
  isChatEnabled: true,
  isChatDelayed: false,
  isChatFollowersOnly: false,
};

function parseTags(tagsInput: string): string[] {
  return Array.from(
    new Set(
      tagsInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 10)
    )
  );
}

function streamToSetupForm(stream: StreamInfo): SetupFormState {
  return {
    title: stream.title || '',
    description: stream.description || '',
    thumbnail: stream.thumbnail || '',
    category: stream.category || CATEGORY_OPTIONS[0],
    tagsInput: (stream.tags || []).join(', '),
    audience: stream.audience || 'PUBLIC',
    allowGifts: stream.allowGifts ?? true,
    allowAds: stream.allowAds ?? false,
    allowPayPerView: stream.allowPayPerView ?? false,
    cameraFacingMode: stream.cameraFacingMode || 'FRONT',
    audioOnlyMode: stream.audioOnlyMode ?? false,
    filterPreset: stream.filterPreset || 'NONE',
    musicPreset: stream.musicPreset || 'NONE',
    isChatEnabled: stream.isChatEnabled,
    isChatDelayed: stream.isChatDelayed,
    isChatFollowersOnly: stream.isChatFollowersOnly,
  };
}

function buildSetupPayload(form: SetupFormState): SetupStreamRequest {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    thumbnail: form.thumbnail.trim() || undefined,
    category: form.category.trim() || undefined,
    tags: parseTags(form.tagsInput),
    audience: form.audience,
    allowGifts: form.allowGifts,
    allowAds: form.allowAds,
    allowPayPerView: form.allowPayPerView,
    cameraFacingMode: form.cameraFacingMode,
    audioOnlyMode: form.audioOnlyMode,
    filterPreset: form.filterPreset,
    musicPreset: form.musicPreset,
    isChatEnabled: form.isChatEnabled,
    isChatDelayed: form.isChatDelayed,
    isChatFollowersOnly: form.isChatFollowersOnly,
  };
}

function formatAudience(audience: StreamAudience): string {
  return AUDIENCE_OPTIONS.find((option) => option.value === audience)?.label || audience;
}

function formatCameraMode(cameraFacingMode: StreamCameraFacingMode): string {
  return cameraFacingMode === 'BACK' ? 'Back Camera' : 'Front Camera';
}

function formatFilter(filterPreset: StreamFilterPreset): string {
  return FILTER_OPTIONS.find((option) => option.value === filterPreset)?.label || filterPreset;
}

function formatMusic(musicPreset: StreamMusicPreset): string {
  return MUSIC_OPTIONS.find((option) => option.value === musicPreset)?.label || musicPreset;
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-800/50 p-4 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function StreamSetupFields({
  setupForm,
  setSetupForm,
  availableCameraCount,
}: {
  setupForm: SetupFormState;
  setSetupForm: Dispatch<SetStateAction<SetupFormState>>;
  availableCameraCount: number;
}) {
  const parsedTags = parseTags(setupForm.tagsInput);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-zinc-300">Stream Title *</Label>
        <Input
          id="title"
          value={setupForm.title}
          onChange={(e) => setSetupForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Enter your stream title..."
          className="bg-zinc-800 border-zinc-700 text-white"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-zinc-300">Description</Label>
        <Textarea
          id="description"
          value={setupForm.description}
          onChange={(e) => setSetupForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Tell viewers what your stream is about..."
          className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_280px]">
        <div className="space-y-2">
          <Label htmlFor="thumbnail" className="text-zinc-300">Thumbnail URL</Label>
          <Input
            id="thumbnail"
            type="url"
            value={setupForm.thumbnail}
            onChange={(e) => setSetupForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
            placeholder="https://..."
            className="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-500">Thumbnail Preview</p>
          {setupForm.thumbnail ? (
            <img
              src={setupForm.thumbnail}
              alt="Stream thumbnail preview"
              className="aspect-video w-full rounded-xl object-cover bg-zinc-900"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 text-zinc-500">
              <div className="text-center">
                <ImageIcon className="mx-auto h-8 w-8" />
                <p className="mt-2 text-xs">Thumbnail preview will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-zinc-300">Category</Label>
          <select
            id="category"
            value={setupForm.category}
            onChange={(e) => setSetupForm((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
          >
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="audience" className="text-zinc-300">Audience</Label>
          <select
            id="audience"
            value={setupForm.audience}
            onChange={(e) =>
              setSetupForm((prev) => ({
                ...prev,
                audience: e.target.value as StreamAudience,
              }))
            }
            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
          >
            {AUDIENCE_OPTIONS.map((audience) => (
              <option key={audience.value} value={audience.value}>
                {audience.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">
            {AUDIENCE_OPTIONS.find((option) => option.value === setupForm.audience)?.description}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags" className="text-zinc-300">Tags</Label>
        <Input
          id="tags"
          value={setupForm.tagsInput}
          onChange={(e) => setSetupForm((prev) => ({ ...prev, tagsInput: e.target.value }))}
          placeholder="music, q&a, behind the scenes"
          className="bg-zinc-800 border-zinc-700 text-white"
        />
        {parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {parsedTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-800 p-4">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-400" />
          <h3 className="text-lg font-medium text-white">Monetization</h3>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-white">Gifts</p>
            <p className="text-sm text-zinc-500">Let viewers send gifts while you stream.</p>
          </div>
          <Switch
            checked={setupForm.allowGifts}
            onCheckedChange={(checked) => setSetupForm((prev) => ({ ...prev, allowGifts: checked }))}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-white">Ads</p>
            <p className="text-sm text-zinc-500">Mark this stream as ad-enabled.</p>
          </div>
          <Switch
            checked={setupForm.allowAds}
            onCheckedChange={(checked) => setSetupForm((prev) => ({ ...prev, allowAds: checked }))}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-white">Pay-per-view</p>
            <p className="text-sm text-zinc-500">Flag the stream for gated monetization.</p>
          </div>
          <Switch
            checked={setupForm.allowPayPerView}
            onCheckedChange={(checked) =>
              setSetupForm((prev) => ({ ...prev, allowPayPerView: checked }))
            }
          />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-zinc-800 p-4">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-sky-400" />
          <h3 className="text-lg font-medium text-white">Go Live Mode</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="camera-facing" className="text-zinc-300">Camera</Label>
            <select
              id="camera-facing"
              value={setupForm.cameraFacingMode}
              onChange={(e) =>
                setSetupForm((prev) => ({
                  ...prev,
                  cameraFacingMode: e.target.value as StreamCameraFacingMode,
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
            >
              <option value="FRONT">Front Camera</option>
              <option value="BACK">Back Camera</option>
            </select>
            <p className="text-xs text-zinc-500">
              {availableCameraCount > 1
                ? `${availableCameraCount} cameras detected on this device.`
                : 'One camera detected right now. The preference will still be saved.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-preset" className="text-zinc-300">Filter</Label>
            <select
              id="filter-preset"
              value={setupForm.filterPreset}
              onChange={(e) =>
                setSetupForm((prev) => ({
                  ...prev,
                  filterPreset: e.target.value as StreamFilterPreset,
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
            >
              {FILTER_OPTIONS.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">
              {FILTER_OPTIONS.find((option) => option.value === setupForm.filterPreset)?.description}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="music-preset" className="text-zinc-300">Music Option</Label>
            <select
              id="music-preset"
              value={setupForm.musicPreset}
              onChange={(e) =>
                setSetupForm((prev) => ({
                  ...prev,
                  musicPreset: e.target.value as StreamMusicPreset,
                }))
              }
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
            >
              {MUSIC_OPTIONS.map((music) => (
                <option key={music.value} value={music.value}>
                  {music.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">
              {MUSIC_OPTIONS.find((option) => option.value === setupForm.musicPreset)?.description}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div>
              <p className="font-medium text-white">Audio Only</p>
              <p className="text-sm text-zinc-500">
                Start without publishing camera video.
              </p>
            </div>
            <Switch
              checked={setupForm.audioOnlyMode}
              onCheckedChange={(checked) =>
                setSetupForm((prev) => ({ ...prev, audioOnlyMode: checked }))
              }
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <h3 className="text-lg font-medium text-white">Chat Settings</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Enable Chat</p>
            <p className="text-zinc-400 text-sm">Allow viewers to send messages</p>
          </div>
          <Switch
            checked={setupForm.isChatEnabled}
            onCheckedChange={(checked) =>
              setSetupForm((prev) => ({ ...prev, isChatEnabled: checked }))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Followers-Only Mode</p>
            <p className="text-zinc-400 text-sm">Only followers can chat</p>
          </div>
          <Switch
            checked={setupForm.isChatFollowersOnly}
            onCheckedChange={(checked) =>
              setSetupForm((prev) => ({ ...prev, isChatFollowersOnly: checked }))
            }
            disabled={!setupForm.isChatEnabled}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Slow Mode</p>
            <p className="text-zinc-400 text-sm">3-second delay between messages</p>
          </div>
          <Switch
            checked={setupForm.isChatDelayed}
            onCheckedChange={(checked) =>
              setSetupForm((prev) => ({ ...prev, isChatDelayed: checked }))
            }
            disabled={!setupForm.isChatEnabled}
          />
        </div>
      </div>
    </>
  );
}

export function GoLivePage() {
  const {
    streamInfo,
    liveData,
    loading,
    setupStream,
    goLive,
    endStream,
    updateStreamInfo,
    updateChatSettings,
    fetchStreamInfo,
    fetchStreamStatus,
  } = useStream();

  const [state, setState] = useState<GoLivePageState>({
    streamState: 'idle',
    permissionError: null,
  });
  const [lastEndedStream, setLastEndedStream] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [availableCameraCount, setAvailableCameraCount] = useState(0);

  const stableLiveDataRef = useRef<GoLiveResponse | null>(null);
  const stableStreamInfoRef = useRef<StreamInfo | null>(null);

  const [setupForm, setSetupForm] = useState<SetupFormState>(defaultSetupForm);

  useEffect(() => {
    console.log('🔍 [GoLivePage] State changed:', {
      streamState: state.streamState,
      hasLiveData: !!liveData,
      hasStreamInfo: !!streamInfo,
      hasStableLiveData: !!stableLiveDataRef.current,
      hasStableStreamInfo: !!stableStreamInfoRef.current,
    });
  }, [state.streamState, liveData, streamInfo]);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAvailableCameraCount(devices.filter((device) => device.kind === 'videoinput').length);
      } catch (error) {
        console.error('[GoLivePage] Failed to enumerate devices:', error);
      }
    };

    loadDevices();
    navigator.mediaDevices?.addEventListener?.('devicechange', loadDevices);

    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', loadDevices);
    };
  }, []);

  useEffect(() => {
    if (streamInfo) {
      setState((prev) => ({
        ...prev,
        streamState: streamInfo.isLive ? 'live' : prev.streamState === 'ended' ? 'ended' : 'idle',
      }));

      if (!streamInfo.isLive) {
        setSetupForm(streamToSetupForm(streamInfo));
      }

      if (!stableStreamInfoRef.current) {
        stableStreamInfoRef.current = streamInfo;
      }
    }
  }, [streamInfo]);

  useEffect(() => {
    if (state.streamState === 'live') {
      const interval = setInterval(() => {
        fetchStreamStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [state.streamState, fetchStreamStatus]);

  const requestMediaPermissions = useCallback(async (config: SetupFormState): Promise<boolean> => {
    const videoConstraints = config.audioOnlyMode
      ? false
      : {
          facingMode: {
            ideal: config.cameraFacingMode === 'BACK' ? 'environment' : 'user',
          },
        };

    try {
      setState((prev) => ({ ...prev, permissionError: null }));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      if (!config.audioOnlyMode) {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          fallbackStream.getTracks().forEach((track) => track.stop());
          return true;
        } catch (fallbackError) {
          error = fallbackError;
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let userMessage = 'Failed to access camera and microphone.';

      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
        userMessage = 'Camera and microphone permissions were denied. Please allow access in your browser settings and try again.';
      } else if (errorMessage.includes('NotFoundError')) {
        userMessage = config.audioOnlyMode
          ? 'No microphone found. Please connect a microphone and try again.'
          : 'No camera or microphone found. Please connect a device and try again.';
      }

      setState((prev) => ({ ...prev, permissionError: userMessage }));
      toast.error(userMessage);
      return false;
    }
  }, []);

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!setupForm.title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    const result = await setupStream(buildSetupPayload(setupForm));

    if (result) {
      fetchStreamInfo();
    }
  };

  const handleGoLive = async () => {
    setState((prev) => ({ ...prev, streamState: 'connecting', permissionError: null }));

    const effectiveConfig = streamInfo ? streamToSetupForm(streamInfo) : setupForm;
    const hasPermissions = await requestMediaPermissions(effectiveConfig);

    if (!hasPermissions) {
      setState((prev) => ({ ...prev, streamState: 'idle' }));
      return;
    }

    const result = await goLive();
    if (result) {
      stableLiveDataRef.current = result;
      if (streamInfo) {
        stableStreamInfoRef.current = streamInfo;
      }
      setState((prev) => ({ ...prev, streamState: 'live' }));
      console.log('✅ [GoLivePage] Went live successfully');
    } else {
      setState((prev) => ({ ...prev, streamState: 'idle' }));
    }
  };

  const handleEndStream = async () => {
    console.log('🛑 [GoLivePage] Ending stream...');
    const endingStream = stableStreamInfoRef.current ?? streamInfo;
    const success = await endStream();
    if (success) {
      if (endingStream?.id) {
        setLastEndedStream({
          id: endingStream.id,
          title: endingStream.title,
        });
      }
      stableLiveDataRef.current = null;
      stableStreamInfoRef.current = null;
      setState((prev) => ({ ...prev, streamState: 'ended' }));
      console.log('✅ [GoLivePage] Stream ended successfully');
    }
  };

  const handleStartNewStream = () => {
    setState((prev) => ({ ...prev, streamState: 'idle' }));
    setLastEndedStream(null);
    fetchStreamInfo();
  };

  if (loading && !streamInfo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Go Live</h1>
            <p className="text-zinc-400">Loading your stream...</p>
          </div>
        </div>
        <Card className="bg-zinc-900 border-zinc-800 p-8">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="text-white">Loading stream information...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (state.streamState === 'ended') {
    return lastEndedStream ? (
      <StreamEndedView
        streamId={lastEndedStream.id}
        streamTitle={lastEndedStream.title}
        onStartNewStream={handleStartNewStream}
      />
    ) : (
      <StreamEndedView
        streamId={streamInfo?.id || ''}
        streamTitle={streamInfo?.title}
        onStartNewStream={handleStartNewStream}
      />
    );
  }

  if (state.streamState === 'live' && stableLiveDataRef.current && stableStreamInfoRef.current) {
    return (
      <CreatorLiveView
        liveData={stableLiveDataRef.current}
        streamInfo={stableStreamInfoRef.current}
        onEndStream={handleEndStream}
        onUpdateTitle={async (title) => {
          const updatedStream = await updateStreamInfo({ title });
          if (updatedStream && stableStreamInfoRef.current) {
            stableStreamInfoRef.current = updatedStream;
          }
        }}
        onUpdateChatSettings={async (settings) => {
          const updatedStream = await updateChatSettings(settings);
          if (updatedStream && stableStreamInfoRef.current) {
            stableStreamInfoRef.current = updatedStream;
          }
        }}
      />
    );
  }

  if (!streamInfo?.id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Go Live</h1>
            <p className="text-zinc-400">Set up your stream before going live</p>
          </div>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Stream Setup</h2>
              <p className="text-zinc-400 text-sm">Configure your stream details, audience, monetization, and mode.</p>
            </div>
          </div>

          <form onSubmit={handleSetupSubmit} className="space-y-6">
            <StreamSetupFields
              setupForm={setupForm}
              setSetupForm={setSetupForm}
              availableCameraCount={availableCameraCount}
            />

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Save Stream Settings'
              )}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const monetizationModes = [
    streamInfo.allowGifts ? 'Gifts' : null,
    streamInfo.allowAds ? 'Ads' : null,
    streamInfo.allowPayPerView ? 'Pay-per-view' : null,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Go Live</h1>
          <p className="text-zinc-400">Start streaming from your browser</p>
        </div>
      </div>

      {state.permissionError && (
        <Card className="bg-red-900/20 border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-400 font-medium">Permission Required</p>
              <p className="text-red-300/80 text-sm mt-1">{state.permissionError}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            {streamInfo.thumbnail ? (
              <img
                src={streamInfo.thumbnail}
                alt={streamInfo.title}
                className="aspect-video w-full rounded-2xl object-cover border border-zinc-800 bg-zinc-950"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-500">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-xs">No thumbnail selected</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {streamInfo.tags.length > 0 ? (
                  streamInfo.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-500">No tags added yet.</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{streamInfo.title}</h2>
                {streamInfo.description && (
                  <p className="text-zinc-400 text-sm">{streamInfo.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <SummaryCard label="Category" value={streamInfo.category || 'Not set'} />
              <SummaryCard label="Audience" value={formatAudience(streamInfo.audience)} />
              <SummaryCard
                label="Monetization"
                value={monetizationModes.length > 0 ? monetizationModes.join(', ') : 'Off'}
              />
              <SummaryCard
                label="Mode"
                value={`${streamInfo.audioOnlyMode ? 'Audio only' : formatCameraMode(streamInfo.cameraFacingMode)} / ${formatFilter(streamInfo.filterPreset)}`}
              />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6 p-4 bg-zinc-800/50 rounded-lg">
              <div className="text-center">
                <p className="text-zinc-400 text-sm">Chat</p>
                <p className="text-white font-medium">
                  {streamInfo.isChatEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-zinc-400 text-sm">Camera</p>
                <p className="text-white font-medium">
                  {streamInfo.audioOnlyMode ? 'Audio Only' : formatCameraMode(streamInfo.cameraFacingMode)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-zinc-400 text-sm">Filter</p>
                <p className="text-white font-medium">{formatFilter(streamInfo.filterPreset)}</p>
              </div>
              <div className="text-center">
                <p className="text-zinc-400 text-sm">Music</p>
                <p className="text-white font-medium">{formatMusic(streamInfo.musicPreset)}</p>
              </div>
            </div>

            <Button
              onClick={handleGoLive}
              className="w-full bg-red-600 hover:bg-red-700 h-14 text-lg font-semibold"
              disabled={state.streamState === 'connecting' || loading}
            >
              {state.streamState === 'connecting' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5" />
                  Go Live
                </>
              )}
            </Button>

            <p className="text-zinc-500 text-sm text-center mt-4">
              Your browser will request the devices needed for your selected live mode.
            </p>
          </div>
        </div>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Edit Stream Settings</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Update details before you go live. Save changes to refresh the launch card above.
          </p>
        </div>

        <form onSubmit={handleSetupSubmit} className="space-y-6">
          <StreamSetupFields
            setupForm={setupForm}
            setSetupForm={setSetupForm}
            availableCameraCount={availableCameraCount}
          />

          <Button
            type="submit"
            variant="outline"
            className="border-zinc-700 hover:bg-zinc-800"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Settings'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
