import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Eye, UserCircle } from 'lucide-react';
import type { StreamResult } from '@/lib/api/search';

interface StreamResultCardProps {
  stream: StreamResult;
}

export function StreamResultCard({ stream }: StreamResultCardProps) {
  const username = stream.user.username || 'unknown';
  
  return (
    <Link to={`/${username}/live`}>
      <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500/50 transition-all duration-200 overflow-hidden group">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-zinc-800">
          {stream.thumbnailUrl ? (
            <img
              src={stream.thumbnailUrl}
              alt={stream.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-12 h-12 text-zinc-600" />
            </div>
          )}
          
          {/* Live Badge */}
          {stream.isLive && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              LIVE
            </div>
          )}
          
          {/* Viewer Count */}
          {stream.isLive && (
            <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{stream.viewerCount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex gap-3">
            {/* User Avatar */}
            <div className="shrink-0">
              {stream.user.imageUrl ? (
                <img
                  src={stream.user.imageUrl}
                  alt={username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Stream Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold truncate group-hover:text-purple-400 transition-colors">
                {stream.name}
              </h3>
              <p className="text-zinc-400 text-sm truncate">{username}</p>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function Video({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m22 8-6 4 6 4V8Z" />
      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
  );
}
