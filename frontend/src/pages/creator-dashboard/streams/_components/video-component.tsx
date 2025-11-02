import { useEffect, useRef, useState } from 'react';
import { Track } from 'livekit-client';
import { 
  useTracks,
  VideoTrack,
  AudioTrack,
  useRoomContext,
} from '@livekit/components-react';
import { Loader2, Signal, VideoOff } from 'lucide-react';

interface VideoComponentProps {
  hostName: string;
  showControls?: boolean;
}

export function VideoComponent({ 
  hostName,
  showControls = true 
}: VideoComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<number | null>(null);
  const room = useRoomContext();

  // Get all video and audio tracks in the room (from OBS/ingress)
  const tracks = useTracks([
    Track.Source.Camera,
    Track.Source.Microphone,
  ]);

  useEffect(() => {
    console.log('[VideoComponent] Room state:', room.state);
    console.log('[VideoComponent] Room name:', room.name);
    console.log('[VideoComponent] Local participant:', room.localParticipant?.identity);
    console.log('[VideoComponent] Remote participants:', Array.from(room.remoteParticipants.keys()));
  }, [room]);

  useEffect(() => {
    timeoutRef.current = window.setTimeout(() => {
      console.log('[VideoComponent] Timeout reached - stopping loading state');
      setIsLoading(false);
    }, 10000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('[VideoComponent] Tracks detected:', tracks.length);
    if (tracks.length > 0) {
      tracks.forEach((track, index) => {
        console.log(`[VideoComponent] Track ${index}:`, {
          source: track.source,
          participantIdentity: track.participant.identity,
          participantName: track.participant.name,
          isLocal: track.participant.isLocal,
        });
      });
      setIsLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  }, [tracks]);

  // Show loading state while waiting for tracks
  if (isLoading && tracks.length === 0) {
    return (
      <div className="aspect-video bg-zinc-900 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <Loader2 className="w-16 h-16 text-purple-500 mx-auto animate-spin" />
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Connecting...</h3>
            <p className="text-zinc-400 text-sm">
              Waiting for stream to start from OBS...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If loading finished but still no tracks, show offline state
  if (!isLoading && tracks.length === 0) {
    return (
      <div className="aspect-video bg-zinc-900 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4 px-4">
          <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto">
            <VideoOff className="w-10 h-10 text-zinc-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">No Stream Detected</h3>
            <p className="text-zinc-400 text-sm">
              Start streaming from OBS to see your video preview
            </p>
            <p className="text-zinc-500 text-xs mt-2">
              Use your stream key in OBS to begin broadcasting
            </p>
          </div>
        </div>
      </div>
    );
  }

  const videoTrack = tracks.find(track => track.source === Track.Source.Camera);
  const audioTrack = tracks.find(track => track.source === Track.Source.Microphone);

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
      {videoTrack && (
        <VideoTrack
          trackRef={videoTrack}
          className="w-full h-full object-contain"
        />
      )}

      {audioTrack && (
        <AudioTrack trackRef={audioTrack} />
      )}

      {showControls && (
        <>
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-semibold text-sm shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          </div>

          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs">
              <Signal className="w-3 h-3 text-green-500" />
              <span>HD</span>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 z-10">
            <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg">
              <p className="font-medium text-sm">{hostName}</p>
            </div>
          </div>

          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        </>
      )}
    </div>
  );
}
