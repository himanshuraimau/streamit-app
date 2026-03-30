/**
 * Hook for handling LiveKit data channel events in stream components
 * 
 * This hook integrates with the LiveKit room context to listen for
 * engagement events and stream ended events via data channels.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { useEffect, useCallback, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, type RemoteParticipant } from 'livekit-client';
import {
  parseDataChannelMessage,
  messageToEngagementEvent,
  type StreamEndedHandler,
} from '@/lib/livekit-data-channel';
import type { EngagementEvent } from '@/components/stream/engagement-popup';
import type { StreamSummary } from '@/lib/api/stream';

interface UseDataChannelEventsOptions {
  onStreamEnded?: StreamEndedHandler;
}

interface UseDataChannelEventsReturn {
  /** Current list of engagement events */
  events: EngagementEvent[];
  /** Add a new engagement event manually */
  addEvent: (event: Omit<EngagementEvent, 'id' | 'timestamp'>) => void;
  /** Dismiss an event by ID */
  dismissEvent: (eventId: string) => void;
  /** Clear all events */
  clearAll: () => void;
  /** Stream summary when stream ends */
  streamSummary: StreamSummary | null;
  /** Whether the stream has ended */
  hasStreamEnded: boolean;
}

/**
 * Hook that listens for data channel events from LiveKit room
 * and manages engagement event state
 * 
 * @param options - Configuration options including stream ended handler
 * @returns Object with events array and event management functions
 * 
 * Requirements: 4.1, 4.2, 4.3
 */
export function useDataChannelEvents(
  options: UseDataChannelEventsOptions = {}
): UseDataChannelEventsReturn {
  const room = useRoomContext();
  const [events, setEvents] = useState<EngagementEvent[]>([]);
  const [streamSummary, setStreamSummary] = useState<StreamSummary | null>(null);
  const [hasStreamEnded, setHasStreamEnded] = useState(false);

  /**
   * Add a new engagement event to the queue
   */
  const addEvent = useCallback((event: Omit<EngagementEvent, 'id' | 'timestamp'>) => {
    const newEvent: EngagementEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    setEvents(prev => [...prev, newEvent]);
  }, []);

  /**
   * Dismiss an event by ID
   */
  const dismissEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  /**
   * Clear all events
   */
  const clearAll = useCallback(() => {
    setEvents([]);
  }, []);

  /**
   * Handle incoming data channel messages
   */
  const handleDataReceived = useCallback(
    (payload: Uint8Array, participant?: RemoteParticipant) => {
      const message = parseDataChannelMessage(payload);
      
      if (!message) {
        return;
      }

      console.log('[useDataChannelEvents] Received message:', message.type, 'from:', participant?.identity);

      // Handle stream ended separately
      if (message.type === 'stream_ended') {
        setStreamSummary(message.summary);
        setHasStreamEnded(true);
        if (options.onStreamEnded) {
          options.onStreamEnded(message.summary);
        }
        return;
      }

      // Convert to engagement event and add to queue
      const engagementEvent = messageToEngagementEvent(message);
      if (engagementEvent) {
        setEvents(prev => [...prev, engagementEvent]);
      }
    },
    [options]
  );

  /**
   * Set up data channel listeners when room is available
   */
  useEffect(() => {
    if (!room) {
      return;
    }

    console.log('[useDataChannelEvents] Setting up data channel listeners');
    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      console.log('[useDataChannelEvents] Cleaning up data channel listeners');
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, handleDataReceived]);

  return {
    events,
    addEvent,
    dismissEvent,
    clearAll,
    streamSummary,
    hasStreamEnded,
  };
}

export default useDataChannelEvents;
