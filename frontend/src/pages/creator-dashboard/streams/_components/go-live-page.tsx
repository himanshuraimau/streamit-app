import { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import { CreatorLiveView } from './creator-live-view';
import { StreamEndedView } from './stream-ended-view';
import type { GoLiveResponse, StreamInfo } from '@/lib/api/stream';

type StreamState = 'idle' | 'connecting' | 'live' | 'ended';

interface GoLivePageState {
  streamState: StreamState;
  permissionError: string | null;
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

  // ✅ CRITICAL: Stable references to prevent CreatorLiveView remounting
  const stableLiveDataRef = useRef<GoLiveResponse | null>(null);
  const stableStreamInfoRef = useRef<StreamInfo | null>(null);

  // Setup form state
  const [setupForm, setSetupForm] = useState({
    title: '',
    description: '',
    isChatEnabled: true,
    isChatDelayed: false,
    isChatFollowersOnly: false,
  });

  // Debug: Log when props change
  useEffect(() => {
    console.log('🔍 [GoLivePage] State changed:', {
      streamState: state.streamState,
      hasLiveData: !!liveData,
      hasStreamInfo: !!streamInfo,
      hasStableLiveData: !!stableLiveDataRef.current,
      hasStableStreamInfo: !!stableStreamInfoRef.current,
    });
  }, [state.streamState, liveData, streamInfo]);

  // Update state when streamInfo changes
  useEffect(() => {
    if (streamInfo) {
      // Update stream state based on isLive status
      setState(prev => ({
        ...prev,
        streamState: streamInfo.isLive ? 'live' : prev.streamState === 'ended' ? 'ended' : 'idle',
      }));
      // Only update form if not currently live (to avoid disrupting live stream)
      if (!streamInfo.isLive) {
        setSetupForm({
          title: streamInfo.title || '',
          description: streamInfo.description || '',
          isChatEnabled: streamInfo.isChatEnabled,
          isChatDelayed: streamInfo.isChatDelayed,
          isChatFollowersOnly: streamInfo.isChatFollowersOnly,
        });
      }
      
      // Store stable reference for live view
      if (!stableStreamInfoRef.current) {
        stableStreamInfoRef.current = streamInfo;
      }
    }
  }, [streamInfo]);

  // Poll for stream status when live
  useEffect(() => {
    if (state.streamState === 'live') {
      const interval = setInterval(() => {
        fetchStreamStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [state.streamState, fetchStreamStatus]);

  // Request camera/mic permissions
  // Requirements: 1.1, 1.5
  const requestMediaPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, permissionError: null }));
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      // Stop the tracks immediately - we just needed to check permissions
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let userMessage = 'Failed to access camera and microphone.';
      
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
        userMessage = 'Camera and microphone permissions were denied. Please allow access in your browser settings and try again.';
      } else if (errorMessage.includes('NotFoundError')) {
        userMessage = 'No camera or microphone found. Please connect a device and try again.';
      }
      
      setState(prev => ({ ...prev, permissionError: userMessage }));
      toast.error(userMessage);
      return false;
    }
  }, []);

  // Handle setup form submission
  // Requirements: 5.1, 5.2
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!setupForm.title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    const result = await setupStream({
      title: setupForm.title.trim(),
      description: setupForm.description.trim() || undefined,
      isChatEnabled: setupForm.isChatEnabled,
      isChatDelayed: setupForm.isChatDelayed,
      isChatFollowersOnly: setupForm.isChatFollowersOnly,
    });

    if (result) {
      fetchStreamInfo();
    }
  };

  // Handle go live
  // Requirements: 1.1, 1.2, 1.3
  const handleGoLive = async () => {
    setState(prev => ({ ...prev, streamState: 'connecting', permissionError: null }));

    // First request permissions
    const hasPermissions = await requestMediaPermissions();
    if (!hasPermissions) {
      setState(prev => ({ ...prev, streamState: 'idle' }));
      return;
    }

    // Then go live
    const result = await goLive();
    if (result) {
      // ✅ Store stable reference to prevent remounting
      stableLiveDataRef.current = result;
      if (streamInfo) {
        stableStreamInfoRef.current = streamInfo;
      }
      setState(prev => ({ ...prev, streamState: 'live' }));
      console.log('✅ [GoLivePage] Went live successfully');
    } else {
      setState(prev => ({ ...prev, streamState: 'idle' }));
    }
  };

  // Handle end stream
  // Requirements: 2.3
  const handleEndStream = async () => {
    console.log('🛑 [GoLivePage] Ending stream...');
    const success = await endStream();
    if (success) {
      // ✅ Clear stable references
      stableLiveDataRef.current = null;
      stableStreamInfoRef.current = null;
      setState(prev => ({ ...prev, streamState: 'ended' }));
      console.log('✅ [GoLivePage] Stream ended successfully');
    }
  };

  // Handle start new stream
  const handleStartNewStream = () => {
    setState(prev => ({ ...prev, streamState: 'idle' }));
    fetchStreamInfo();
  };

  // Loading state
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

  // If stream ended, show the ended view
  if (state.streamState === 'ended') {
    return <StreamEndedView onStartNewStream={handleStartNewStream} />;
  }

  // If live, show the live view
  // ✅ Use stable references to prevent remounting
  if (state.streamState === 'live' && stableLiveDataRef.current && stableStreamInfoRef.current) {
    return (
      <CreatorLiveView
        liveData={stableLiveDataRef.current}
        streamInfo={stableStreamInfoRef.current}
        onEndStream={handleEndStream}
        onUpdateTitle={async (title) => {
          await updateStreamInfo({ title });
          // Update stable ref with new title
          if (stableStreamInfoRef.current) {
            stableStreamInfoRef.current = {
              ...stableStreamInfoRef.current,
              title,
            };
          }
        }}
        onUpdateChatSettings={async (settings) => {
          await updateChatSettings(settings);
          // Update stable ref with new settings
          if (stableStreamInfoRef.current) {
            stableStreamInfoRef.current = {
              ...stableStreamInfoRef.current,
              ...settings,
            };
          }
        }}
      />
    );
  }

  // If no stream exists, show setup form
  // Requirements: 5.1
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
              <p className="text-zinc-400 text-sm">Configure your stream settings</p>
            </div>
          </div>

          <form onSubmit={handleSetupSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-zinc-300">Stream Title *</Label>
              <Input
                id="title"
                value={setupForm.title}
                onChange={(e) => setSetupForm(prev => ({ ...prev, title: e.target.value }))}
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
                onChange={(e) => setSetupForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell viewers what your stream is about..."
                className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
              />
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
                  onCheckedChange={(checked) => setSetupForm(prev => ({ ...prev, isChatEnabled: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Followers-Only Mode</p>
                  <p className="text-zinc-400 text-sm">Only followers can chat</p>
                </div>
                <Switch
                  checked={setupForm.isChatFollowersOnly}
                  onCheckedChange={(checked) => setSetupForm(prev => ({ ...prev, isChatFollowersOnly: checked }))}
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
                  onCheckedChange={(checked) => setSetupForm(prev => ({ ...prev, isChatDelayed: checked }))}
                  disabled={!setupForm.isChatEnabled}
                />
              </div>
            </div>

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

  // Stream exists but not live - show go live button
  // Requirements: 5.3
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Go Live</h1>
          <p className="text-zinc-400">Start streaming from your browser</p>
        </div>
      </div>

      {/* Permission Error Alert */}
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

      {/* Stream Info Card */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-6">
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

        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-zinc-800/50 rounded-lg">
          <div className="text-center">
            <p className="text-zinc-400 text-sm">Chat</p>
            <p className="text-white font-medium">
              {streamInfo.isChatEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-zinc-400 text-sm">Followers Only</p>
            <p className="text-white font-medium">
              {streamInfo.isChatFollowersOnly ? 'Yes' : 'No'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-zinc-400 text-sm">Slow Mode</p>
            <p className="text-white font-medium">
              {streamInfo.isChatDelayed ? 'On' : 'Off'}
            </p>
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
          Your browser will request camera and microphone access
        </p>
      </Card>

      {/* Edit Stream Settings */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Edit Stream Settings</h3>
        <form onSubmit={handleSetupSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title" className="text-zinc-300">Title</Label>
            <Input
              id="edit-title"
              value={setupForm.title}
              onChange={(e) => setSetupForm(prev => ({ ...prev, title: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description" className="text-zinc-300">Description</Label>
            <Textarea
              id="edit-description"
              value={setupForm.description}
              onChange={(e) => setSetupForm(prev => ({ ...prev, description: e.target.value }))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            className="border-zinc-700"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Settings'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
