import { useCallback, useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getIsTouchDevice } from '@/lib/touch-detection';
import { HeartBurstAnimation } from '@/components/payment/HeartBurstAnimation';

interface ImmersiveModeOverlayProps {
  /** Whether immersive mode is currently active */
  isActive: boolean;
  /** Callback when user exits immersive mode (swipe right) */
  onExit: () => void;
  /** Callback when user double-taps (triggers like action) */
  onDoubleTap: () => void;
  /** The video content to display in fullscreen */
  children: React.ReactNode;
  /** Optional class name for the overlay container */
  className?: string;
}

/**
 * ImmersiveModeOverlay Component
 * 
 * Provides a fullscreen video overlay with gesture support for mobile devices.
 * Hides all UI elements when active and supports swipe gestures for navigation.
 * 
 * Requirements:
 * - 5.1: WHEN a viewer swipes left on the stream, THE System SHALL enter immersive mode with fullscreen video
 * - 5.2: WHILE in immersive mode, THE System SHALL hide all UI elements (chat, controls, overlays)
 * - 5.3: WHEN a viewer swipes right in immersive mode, THE System SHALL return to normal view
 * - 5.4: WHEN a viewer double-taps in immersive mode, THE System SHALL trigger a like action with heart animation
 * - 5.5: THE System SHALL only enable swipe gestures on touch-enabled devices
 */
export function ImmersiveModeOverlay({
  isActive,
  onExit,
  onDoubleTap,
  children,
  className,
}: ImmersiveModeOverlayProps) {
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showExitHint, setShowExitHint] = useState(true);
  const lastTapRef = useRef<number>(0);
  const doubleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouchEnabled = getIsTouchDevice();

  // Hide exit hint after 3 seconds
  useEffect(() => {
    if (isActive) {
      setShowExitHint(true);
      const timer = setTimeout(() => {
        setShowExitHint(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  // Handle double-tap detection
  const handleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // ms

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
        doubleTapTimeoutRef.current = null;
      }
      setShowHeartAnimation(true);
      onDoubleTap();
    } else {
      // Single tap - wait to see if it becomes a double tap
      doubleTapTimeoutRef.current = setTimeout(() => {
        // Single tap action (could toggle controls visibility)
        doubleTapTimeoutRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }

    lastTapRef.current = now;
  }, [onDoubleTap]);

  // Handle heart animation completion
  const handleHeartAnimationComplete = useCallback(() => {
    setShowHeartAnimation(false);
  }, []);

  // Swipe handlers - only enabled on touch devices
  const swipeHandlers = useSwipeable({
    onSwipedRight: () => {
      if (isTouchEnabled) {
        onExit();
      }
    },
    trackMouse: false, // Only track touch events
    trackTouch: isTouchEnabled, // Only enable on touch devices
    delta: 50, // Minimum swipe distance
    preventScrollOnSwipe: true,
  });

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        onExit();
      }
    };

    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when in immersive mode
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isActive, onExit]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`fixed inset-0 z-50 bg-black ${className || ''}`}
          data-testid="immersive-mode-overlay"
          data-immersive-active="true"
          {...swipeHandlers}
          onClick={handleTap}
        >
          {/* Fullscreen video container */}
          <div className="w-full h-full flex items-center justify-center">
            {children}
          </div>

          {/* Exit button (always visible for accessibility) */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: showExitHint ? 1 : 0.3 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              e.stopPropagation();
              onExit();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Exit immersive mode"
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* Swipe hint for touch devices */}
          <AnimatePresence>
            {showExitHint && isTouchEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm"
              >
                Swipe right to exit • Double-tap to like
              </motion.div>
            )}
          </AnimatePresence>

          {/* Heart burst animation for double-tap */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <HeartBurstAnimation
              isActive={showHeartAnimation}
              onComplete={handleHeartAnimationComplete}
              particleCount={12}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook for managing immersive mode state
 * 
 * Provides a simple interface for entering/exiting immersive mode
 * and handling the like action from double-tap.
 */
export function useImmersiveMode() {
  const [isImmersive, setIsImmersive] = useState(false);

  const enterImmersiveMode = useCallback(() => {
    setIsImmersive(true);
  }, []);

  const exitImmersiveMode = useCallback(() => {
    setIsImmersive(false);
  }, []);

  const toggleImmersiveMode = useCallback(() => {
    setIsImmersive((prev) => !prev);
  }, []);

  return {
    isImmersive,
    enterImmersiveMode,
    exitImmersiveMode,
    toggleImmersiveMode,
  };
}

/**
 * Hook for detecting swipe left gesture to enter immersive mode
 * Only enabled on touch devices
 */
export function useSwipeToImmersive(onSwipeLeft: () => void) {
  const isTouchEnabled = getIsTouchDevice();

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (isTouchEnabled) {
        onSwipeLeft();
      }
    },
    trackMouse: false,
    trackTouch: isTouchEnabled,
    delta: 50,
  });

  return isTouchEnabled ? handlers : {};
}
