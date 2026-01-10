/**
 * Touch Device Detection Utility
 * 
 * Provides functions for detecting touch-enabled devices.
 * Used to conditionally enable swipe gestures on touch devices only.
 * 
 * Requirements: 5.5 - THE System SHALL only enable swipe gestures on touch-enabled devices
 */

/**
 * Checks if the current device supports touch input
 * 
 * Detection methods:
 * 1. Check for 'ontouchstart' in window object
 * 2. Check navigator.maxTouchPoints > 0
 * 3. Check for DocumentTouch interface (legacy)
 * 
 * @returns true if the device supports touch input, false otherwise
 */
export function isTouchDevice(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Method 1: Check for ontouchstart event support
  if ('ontouchstart' in window) {
    return true;
  }

  // Method 2: Check navigator.maxTouchPoints
  if (navigator.maxTouchPoints > 0) {
    return true;
  }

  // Method 3: Check for legacy msMaxTouchPoints (IE/Edge)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((navigator as any).msMaxTouchPoints > 0) {
    return true;
  }

  return false;
}

/**
 * Hook-friendly version that can be used in React components
 * Returns a stable reference to avoid unnecessary re-renders
 */
let cachedIsTouchDevice: boolean | null = null;

export function getIsTouchDevice(): boolean {
  if (cachedIsTouchDevice === null) {
    cachedIsTouchDevice = isTouchDevice();
  }
  return cachedIsTouchDevice;
}

/**
 * Resets the cached touch device detection
 * Useful for testing purposes
 */
export function resetTouchDeviceCache(): void {
  cachedIsTouchDevice = null;
}
