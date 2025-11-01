import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface StreamStatsProps {
  isLive: boolean;
  viewerCount: number;
  isChatEnabled: boolean;
}

export function StreamStats({ isLive, viewerCount, isChatEnabled }: StreamStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm">Status</p>
            <p className="text-white text-2xl font-bold mt-1">
              {isLive ? 'Live' : 'Offline'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isLive ? 'bg-red-500/20' : 'bg-zinc-800'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              isLive ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'
            }`} />
          </div>
        </div>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm">Viewers</p>
            <p className="text-white text-2xl font-bold mt-1">
              {viewerCount || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm">Chat</p>
            <p className="text-white text-2xl font-bold mt-1">
              {isChatEnabled ? 'On' : 'Off'}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isChatEnabled ? 'bg-green-500/20' : 'bg-zinc-800'
          }`}>
            <div className={`text-2xl ${isChatEnabled ? '' : 'opacity-50'}`}>
              💬
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
