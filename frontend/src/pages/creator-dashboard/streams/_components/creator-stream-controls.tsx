import { Button } from '@/components/ui/button';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff,
  Users,
} from 'lucide-react';

interface CreatorStreamControlsProps {
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onEndStream: () => void;
  isCameraOn: boolean;
  isMicOn: boolean;
  viewerCount: number;
  isEnding?: boolean;
}

/**
 * CreatorStreamControls - Controls for managing the live stream
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * - Camera on/off toggle button (2.1)
 * - Microphone mute/unmute toggle button (2.2)
 * - End stream button (2.3)
 * - Viewer count display (2.4)
 */
export function CreatorStreamControls({
  onToggleCamera,
  onToggleMic,
  onEndStream,
  isCameraOn,
  isMicOn,
  viewerCount,
  isEnding = false,
}: CreatorStreamControlsProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
      {/* Left side - Stream controls */}
      <div className="flex items-center gap-3">
        {/* Camera toggle - Requirements: 2.1 */}
        <Button
          onClick={onToggleCamera}
          variant={isCameraOn ? 'outline' : 'destructive'}
          size="lg"
          className={isCameraOn 
            ? 'border-zinc-700 hover:bg-zinc-800' 
            : 'bg-red-600/20 border-red-600 text-red-400 hover:bg-red-600/30'
          }
          title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
          <span className="ml-2 hidden sm:inline">
            {isCameraOn ? 'Camera On' : 'Camera Off'}
          </span>
        </Button>

        {/* Microphone toggle - Requirements: 2.2 */}
        <Button
          onClick={onToggleMic}
          variant={isMicOn ? 'outline' : 'destructive'}
          size="lg"
          className={isMicOn 
            ? 'border-zinc-700 hover:bg-zinc-800' 
            : 'bg-red-600/20 border-red-600 text-red-400 hover:bg-red-600/30'
          }
          title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isMicOn ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
          <span className="ml-2 hidden sm:inline">
            {isMicOn ? 'Mic On' : 'Mic Off'}
          </span>
        </Button>
      </div>

      {/* Center - Live indicator and viewer count */}
      <div className="flex items-center gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md font-semibold">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>

        {/* Viewer count - Requirements: 2.4 */}
        <div className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-md">
          <Users className="w-4 h-4" />
          <span className="font-semibold">{viewerCount}</span>
          <span className="text-zinc-400 text-sm hidden sm:inline">
            {viewerCount === 1 ? 'viewer' : 'viewers'}
          </span>
        </div>
      </div>

      {/* Right side - End stream button */}
      {/* Requirements: 2.3 */}
      <Button
        onClick={onEndStream}
        variant="destructive"
        size="lg"
        className="bg-red-600 hover:bg-red-700"
        disabled={isEnding}
      >
        <PhoneOff className="w-5 h-5" />
        <span className="ml-2">End Stream</span>
      </Button>
    </div>
  );
}
