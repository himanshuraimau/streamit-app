import { useState, useEffect } from 'react';
import { useStream } from '@/hooks/useStream';
import { toast } from 'sonner';
import { streamApi } from '@/lib/api/stream';

// Components
import { StreamHeader } from './_components/stream-header';
import { StreamStats } from './_components/stream-stats';
import { CreateStreamForm } from './_components/create-stream-form';
import { StreamCredentials } from './_components/stream-credentials';
import { StreamInfoCard } from './_components/stream-info-card';
import { ChatSettingsCard } from './_components/chat-settings-card';
import { StreamViewer } from './_components/stream-viewer';

export default function Streams() {
  const { streamInfo, streamStatus, updateStreamInfo, updateChatSettings, fetchStreamInfo } = useStream();
  
  // Chat settings state
  const [chatSettings, setChatSettings] = useState({
    isChatEnabled: true,
    isChatDelayed: false,
    isChatFollowersOnly: false,
  });

  // New stream form state
  const [creatingStream, setCreatingStream] = useState(false);
  const [newStreamTitle, setNewStreamTitle] = useState('');
  const [newStreamDescription, setNewStreamDescription] = useState('');
  const [newStreamThumbnail, setNewStreamThumbnail] = useState<string | null>(null);
  
  // Credentials display state
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<{ serverUrl: string; streamKey: string } | null>(null);

  // Initialize chat settings when streamInfo loads
  useEffect(() => {
    if (streamInfo) {
      setChatSettings({
        isChatEnabled: streamInfo.isChatEnabled,
        isChatDelayed: streamInfo.isChatDelayed,
        isChatFollowersOnly: streamInfo.isChatFollowersOnly,
      });
    }
  }, [streamInfo]);

  const handleSaveTitle = async (newTitle: string) => {
    if (!newTitle.trim()) {
      toast.error('Title cannot be empty');
      return;
    }

    const result = await updateStreamInfo({ title: newTitle.trim() });
    if (!result) {
      throw new Error('Failed to update title');
    }
  };

  const handleChatSettingChange = async (setting: keyof typeof chatSettings) => {
    const newValue = !chatSettings[setting];
    setChatSettings(prev => ({ ...prev, [setting]: newValue }));
    
    await updateChatSettings({ [setting]: newValue });
  };

  const handleCreateStream = async () => {
    if (!newStreamTitle.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    try {
      setCreatingStream(true);
      const response = await streamApi.createStreamWithMetadata({
        title: newStreamTitle.trim(),
        description: newStreamDescription.trim() || undefined,
        thumbnail: newStreamThumbnail || undefined,
        chatSettings,
        streamMethod: 'obs',
      });

      if (response.success && response.data) {
        setCredentials({
          serverUrl: response.data.credentials.serverUrl,
          streamKey: response.data.credentials.streamKey,
        });
        setShowCredentials(true);
        toast.success('Stream created successfully!');
        fetchStreamInfo();
      } else {
        toast.error(response.error || 'Failed to create stream');
      }
    } catch {
      toast.error('Failed to create stream');
    } finally {
      setCreatingStream(false);
    }
  };

  const handleDone = () => {
    setShowCredentials(false);
    setNewStreamTitle('');
    setNewStreamDescription('');
    setNewStreamThumbnail(null);
    fetchStreamInfo();
  };

  if (!streamInfo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Stream Manager</h1>
            <p className="text-zinc-400">Loading your stream...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <StreamHeader 
        isLive={streamStatus?.isLive || false}
        viewerCount={streamStatus?.viewerCount || 0}
      />

      {/* Show create form if no stream exists and not showing credentials */}
      {!streamInfo.ingressId && !showCredentials && (
        <CreateStreamForm
          title={newStreamTitle}
          setTitle={setNewStreamTitle}
          description={newStreamDescription}
          setDescription={setNewStreamDescription}
          thumbnail={newStreamThumbnail}
          setThumbnail={setNewStreamThumbnail}
          chatSettings={chatSettings}
          setChatSettings={setChatSettings}
          onSubmit={handleCreateStream}
          isCreating={creatingStream}
        />
      )}

      {/* Show credentials after creation */}
      {!streamInfo.ingressId && showCredentials && credentials && (
        <StreamCredentials
          streamTitle={newStreamTitle}
          serverUrl={credentials.serverUrl}
          streamKey={credentials.streamKey}
          onDone={handleDone}
        />
      )}

      {/* Show stream configuration if stream exists */}
      {streamInfo.ingressId && (
        <div className="space-y-8">
          {/* Stream Preview - Show live stream */}
          <StreamViewer streamInfo={streamInfo} />

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <StreamStats
                isLive={streamStatus?.isLive || false}
                viewerCount={streamStatus?.viewerCount || 0}
                isChatEnabled={streamInfo.isChatEnabled}
              />

              {/* Stream Info */}
              <StreamInfoCard
                title={streamInfo.title}
                onSave={handleSaveTitle}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Chat Settings */}
              <ChatSettingsCard
                chatSettings={chatSettings}
                onSettingChange={handleChatSettingChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}