import { useEffect, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import { 
  useRemoteParticipant, 
  useTracks,
  VideoTrack,
  AudioTrack,
} from '@livekit/components-react';
import { Loader2, Video as VideoIcon } from 'lucide-react';

interface VideoPlayerProps {
  hostIdentity: string;
  hostName: string;
}

export function VideoPlayer({ hostIdentity, hostName }: VideoPlayerProps) {
  const participant = useRemoteParticipant(hostIdentity);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<number | null>(null);

  const tracks = useTracks([
    Track.Source.Camera,
    Track.Source.Microphone,
  ]).filter(track => track.participant.identity === hostIdentity);

  useEffect(() => {
    // Set a timeout to stop showing loading after 10 seconds
    timeoutRef.current = setTimeout(() => {
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
      <div className="aspect-video bg-zinc-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <VideoIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Stream Offline</h3>
          <p className="text-zinc-400">
            {hostName} is not currently streaming
          </p>
        </div>
      </div>
    );
  }

  // Loading state - participant exists but no tracks yet
  if (isLoading || tracks.length === 0) {
    return (
      <div className="aspect-video bg-zinc-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-white mb-2">Connecting...</h3>
          <p className="text-zinc-400">
            Establishing connection to {hostName}'s stream
          </p>
        </div>
      </div>
    );
  }

  // Find video and audio tracks
  const videoTrack = tracks.find(track => track.source === Track.Source.Camera);
  const audioTrack = tracks.find(track => track.source === Track.Source.Microphone);

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
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

      {/* Live Indicator */}
      <div className="absolute top-4 left-4 z-10">
        <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full font-semibold text-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Host Name */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg">
          <p className="font-medium">{hostName}</p>
        </div>
      </div>
    </div>
  );
}
