/**
 * Timestamp Formatting Utilities
 *
 * Utility functions for formatting timestamps in relative and absolute formats
 * for display on the dashboard.
 *
 * @module timeFormat
 */

/**
 * Time constants in milliseconds.
 */
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Threshold for using relative vs absolute time (24 hours).
 */
const RELATIVE_THRESHOLD = DAY;

/**
 * Formats a timestamp as a relative time string.
 *
 * Examples:
 * - "just now" (< 1 minute)
 * - "2 minutes ago"
 * - "1 hour ago"
 * - "23 hours ago"
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  // Less than 1 minute
  if (diff < MINUTE) {
    return "just now";
  }

  // Less than 1 hour - show minutes
  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  // Less than 24 hours - show hours
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  // More than 24 hours - show days
  const days = Math.floor(diff / DAY);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

/**
 * Formats a timestamp as an absolute date/time string with timezone.
 *
 * Examples:
 * - "Jan 14, 2:30 PM"
 * - "Dec 25, 10:15 AM"
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted absolute time string with timezone context
 */
export function formatAbsoluteTime(timestamp: number): string {
  const date = new Date(timestamp);

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  return date.toLocaleString("en-US", options);
}

/**
 * Determines whether to use relative or absolute time formatting.
 *
 * Uses relative time for updates within the last 24 hours,
 * absolute time for older updates.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns true if relative time should be used, false for absolute
 */
export function shouldUseRelative(timestamp: number): boolean {
  const now = Date.now();
  const diff = now - timestamp;
  return diff < RELATIVE_THRESHOLD;
}

/**
 * Formats a timestamp using the appropriate format based on age.
 *
 * Uses relative time for recent updates, absolute time for older ones.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
export function formatTime(timestamp: number): string {
  if (shouldUseRelative(timestamp)) {
    return formatRelativeTime(timestamp);
  }
  return formatAbsoluteTime(timestamp);
}

/**
 * Returns the number of minutes since the given timestamp.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Number of minutes since the timestamp
 */
export function minutesSince(timestamp: number): number {
  const now = Date.now();
  return Math.floor((now - timestamp) / MINUTE);
}

/**
 * Checks if a timestamp is considered stale (older than threshold).
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param thresholdMinutes - Threshold in minutes (default: 5)
 * @returns true if the timestamp is older than the threshold
 */
export function isStale(timestamp: number, thresholdMinutes: number = 5): boolean {
  return minutesSince(timestamp) > thresholdMinutes;
}
