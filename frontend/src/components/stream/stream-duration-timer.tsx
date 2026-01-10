import { useEffect, useState } from 'react';
import { formatDuration } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * StreamDurationTimer Component
 * 
 * Displays the live duration of a stream in "HH:MM:SS" format with a pulsing LIVE indicator.
 * Updates every second using useEffect interval.
 * 
 * Requirements:
 * - 1.1: WHEN a viewer joins a live stream, THE Stream_Player SHALL display the live duration timer in the format "HH:MM:SS"
 * - 1.2: WHILE the stream is live, THE Stream_Player SHALL update the duration timer every second
 * - 1.3: WHEN the stream started time is available, THE Stream_Player SHALL calculate duration from the stream start timestamp
 */

interface StreamDurationTimerProps {
  /** The timestamp when the stream started (Date object, ISO string, or null/undefined) */
  startedAt: Date | string | null | undefined;
  /** Optional additional CSS classes */
  className?: string;
  /** Whether to show the LIVE indicator (default: true) */
  showLiveIndicator?: boolean;
  /** Size variant for the component */
  size?: 'sm' | 'md' | 'lg';
}

export function StreamDurationTimer({
  startedAt,
  className,
  showLiveIndicator = true,
  size = 'md',
}: StreamDurationTimerProps) {
  const [duration, setDuration] = useState<string>(() => formatDuration(startedAt));

  // Update duration every second
  useEffect(() => {
    // Calculate initial duration
    setDuration(formatDuration(startedAt));

    // Set up interval to update every second
    const intervalId = setInterval(() => {
      setDuration(formatDuration(startedAt));
    }, 1000);

    // Cleanup interval on unmount or when startedAt changes
    return () => {
      clearInterval(intervalId);
    };
  }, [startedAt]);

  // Size-based styling
  const sizeClasses = {
    sm: {
      container: 'px-2 py-1 text-xs gap-1.5',
      dot: 'w-1.5 h-1.5',
      liveText: 'text-xs',
      duration: 'text-xs',
    },
    md: {
      container: 'px-3 py-1.5 text-sm gap-2',
      dot: 'w-2 h-2',
      liveText: 'text-sm',
      duration: 'text-sm',
    },
    lg: {
      container: 'px-4 py-2 text-base gap-2.5',
      dot: 'w-2.5 h-2.5',
      liveText: 'text-base',
      duration: 'text-base',
    },
  };

  const styles = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex items-center bg-red-600 text-white rounded-full font-semibold',
        styles.container,
        className
      )}
    >
      {showLiveIndicator && (
        <>
          {/* Pulsing dot indicator */}
          <div
            className={cn(
              'bg-white rounded-full animate-pulse',
              styles.dot
            )}
            aria-hidden="true"
          />
          {/* LIVE text */}
          <span className={styles.liveText}>LIVE</span>
          {/* Separator */}
          <span className="text-white/60">•</span>
        </>
      )}
      {/* Duration display */}
      <span 
        className={cn('font-mono tabular-nums', styles.duration)}
        aria-label={`Stream duration: ${duration}`}
      >
        {duration}
      </span>
    </div>
  );
}
