import { Button } from '@/components/ui/button';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff,
  Users,
  MessageSquare,
  Gift,
  Pin,
  Shield,
  Waves,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface CreatorStreamControlsProps {
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onEndStream: () => void;
  onToggleChatPanel: () => void;
  onOpenViewerList: () => void;
  onOpenGiftTransactions: () => void;
  onOpenPinMessage: () => void;
  onOpenModerationTools: () => void;
  onOpenFilters: () => void;
  onToggleAudioOnly: () => void;
  onSwitchCamera: () => void;
  isCameraOn: boolean;
  isMicOn: boolean;
  isChatPanelVisible: boolean;
  isAudioOnly: boolean;
  canSwitchCamera: boolean;
  hasPinnedMessage: boolean;
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
  onToggleChatPanel,
  onOpenViewerList,
  onOpenGiftTransactions,
  onOpenPinMessage,
  onOpenModerationTools,
  onOpenFilters,
  onToggleAudioOnly,
  onSwitchCamera,
  isCameraOn,
  isMicOn,
  isChatPanelVisible,
  isAudioOnly,
  canSwitchCamera,
  hasPinnedMessage,
  viewerCount,
  isEnding = false,
}: CreatorStreamControlsProps) {
  return (
    <div className="space-y-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md font-semibold">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>

          <button
            type="button"
            onClick={onOpenViewerList}
            className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-md transition-colors hover:bg-zinc-700"
          >
            <Users className="w-4 h-4" />
            <span className="font-semibold">{viewerCount}</span>
            <span className="text-zinc-400 text-sm hidden sm:inline">
              {viewerCount === 1 ? 'viewer' : 'viewers'}
            </span>
          </button>
        </div>

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

      <div className="flex flex-wrap items-center gap-3">
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

        <Button
          onClick={onToggleChatPanel}
          variant={isChatPanelVisible ? 'outline' : 'secondary'}
          className="border-zinc-700 hover:bg-zinc-800"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">
            {isChatPanelVisible ? 'Hide Chat' : 'Show Chat'}
          </span>
        </Button>

        <Button
          onClick={onOpenViewerList}
          variant="outline"
          className="border-zinc-700 hover:bg-zinc-800"
        >
          <Users className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">Viewer List</span>
        </Button>

        <Button
          onClick={onOpenGiftTransactions}
          variant="outline"
          className="border-zinc-700 hover:bg-zinc-800"
        >
          <Gift className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">Gift Activity</span>
        </Button>

        <Button
          onClick={onOpenPinMessage}
          variant={hasPinnedMessage ? 'secondary' : 'outline'}
          className="border-zinc-700 hover:bg-zinc-800"
        >
          <Pin className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">
            {hasPinnedMessage ? 'Edit Pin' : 'Pin Message'}
          </span>
        </Button>

        <Button
          onClick={onOpenModerationTools}
          variant="outline"
          className="border-zinc-700 hover:bg-zinc-800"
        >
          <Shield className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">Moderation</span>
        </Button>

        <Button
          onClick={onToggleAudioOnly}
          variant={isAudioOnly ? 'secondary' : 'outline'}
          className="border-zinc-700 hover:bg-zinc-800"
        >
          <Waves className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">
            {isAudioOnly ? 'Exit Audio Only' : 'Audio Only'}
          </span>
        </Button>

        <Button
          onClick={onOpenFilters}
          variant="outline"
          className="border-zinc-700 hover:bg-zinc-800"
        >
          <Sparkles className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">Filters</span>
        </Button>

        <Button
          onClick={onSwitchCamera}
          variant="outline"
          className="border-zinc-700 hover:bg-zinc-800"
          disabled={!canSwitchCamera}
        >
          <RefreshCw className="w-4 h-4" />
          <span className="ml-2 hidden sm:inline">Switch Camera</span>
        </Button>
      </div>
    </div>
  );
}
