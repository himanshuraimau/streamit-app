import { useEffect, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import { 
  useRemoteParticipant, 
  useTracks,
  VideoTrack,
  AudioTrack,
} from '@livekit/components-react';
import { Loader2, Video as VideoIcon, Signal, Flag } from 'lucide-react';
import { StreamDurationTimer } from '@/components/stream/stream-duration-timer';
import { LikeButton } from '@/components/payment/LikeButton';
import { ReportStreamDialog } from '@/components/stream/report-stream-dialog';
import { Button } from '@/components/ui/button';

interface VideoComponentProps {
  hostIdentity: string;
  hostName: string;
  showControls?: boolean;
  /** Stream ID for reporting and penny tips */
  streamId?: string;
  /** When the stream started (for duration timer) */
  startedAt?: string | null;
}

export function VideoComponent({ 
  hostIdentity, 
  hostName,
  showControls = true,
  streamId,
  startedAt,
}: VideoComponentProps) {
  const participant = useRemoteParticipant(hostIdentity);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const tracks = useTracks([
    Track.Source.Camera,
    Track.Source.Microphone,
  ]).filter(track => track.participant.identity === hostIdentity);

  useEffect(() => {
    // Set a timeout to stop showing loading after 10 seconds
    timeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (tracks.length > 0) {
      setIsLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [tracks]);

  // Offline state - no participant
  if (!participant) {
    return (
      <div className="aspect-video bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto backdrop-blur-sm">
            <VideoIcon className="w-10 h-10 text-zinc-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Stream Offline</h3>
            <p className="text-zinc-400 text-sm">
              {hostName} is not currently streaming
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state - participant exists but no tracks yet
  if (isLoading || tracks.length === 0) {
    return (
      <div className="aspect-video bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <Loader2 className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-spin" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Connecting...</h3>
            <p className="text-zinc-400 text-sm">
              Establishing connection to {hostName}'s stream
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Find video and audio tracks
  const videoTrack = tracks.find(track => track.source === Track.Source.Camera);
  const audioTrack = tracks.find(track => track.source === Track.Source.Microphone);

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
      {/* Video Track */}
      {videoTrack && (
        <VideoTrack
          trackRef={videoTrack}
          className="w-full h-full object-contain"
        />
      )}

      {/* Audio Track */}
      {audioTrack && (
        <AudioTrack trackRef={audioTrack} />
      )}

      {showControls && (
        <>
          {/* Live Indicator with Duration Timer - Requirements: 1.1, 1.2, 1.3 */}
          <div className="absolute top-4 left-4 z-10">
            <StreamDurationTimer 
              startedAt={startedAt} 
              showLiveIndicator={true}
              size="md"
            />
          </div>

          {/* Connection Quality Indicator */}
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs">
              <Signal className="w-3 h-3 text-green-500" />
              <span>HD</span>
            </div>
          </div>

          {/* Host Name Overlay */}
          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg">
              <p className="font-medium text-sm">{hostName}</p>
            </div>
          </div>

          {/* Stream Controls - Requirements: 2.1, 3.1 */}
          {streamId && (
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
              {/* Like/Penny Tip Button - Requirements: 3.1, 3.2, 3.3, 3.4, 3.5 */}
              <LikeButton
                creatorId={hostIdentity}
                streamId={streamId}
                className="bg-black/70 backdrop-blur-sm hover:bg-black/80"
              />
              
              {/* Report Button - Requirements: 2.1 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReportDialog(true)}
                className="bg-black/70 backdrop-blur-sm hover:bg-black/80 text-zinc-300 hover:text-red-400"
                aria-label="Report stream"
              >
                <Flag className="w-5 h-5" />
              </Button>
            </div>
          )}

          {/* Gradient Overlays for better readability */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        </>
      )}

      {/* Report Stream Dialog - Requirements: 2.2, 2.3, 2.4 */}
      {streamId && (
        <ReportStreamDialog
          streamId={streamId}
          creatorId={hostIdentity}
          open={showReportDialog}
          onClose={() => setShowReportDialog(false)}
        />
      )}
    </div>
  );
}
