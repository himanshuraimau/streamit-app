import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { streamApi } from '@/lib/api/stream';
import { authClient } from '@/lib/auth-client';
import { CreatorStreamLayout } from './creator-stream-layout';

interface StreamViewerProps {
  streamInfo: {
    id: string;
    title: string;
    description?: string;
    isChatEnabled: boolean;
    isChatDelayed: boolean;
    isChatFollowersOnly: boolean;
  };
}

export function StreamViewer({ streamInfo }: StreamViewerProps) {
  const { data: session } = authClient.useSession();
  const [token, setToken] = useState<{
    token: string;
    identity: string;
    name: string;
    wsUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatorToken = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[StreamViewer] Fetching creator token...');
      
      const response = await streamApi.getCreatorViewToken();
      
      if (response.success && response.data) {
        setToken(response.data);
        console.log('[StreamViewer] Creator token received successfully');
      } else {
        setError(response.error || 'Failed to get stream token');
      }
    } catch (err) {
      console.error('[StreamViewer] Error fetching creator token:', err);
      setError('Failed to connect to stream');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatorToken();
  }, []);

  if (!session?.user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-500" />
            Stream Preview
          </h3>
          <p className="text-sm text-zinc-400 mt-1">See how your stream appears to viewers</p>
        </div>
      </div>

      {/* Stream Container */}
      <CreatorStreamLayout
        token={token}
        loading={loading}
        error={error}
        streamInfo={streamInfo}
        onRetry={fetchCreatorToken}
      />
    </div>
  );
}
