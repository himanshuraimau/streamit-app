import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';
import { toast } from 'sonner';
import { streamApi, type CreateStreamResponse } from '@/lib/api/stream';
import { FileUpload } from '@/components/ui/file-upload';
import { Video, Key, Copy, Eye, EyeOff, Check } from 'lucide-react';

interface StreamSetupModalProps {
  open: boolean;
  onClose: () => void;
  onStreamCreated: (stream: CreateStreamResponse | null) => void;
}

export function StreamSetupModal({ open, onClose, onStreamCreated }: StreamSetupModalProps) {
  const [step, setStep] = useState<'setup' | 'credentials'>('setup');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [chatSettings, setChatSettings] = useState({
    isChatEnabled: true,
    isChatDelayed: false,
    isChatFollowersOnly: false,
  });
  
  // Credentials (after creation)
  const [credentials, setCredentials] = useState<CreateStreamResponse | null>(null);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleThumbnailUpload = (fileUrl: string) => {
    setThumbnail(fileUrl);
    toast.success('Thumbnail uploaded!');
  };

  const handleThumbnailError = (error: string) => {
    toast.error(error || 'Failed to upload thumbnail');
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleCreateStream = async (method: 'browser' | 'obs', e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!title.trim()) {
      toast.error('Please enter a stream title');
      return;
    }

    try {
      setLoading(true);
      const response = await streamApi.createStreamWithMetadata({
        title: title.trim(),
        description: description.trim() || undefined,
        thumbnail: thumbnail || undefined,
        chatSettings,
        streamMethod: method,
      });

      if (response.success && response.data) {
        if (method === 'obs') {
          setCredentials(response.data);
          setStep('credentials');
        } else {
          // Browser streaming - go directly to live
          toast.success('Stream created! Starting browser stream...');
          onStreamCreated(response.data);
          onClose();
        }
      } else {
        toast.error(response.error || 'Failed to create stream');
      }
    } catch (err) {
      toast.error('Failed to create stream');
      console.error('[StreamSetupModal] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('setup');
    setTitle('');
    setDescription('');
    setThumbnail(null);
    setChatSettings({
      isChatEnabled: true,
      isChatDelayed: false,
      isChatFollowersOnly: false,
    });
    setCredentials(null);
    setShowStreamKey(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
        {step === 'setup' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Create New Stream</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Set up your stream with a title, description, and chat settings before going live
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-zinc-300 text-sm font-medium">
                  Stream Title <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="My Gaming Session"
                  className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  maxLength={200}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {title.length}/200 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-zinc-300 text-sm font-medium">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell viewers what you'll be streaming..."
                  className="bg-zinc-800 border-zinc-700 text-white mt-2 min-h-20"
                  maxLength={1000}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {description.length}/1000 characters
                </p>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <Label className="text-zinc-300 text-sm font-medium mb-2 block">
                  Thumbnail (Optional)
                </Label>
                <FileUpload
                  accept="image/*"
                  maxSize={5}
                  purpose="stream-thumbnail"
                  onUploadComplete={handleThumbnailUpload}
                  onUploadError={handleThumbnailError}
                  placeholder="Click to upload thumbnail image"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              {/* Chat Settings */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <Label className="text-zinc-300 text-sm font-medium">Chat Settings</Label>
                
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <span className="text-sm text-zinc-300">Enable Chat</span>
                    <p className="text-xs text-zinc-500">Allow viewers to chat during stream</p>
                  </div>
                  <Switch
                    checked={chatSettings.isChatEnabled}
                    onCheckedChange={(checked) =>
                      setChatSettings((prev) => ({ ...prev, isChatEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <span className="text-sm text-zinc-300">Followers-Only Chat</span>
                    <p className="text-xs text-zinc-500">Only followers can send messages</p>
                  </div>
                  <Switch
                    checked={chatSettings.isChatFollowersOnly}
                    onCheckedChange={(checked) =>
                      setChatSettings((prev) => ({ ...prev, isChatFollowersOnly: checked }))
                    }
                    disabled={!chatSettings.isChatEnabled}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <span className="text-sm text-zinc-300">Slow Mode</span>
                    <p className="text-xs text-zinc-500">30 second delay between messages</p>
                  </div>
                  <Switch
                    checked={chatSettings.isChatDelayed}
                    onCheckedChange={(checked) =>
                      setChatSettings((prev) => ({ ...prev, isChatDelayed: checked }))
                    }
                    disabled={!chatSettings.isChatEnabled}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-zinc-800">
              <Button
                type="button"
                onClick={(e) => handleCreateStream('browser', e)}
                disabled={loading || !title.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                <Video className="w-4 h-4 mr-2" />
                Go Live in Browser
              </Button>
              
              <Button
                type="button"
                onClick={(e) => handleCreateStream('obs', e)}
                disabled={loading || !title.trim()}
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Key className="w-4 h-4 mr-2" />
                Stream with OBS
              </Button>
            </div>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-lg">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  Creating stream...
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Stream Keys Generated</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Copy these credentials to OBS Studio to start streaming
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
                <p className="text-zinc-300 text-sm">
                  Your stream <span className="font-semibold text-white">"{credentials?.stream.title}"</span> is ready! 
                  Copy these credentials to OBS to start streaming.
                </p>
              </div>

              {/* Server URL */}
              <div>
                <Label className="text-zinc-300 text-sm font-medium mb-2 block">
                  Server URL
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={credentials?.credentials.serverUrl || ''}
                      readOnly
                      className="bg-zinc-800 border-zinc-700 text-white pr-10"
                    />
                  </div>
                  <Button
                    onClick={() => copyToClipboard(credentials?.credentials.serverUrl || '', 'serverUrl')}
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800"
                  >
                    {copiedField === 'serverUrl' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Stream Key */}
              <div>
                <Label className="text-zinc-300 text-sm font-medium mb-2 block">
                  Stream Key
                </Label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={credentials?.credentials.streamKey || ''}
                      readOnly
                      type={showStreamKey ? 'text' : 'password'}
                      className="bg-zinc-800 border-zinc-700 text-white pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStreamKey(!showStreamKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                    >
                      {showStreamKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(credentials?.credentials.streamKey || '', 'streamKey')}
                    variant="outline"
                    className="border-zinc-700 hover:bg-zinc-800"
                  >
                    {copiedField === 'streamKey' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Setup Instructions
                </h4>
                <ol className="text-sm text-zinc-400 space-y-2 list-decimal list-inside">
                  <li>Open <span className="text-zinc-300 font-medium">OBS Studio</span></li>
                  <li>Go to <span className="text-zinc-300 font-medium">Settings → Stream</span></li>
                  <li>Set Service to <span className="text-zinc-300 font-medium">Custom</span></li>
                  <li>Paste the <span className="text-zinc-300 font-medium">Server URL</span> and <span className="text-zinc-300 font-medium">Stream Key</span></li>
                  <li>Click <span className="text-zinc-300 font-medium">"Start Streaming"</span> in OBS</li>
                  <li>Your stream will go live automatically!</li>
                </ol>
              </div>

              <Button
                onClick={() => {
                  onStreamCreated(credentials);
                  handleClose();
                }}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Done - Go to Stream Dashboard
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
