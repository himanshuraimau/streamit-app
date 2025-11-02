import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCircle, Users } from 'lucide-react';
import type { UserResult } from '@/lib/api/search';

interface UserResultCardProps {
  user: UserResult;
}

export function UserResultCard({ user }: UserResultCardProps) {
  const username = user.username || 'unknown';
  
  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-purple-500/50 transition-all duration-200 p-4">
      <div className="flex items-center gap-4">
        {/* User Avatar */}
        <Link to={`/${username}`} className="flex-shrink-0">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={username}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-white" />
            </div>
          )}
        </Link>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/${username}`}>
              <h3 className="text-white font-semibold hover:text-purple-400 transition-colors">
                {username}
              </h3>
            </Link>
            {user.isLive && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                LIVE
              </span>
            )}
          </div>
          
          {user.bio && (
            <p className="text-zinc-400 text-sm line-clamp-2 mb-2">{user.bio}</p>
          )}
          
          <div className="flex items-center gap-1 text-zinc-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{user.followerCount.toLocaleString()} followers</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {user.isLive ? (
            <Link to={`/${username}/live`}>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Watch
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Follow
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
