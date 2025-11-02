import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { viewerApi, type StreamByUsername } from '@/lib/api/stream';
import { StreamContainer } from './_components/stream-container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Navbar from '@/pages/home/_components/navbar';
import { HomeSidebar } from '@/pages/home/_components/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function WatchStream() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const [stream, setStream] = useState<StreamByUsername | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStream = async () => {
      if (!username) {
        setError('No username provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('[WatchStream] Fetching stream for username:', username);
        const response = await viewerApi.getStreamByUsername(username);
        
        if (response.success && response.data) {
          setStream(response.data);
          console.log('[WatchStream] Stream loaded:', response.data);
        } else {
          setError(response.error || 'Stream not found');
        }
      } catch (err) {
        console.error('[WatchStream] Error fetching stream:', err);
        setError('Failed to load stream');
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [username]);

  if (loading) {
    return (
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen w-full flex-col bg-black">
          <Navbar />
          <div className="flex flex-1 pt-20">
            <HomeSidebar />
            <main className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto" />
                <p className="text-white">Loading stream...</p>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (error || !stream) {
    return (
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen w-full flex-col bg-black">
          <Navbar />
          <div className="flex flex-1 pt-20">
            <HomeSidebar />
            <main className="flex-1 flex items-center justify-center p-4">
              <Card className="bg-zinc-900 border-zinc-800 p-8 max-w-md w-full">
                <div className="text-center space-y-4">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
                  <h2 className="text-2xl font-bold text-white">Stream Not Found</h2>
                  <p className="text-zinc-400">
                    {error || 'This stream does not exist or is not available.'}
                  </p>
                  <div className="flex gap-3 justify-center pt-4">
                    <Button
                      onClick={() => navigate(-1)}
                      variant="outline"
                      className="border-zinc-700 hover:bg-zinc-800"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Go Back
                    </Button>
                    <Button
                      onClick={() => navigate('/')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Browse Streams
                    </Button>
                  </div>
                </div>
              </Card>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full flex-col bg-black">
        <Navbar />
        <div className="flex flex-1 pt-20">
          <HomeSidebar />
          
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
              <StreamContainer
                stream={stream}
                isFollowing={false}
                onFollow={() => {
                  console.log('Follow clicked');
                }}
                onShare={() => {
                  console.log('Share clicked');
                }}
              />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
