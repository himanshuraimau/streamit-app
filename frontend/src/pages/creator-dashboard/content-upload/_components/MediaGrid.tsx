import { useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import type { MediaResponse } from '@/types/content';

interface MediaGridProps {
  media: MediaResponse[];
  compact?: boolean;
}

export function MediaGrid({ media, compact = false }: MediaGridProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaResponse | null>(null);

  if (media.length === 0) return null;

  const renderMedia = (item: MediaResponse, index: number) => {
    const isVideo = item.type === 'VIDEO';
    const isGif = item.type === 'GIF';

    return (
      <div
        key={item.id}
        className="relative cursor-pointer group overflow-hidden rounded-lg"
        onClick={() => setSelectedMedia(item)}
      >
        {isVideo ? (
          <div className="relative">
            <img
              src={item.thumbnailUrl || item.url}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
              <Play className="w-12 h-12 text-white" fill="white" />
            </div>
            {item.duration && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {formatDuration(item.duration)}
              </div>
            )}
          </div>
        ) : (
          <img
            src={item.url}
            alt={`Media ${index + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        )}
        
        {isGif && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            GIF
          </div>
        )}
      </div>
    );
  };

  const getGridClass = () => {
    switch (media.length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2 grid-rows-2';
      default:
        return 'grid-cols-2 grid-rows-2';
    }
  };

  return (
    <>
      <div className={`grid gap-2 ${getGridClass()}`}>
        {media.slice(0, 4).map((item, index) => (
          <div
            key={item.id}
            className={`
              ${media.length === 3 && index === 0 ? 'row-span-2' : ''}
              ${media.length > 4 && index === 3 ? 'relative' : ''}
              ${compact ? 'aspect-video h-48' : 'aspect-square'}
            `}
          >
            {renderMedia(item, index)}
            {media.length > 4 && index === 3 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-xl font-semibold">
                +{media.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <MediaModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </>
  );
}

interface MediaModalProps {
  media: MediaResponse;
  onClose: () => void;
}

function MediaModal({ media, onClose }: MediaModalProps) {
  const [isMuted, setIsMuted] = useState(true);
  const isVideo = media.type === 'VIDEO';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white text-xl hover:text-gray-300"
        >
          ✕
        </button>
        
        {isVideo ? (
          <div className="relative">
            <video
              src={media.url}
              controls
              autoPlay
              muted={isMuted}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        ) : (
          <img
            src={media.url}
            alt="Full size media"
            className="max-w-full max-h-[80vh] object-contain"
          />
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}