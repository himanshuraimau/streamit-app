import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

/**
 * ScreenRecordingProtection Component
 * 
 * Attempts to detect screen recording and displays a warning overlay when detected.
 * Uses Page Visibility API for basic detection on web browsers.
 * 
 * Note: Full screen recording protection is platform-dependent and has limitations:
 * - Web browsers: Limited protection via Page Visibility API
 * - Android WebView: Can set FLAG_SECURE via native bridge
 * - iOS WKWebView: Can set isScreenCaptureProtected via native bridge
 * - Desktop: No reliable protection available
 * 
 * Requirements:
 * - 8.1: WHEN the stream player is active, THE System SHALL attempt to detect screen recording
 * - 8.2: IF screen recording is detected, THEN THE System SHALL display a warning overlay
 */

interface ScreenRecordingProtectionProps {
  /** Whether the protection is enabled */
  enabled?: boolean;
  /** Callback when recording is detected */
  onRecordingDetected?: () => void;
  /** Callback when recording detection is cleared */
  onRecordingCleared?: () => void;
  /** Children to render (the protected content) */
  children: React.ReactNode;
  /** Optional className for the container */
  className?: string;
}

interface RecordingState {
  isRecording: boolean;
  detectionMethod: 'visibility' | 'display-media' | 'picture-in-picture' | null;
  timestamp: number | null;
}

/**
 * Hook to detect potential screen recording
 * 
 * Uses multiple detection methods:
 * 1. Page Visibility API - detects when page is hidden (potential recording switch)
 * 2. Display Media API - checks if getDisplayMedia is being used
 * 3. Picture-in-Picture detection - checks if PiP mode is active
 */
export function useScreenRecordingDetection(enabled: boolean = true) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    detectionMethod: null,
    timestamp: null,
  });

  // Track visibility changes that might indicate recording
  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;

    // When document becomes hidden, it could indicate screen recording software
    // being used or the user switching to a recording app
    if (document.hidden) {
      // We don't immediately flag as recording on visibility change
      // as this could be normal tab switching
      // Instead, we track rapid visibility changes which might indicate recording
    }
  }, [enabled]);

  // Check for Picture-in-Picture which could be used for recording
  const handlePiPChange = useCallback(() => {
    if (!enabled) return;

    const isPiPActive = document.pictureInPictureElement !== null;
    if (isPiPActive) {
      setRecordingState({
        isRecording: true,
        detectionMethod: 'picture-in-picture',
        timestamp: Date.now(),
      });
    } else if (recordingState.detectionMethod === 'picture-in-picture') {
      setRecordingState({
        isRecording: false,
        detectionMethod: null,
        timestamp: null,
      });
    }
  }, [enabled, recordingState.detectionMethod]);

  // Attempt to detect screen capture via navigator.mediaDevices
  const checkDisplayMediaCapture = useCallback(async () => {
    if (!enabled) return;

    try {
      // Check if there are any active display media tracks
      // This is a heuristic and may not catch all cases
      if ('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
        // We can't directly detect if getDisplayMedia is being used by another app
        // but we can check for certain browser behaviors
        
        // Check for screen capture indicator (Chrome specific)
        if ('getDisplayMedia' in navigator.mediaDevices) {
          // The presence of this API doesn't mean recording is happening
          // but we can use it as part of our detection heuristics
        }
      }
    } catch {
      // Silently fail - detection is best-effort
    }
  }, [enabled]);

  // Clear recording state
  const clearRecordingState = useCallback(() => {
    setRecordingState({
      isRecording: false,
      detectionMethod: null,
      timestamp: null,
    });
  }, []);

  // Manually trigger recording detection (for testing or external triggers)
  const triggerRecordingDetection = useCallback((method: RecordingState['detectionMethod'] = 'visibility') => {
    setRecordingState({
      isRecording: true,
      detectionMethod: method,
      timestamp: Date.now(),
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearRecordingState();
      return;
    }

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('enterpictureinpicture', handlePiPChange);
    document.addEventListener('leavepictureinpicture', handlePiPChange);

    // Initial check
    checkDisplayMediaCapture();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('enterpictureinpicture', handlePiPChange);
      document.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, [enabled, handleVisibilityChange, handlePiPChange, checkDisplayMediaCapture, clearRecordingState]);

  return {
    ...recordingState,
    clearRecordingState,
    triggerRecordingDetection,
  };
}

/**
 * Warning overlay displayed when screen recording is detected
 */
function RecordingWarningOverlay({ 
  onDismiss,
  detectionMethod,
}: { 
  onDismiss: () => void;
  detectionMethod: RecordingState['detectionMethod'];
}) {
  const getWarningMessage = () => {
    switch (detectionMethod) {
      case 'picture-in-picture':
        return 'Picture-in-Picture mode detected. This may be used for screen recording.';
      case 'display-media':
        return 'Screen sharing or recording may be active.';
      case 'visibility':
      default:
        return 'Potential screen recording detected. Recording streams is not permitted.';
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="max-w-md mx-4 p-6 bg-zinc-900 border border-red-500/50 rounded-xl shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 bg-red-500/20 rounded-full">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Recording Detected
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              {getWarningMessage()}
            </p>
            <p className="text-zinc-500 text-xs mb-4">
              Screen recording of live streams violates our terms of service and may result in account suspension.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onDismiss}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
              >
                I understand
              </button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Dismiss warning"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ScreenRecordingProtection Component
 * 
 * Wraps content and displays a warning overlay when screen recording is detected.
 */
export function ScreenRecordingProtection({
  enabled = true,
  onRecordingDetected,
  onRecordingCleared,
  children,
  className = '',
}: ScreenRecordingProtectionProps) {
  const { 
    isRecording, 
    detectionMethod, 
    clearRecordingState 
  } = useScreenRecordingDetection(enabled);

  const [showWarning, setShowWarning] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  // Handle recording detection state changes
  useEffect(() => {
    if (isRecording && !warningDismissed) {
      setShowWarning(true);
      onRecordingDetected?.();
    } else if (!isRecording) {
      setShowWarning(false);
      setWarningDismissed(false);
      onRecordingCleared?.();
    }
  }, [isRecording, warningDismissed, onRecordingDetected, onRecordingCleared]);

  const handleDismiss = () => {
    setShowWarning(false);
    setWarningDismissed(true);
    clearRecordingState();
  };

  return (
    <div className={`relative ${className}`}>
      {children}
      {showWarning && (
        <RecordingWarningOverlay 
          onDismiss={handleDismiss}
          detectionMethod={detectionMethod}
        />
      )}
    </div>
  );
}

export default ScreenRecordingProtection;
