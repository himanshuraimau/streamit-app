import { Users } from 'lucide-react';

interface StreamHeaderProps {
  isLive: boolean;
  viewerCount: number;
}

export function StreamHeader({ isLive, viewerCount }: StreamHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Stream Manager</h1>
        <p className="text-zinc-400">Control your stream settings and go live</p>
      </div>
      <div className="flex items-center gap-3">
        {isLive && (
          <>
            <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md font-semibold">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
            <div className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-md">
              <Users className="w-4 h-4" />
              <span className="font-semibold">{viewerCount}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
