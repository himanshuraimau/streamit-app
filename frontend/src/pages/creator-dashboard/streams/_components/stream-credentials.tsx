import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Eye, EyeOff, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface StreamCredentialsProps {
  streamTitle: string;
  serverUrl: string;
  streamKey: string;
  onDone: () => void;
}

export function StreamCredentials({
  streamTitle,
  serverUrl,
  streamKey,
  onDone,
}: StreamCredentialsProps) {
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4 mb-6">
          <p className="text-zinc-300 text-sm">
            Your stream <span className="font-semibold text-white">"{streamTitle}"</span> is ready! 
            Copy these credentials to OBS to start streaming.
          </p>
        </div>

        <div className="space-y-6">
          {/* Server URL */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              Server URL
            </Label>
            <div className="flex gap-2">
              <Input
                value={serverUrl}
                readOnly
                className="flex-1 bg-zinc-800 border-zinc-700 text-white"
              />
              <Button
                type="button"
                onClick={() => copyToClipboard(serverUrl, 'serverUrl')}
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
                  value={streamKey}
                  readOnly
                  type={showStreamKey ? 'text' : 'password'}
                  className="bg-zinc-800 border-zinc-700 text-white pr-10"
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
                type="button"
                onClick={() => copyToClipboard(streamKey, 'streamKey')}
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
            <h4 className="text-white font-medium mb-3">Setup Instructions</h4>
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
            type="button"
            onClick={onDone}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            Done
          </Button>
        </div>
      </div>
    </Card>
  );
}
