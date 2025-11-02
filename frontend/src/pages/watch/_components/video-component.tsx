import { useEffect, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import { 
  useRemoteParticipant, 
  useTracks,
  VideoTrack,
  AudioTrack,
} from '@livekit/components-react';
import { Loader2, Video as VideoIcon, Signal } from 'lucide-react';

interface VideoComponentProps {
  hostIdentity: string;
  hostName: string;
  showControls?: boolean;
}

export function VideoComponent({ 
  hostIdentity, 
  hostName,
  showControls = true 
}: VideoComponentProps) {
  const participant = useRemoteParticipant(hostIdentity);
  const [isLoading, setIsLoading] = useState(true);
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
          {/* Live Indicator */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-semibold text-sm shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
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

          {/* Gradient Overlays for better readability */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        </>
      )}
    </div>
  );
}
