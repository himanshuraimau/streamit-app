import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StreamActionMenu } from '@/components/streamers/StreamActionMenu';
import { streamersApi } from '@/lib/api/streamers.api';
import { queryKeys } from '@/lib/queryKeys';
import { RiEyeLine, RiTimeLine, RiLiveLine } from '@remixicon/react';
import { formatDistanceToNow } from 'date-fns';

export function LiveMonitorPage() {
  const { data: streams, isLoading } = useQuery({
    queryKey: queryKeys.streamers.live(),
    queryFn: () => streamersApi.listLiveStreams(),
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 1000 * 10, // 10 seconds for live data
  });

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Live Stream Monitor</h1>
          <p className="text-muted-foreground">Monitor and manage currently active live streams</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-40 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Stream Monitor</h1>
          <p className="text-muted-foreground">Monitor and manage currently active live streams</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <RiLiveLine className="h-3 w-3" />
            {streams?.length || 0} Live
          </Badge>
        </div>
      </div>

      {!streams || streams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RiLiveLine className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Live Streams</h3>
            <p className="text-sm text-muted-foreground">
              There are currently no active live streams on the platform
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {streams.map((stream) => (
            <Card key={stream.id} className="overflow-hidden">
              <CardHeader className="p-0">
                {stream.thumbnailUrl ? (
                  <img
                    src={stream.thumbnailUrl}
                    alt={stream.title}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="h-40 w-full bg-muted flex items-center justify-center">
                    <RiLiveLine className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge variant="destructive" className="gap-1">
                    <RiLiveLine className="h-3 w-3" />
                    LIVE
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-1">{stream.title}</h3>
                  <p className="text-sm text-muted-foreground">{stream.streamerName}</p>
                </div>

                {stream.category && (
                  <Badge variant="outline" className="text-xs">
                    {stream.category}
                  </Badge>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <RiEyeLine className="h-4 w-4" />
                    <span>{stream.viewerCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RiTimeLine className="h-4 w-4" />
                    <span>{formatDuration(stream.duration)}</span>
                  </div>
                </div>

                {stream.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {stream.description}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Started {formatDistanceToNow(new Date(stream.startedAt), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0">
                <StreamActionMenu stream={stream} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default LiveMonitorPage;
