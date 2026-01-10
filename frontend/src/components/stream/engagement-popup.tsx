import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, UserPlus, Crown } from 'lucide-react';

/**
 * EngagementEvent represents a stream engagement notification
 * Types: gift, join, top_fan
 */
export interface EngagementEvent {
  id: string;
  type: 'gift' | 'join' | 'top_fan';
  username: string;
  giftName?: string;
  giftImage?: string;
  timestamp: number;
}

interface EngagementPopupProps {
  events: EngagementEvent[];
  onDismiss: (eventId: string) => void;
}

/**
 * Auto-dismiss duration in milliseconds (3-5 seconds as per requirements)
 * Using 4 seconds as a middle ground
 */
const AUTO_DISMISS_DURATION = 4000;

/**
 * Maximum number of popups to show simultaneously
 */
const MAX_VISIBLE_POPUPS = 3;

/**
 * SingleEngagementPopup Component
 * 
 * Displays a single engagement notification with animation.
 * Auto-dismisses after the configured duration.
 */
function SingleEngagementPopup({
  event,
  onDismiss,
}: {
  event: EngagementEvent;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, AUTO_DISMISS_DURATION);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getIcon = () => {
    switch (event.type) {
      case 'gift':
        return <Gift className="w-5 h-5 text-yellow-400" />;
      case 'join':
        return <UserPlus className="w-5 h-5 text-green-400" />;
      case 'top_fan':
        return <Crown className="w-5 h-5 text-purple-400" />;
    }
  };

  const getBackgroundGradient = () => {
    switch (event.type) {
      case 'gift':
        return 'from-yellow-600/90 to-orange-600/90';
      case 'join':
        return 'from-green-600/90 to-emerald-600/90';
      case 'top_fan':
        return 'from-purple-600/90 to-pink-600/90';
    }
  };

  const getMessage = () => {
    switch (event.type) {
      case 'gift':
        return (
          <>
            <span className="font-bold">{event.username}</span>
            <span className="mx-1">sent a gift</span>
            {event.giftName && (
              <span className="font-semibold text-yellow-200">{event.giftName}</span>
            )}
            <span className="ml-1">🎁</span>
          </>
        );
      case 'join':
        return (
          <>
            <span className="font-bold">{event.username}</span>
            <span className="ml-1">joined the stream</span>
          </>
        );
      case 'top_fan':
        return (
          <>
            <span className="mr-1">Top Fan of the Week:</span>
            <span className="font-bold">{event.username}</span>
            <span className="ml-1">👑</span>
          </>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ 
        duration: 0.3, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      className={`
        bg-gradient-to-r ${getBackgroundGradient()}
        rounded-lg px-4 py-3 shadow-2xl backdrop-blur-sm
        flex items-center gap-3 min-w-[200px] max-w-[320px]
      `}
    >
      {/* Icon or Gift Image */}
      <div className="flex-shrink-0">
        {event.type === 'gift' && event.giftImage ? (
          <img
            src={event.giftImage}
            alt={event.giftName || 'Gift'}
            className="w-8 h-8 object-contain drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = '🎁';
                parent.style.fontSize = '1.5rem';
              }
            }}
          />
        ) : (
          getIcon()
        )}
      </div>

      {/* Message */}
      <div className="flex-1 text-white text-sm">
        {getMessage()}
      </div>
    </motion.div>
  );
}

/**
 * EngagementPopup Component
 * 
 * Displays animated notifications for stream events (gifts, joins, top fan).
 * Implements auto-dismiss after 3-5 seconds and supports queue for multiple
 * simultaneous events displayed in FIFO order.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export function EngagementPopup({ events, onDismiss }: EngagementPopupProps) {
  // Track which events are currently visible (for queue management)
  const [visibleEventIds, setVisibleEventIds] = useState<Set<string>>(new Set());

  // Add new events to visible set when they arrive
  useEffect(() => {
    const newEventIds = events
      .filter(e => !visibleEventIds.has(e.id))
      .map(e => e.id);
    
    if (newEventIds.length > 0) {
      setVisibleEventIds(prev => {
        const updated = new Set(prev);
        newEventIds.forEach(id => updated.add(id));
        return updated;
      });
    }
  }, [events, visibleEventIds]);

  const handleDismiss = useCallback((eventId: string) => {
    setVisibleEventIds(prev => {
      const updated = new Set(prev);
      updated.delete(eventId);
      return updated;
    });
    onDismiss(eventId);
  }, [onDismiss]);

  // Get visible events sorted by timestamp (FIFO order)
  // Only show up to MAX_VISIBLE_POPUPS at a time
  const visibleEvents = events
    .filter(e => visibleEventIds.has(e.id))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, MAX_VISIBLE_POPUPS);

  return (
    <div 
      className="fixed top-20 right-4 z-50 pointer-events-none"
      aria-live="polite"
      aria-label="Stream engagement notifications"
    >
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleEvents.map((event) => (
            <SingleEngagementPopup
              key={event.id}
              event={event}
              onDismiss={() => handleDismiss(event.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Hook for managing engagement events queue
 * Provides methods to add events and handles cleanup
 */
export function useEngagementEvents() {
  const [events, setEvents] = useState<EngagementEvent[]>([]);

  const addEvent = useCallback((event: Omit<EngagementEvent, 'id' | 'timestamp'>) => {
    const newEvent: EngagementEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    setEvents(prev => [...prev, newEvent]);
  }, []);

  const dismissEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  const clearAll = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    addEvent,
    dismissEvent,
    clearAll,
  };
}

export default EngagementPopup;
