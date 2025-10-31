import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Play, Pause, Settings } from 'lucide-react';

export default function Streams() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Streams</h1>
          <p className="text-zinc-400">Manage your live streams and recordings</p>
        </div>
        <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
          <Video className="w-4 h-4 mr-2" />
          Go Live
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Play className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Start Stream</h3>
              <p className="text-zinc-400 text-sm">Begin live streaming</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <Pause className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Stream Offline</h3>
              <p className="text-zinc-400 text-sm">No active streams</p>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Stream Settings</h3>
              <p className="text-zinc-400 text-sm">Configure your stream</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Placeholder Content */}
      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <div className="text-center">
          <Video className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Streams Management</h3>
          <p className="text-zinc-400 mb-4">
            This section will contain your stream management tools, live stream controls, and stream history.
          </p>
          <p className="text-zinc-500 text-sm">Coming soon...</p>
        </div>
      </Card>
    </div>
  );
}