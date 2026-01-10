import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the duration from a start timestamp to now and formats it as "HH:MM:SS"
 * 
 * @param startedAt - The start timestamp (Date object, ISO string, or null/undefined)
 * @returns Formatted duration string in "HH:MM:SS" format, or "00:00:00" for invalid inputs
 * 
 * Requirements: 1.1, 1.3 - Display live duration timer in format "HH:MM:SS"
 */
export function formatDuration(startedAt: Date | string | null | undefined): string {
  // Handle null/undefined startedAt
  if (!startedAt) {
    return "00:00:00";
  }

  // Parse the startedAt timestamp
  const startTime = startedAt instanceof Date ? startedAt : new Date(startedAt);

  // Handle invalid date
  if (isNaN(startTime.getTime())) {
    return "00:00:00";
  }

  const now = new Date();
  
  // Calculate duration in milliseconds
  let durationMs = now.getTime() - startTime.getTime();

  // Handle future dates (negative duration) - return "00:00:00"
  if (durationMs < 0) {
    return "00:00:00";
  }

  // Convert to seconds
  const totalSeconds = Math.floor(durationMs / 1000);

  // Calculate hours, minutes, seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Format with leading zeros
  const pad = (num: number): string => num.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Calculates the duration between two timestamps and formats it as "HH:MM:SS"
 * Useful for calculating duration with a specific end time (e.g., for ended streams)
 * 
 * @param startedAt - The start timestamp
 * @param endedAt - The end timestamp (defaults to now if not provided)
 * @returns Formatted duration string in "HH:MM:SS" format
 */
export function formatDurationBetween(
  startedAt: Date | string | null | undefined,
  endedAt?: Date | string | null
): string {
  // Handle null/undefined startedAt
  if (!startedAt) {
    return "00:00:00";
  }

  // Parse the startedAt timestamp
  const startTime = startedAt instanceof Date ? startedAt : new Date(startedAt);

  // Handle invalid start date
  if (isNaN(startTime.getTime())) {
    return "00:00:00";
  }

  // Parse the endedAt timestamp or use current time
  const endTime = endedAt 
    ? (endedAt instanceof Date ? endedAt : new Date(endedAt))
    : new Date();

  // Handle invalid end date
  if (isNaN(endTime.getTime())) {
    return "00:00:00";
  }

  // Calculate duration in milliseconds
  let durationMs = endTime.getTime() - startTime.getTime();

  // Handle negative duration (end before start)
  if (durationMs < 0) {
    return "00:00:00";
  }

  // Convert to seconds
  const totalSeconds = Math.floor(durationMs / 1000);

  // Calculate hours, minutes, seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Format with leading zeros
  const pad = (num: number): string => num.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
