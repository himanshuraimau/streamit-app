import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Eye, EyeOff, Copy, RefreshCw, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useStream } from '@/hooks/useStream';
import { toast } from 'sonner';

export default function Keys() {
  const [showKey, setShowKey] = useState(false);
  const [showServerUrl, setShowServerUrl] = useState(false);
  const { streamInfo, loading, createIngress, deleteIngress } = useStream();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleGenerateKey = async () => {
    if (streamInfo?.streamKey) {
      // Show confirmation dialog
      if (!window.confirm('Generating a new key will invalidate your current stream key. Are you sure?')) {
        return;
      }
    }
    await createIngress('RTMP');
  };

  const handleResetKey = async () => {
    if (!window.confirm('This will delete your current stream key. You will need to generate a new one. Are you sure?')) {
      return;
    }
    await deleteIngress();
  };

  const hasStreamKey = streamInfo?.streamKey && streamInfo?.serverUrl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Stream Keys</h1>
          <p className="text-zinc-400">Manage your streaming keys and RTMP settings</p>
        </div>
        <div className="flex gap-2">
          {hasStreamKey && (
            <Button 
              variant="outline" 
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={handleResetKey}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Key
            </Button>
          )}
          <Button 
            variant="outline" 
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={handleGenerateKey}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {hasStreamKey ? 'Regenerate Key' : 'Generate Key'}
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      {!hasStreamKey && (
        <Card className="bg-yellow-900/20 border-yellow-700/50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-semibold mb-1">No Stream Key Generated</h3>
              <p className="text-yellow-200/80 text-sm">
                You need to generate a stream key before you can start streaming. Click the "Generate Key" button above.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Stream Key Card */}
      {hasStreamKey ? (
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Primary Stream Key</h3>
              <span className="ml-auto px-2 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                Active
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">Server URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300 overflow-x-auto">
                    {showServerUrl ? streamInfo.serverUrl : '••••••••••••••••••••••••••••••••••••'}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-zinc-700"
                    onClick={() => setShowServerUrl(!showServerUrl)}
                  >
                    {showServerUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-zinc-700"
                    onClick={() => copyToClipboard(streamInfo.serverUrl || '', 'Server URL')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-300 block mb-2">Stream Key</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300 overflow-x-auto">
                    {showKey ? streamInfo.streamKey : '••••••••••••••••••••'}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-zinc-700"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-zinc-700"
                    onClick={() => copyToClipboard(streamInfo.streamKey || '', 'Stream Key')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800 p-8">
          <div className="text-center">
            <Key className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Generate Your Stream Key</h3>
            <p className="text-zinc-400 mb-4">
              Click the "Generate Key" button above to create your streaming credentials.
            </p>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How to use your stream key</h3>
        <div className="space-y-3 text-sm text-zinc-400">
          <p><strong className="text-zinc-300">1.</strong> Generate your stream key using the button above (if you haven't already)</p>
          <p><strong className="text-zinc-300">2.</strong> Copy your Server URL and Stream Key</p>
          <p><strong className="text-zinc-300">3.</strong> Open your streaming software (OBS, Streamlabs, XSplit, etc.)</p>
          <p><strong className="text-zinc-300">4.</strong> Go to Settings → Stream</p>
          <p><strong className="text-zinc-300">5.</strong> Set Service to "Custom" and paste your Server URL</p>
          <p><strong className="text-zinc-300">6.</strong> Paste your Stream Key in the Stream Key field</p>
          <p><strong className="text-zinc-300">7.</strong> Click "Start Streaming" to go live!</p>
        </div>
      </Card>

      {/* Security Notice */}
      <Card className="bg-red-900/20 border-red-700/50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <h3 className="text-red-400 font-semibold mb-1">Keep Your Stream Key Secret</h3>
            <p className="text-red-200/80 text-sm">
              Never share your stream key with anyone. Anyone with your stream key can stream to your channel. 
              If your key is compromised, regenerate it immediately.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}