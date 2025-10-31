import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function Keys() {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Stream Keys</h1>
          <p className="text-zinc-400">Manage your streaming keys and RTMP settings</p>
        </div>
        <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
          <RefreshCw className="w-4 h-4 mr-2" />
          Generate New Key
        </Button>
      </div>

      {/* Stream Key Card */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Primary Stream Key</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-2">RTMP URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300">
                  rtmp://live.streamit.com/live/
                </code>
                <Button size="sm" variant="outline" className="border-zinc-700">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-zinc-300 block mb-2">Stream Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-300">
                  {showKey ? 'sk_live_1234567890abcdef' : '••••••••••••••••••••'}
                </code>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-zinc-700"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="outline" className="border-zinc-700">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How to use your stream key</h3>
        <div className="space-y-3 text-sm text-zinc-400">
          <p>1. Copy your RTMP URL and Stream Key from above</p>
          <p>2. Open your streaming software (OBS, Streamlabs, etc.)</p>
          <p>3. Go to Settings → Stream</p>
          <p>4. Set Service to "Custom" and paste your RTMP URL</p>
          <p>5. Paste your Stream Key in the Stream Key field</p>
          <p>6. Click "Start Streaming" to go live!</p>
        </div>
      </Card>

      {/* Placeholder Content */}
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="text-center">
          <Key className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Advanced Key Management</h3>
          <p className="text-zinc-400 mb-4">
            Additional features like backup keys, key rotation, and advanced RTMP settings will be available here.
          </p>
          <p className="text-zinc-500 text-sm">Coming soon...</p>
        </div>
      </Card>
    </div>
  );
}