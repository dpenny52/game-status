/**
 * useRelativeTime Hook
 *
 * A React hook that returns a formatted relative time string that
 * updates periodically without requiring a full page refresh.
 *
 * @module useRelativeTime
 */
import { useState, useEffect } from "react";
import { formatTime, shouldUseRelative, minutesSince } from "../utils/timeFormat";

/**
 * Update interval based on how old the timestamp is.
 *
 * - < 1 minute old: update every 10 seconds
 * - < 1 hour old: update every 30 seconds
 * - < 24 hours old: update every 60 seconds
 * - >= 24 hours old: no updates (absolute time doesn't change)
 */
function getUpdateInterval(timestamp: number): number | null {
  const minutes = minutesSince(timestamp);

  if (!shouldUseRelative(timestamp)) {
    // Absolute time - no need to update
    return null;
  }

  if (minutes < 1) {
    return 10000; // 10 seconds
  }

  if (minutes < 60) {
    return 30000; // 30 seconds
  }

  return 60000; // 1 minute
}

/**
 * Hook that returns a formatted time string that updates automatically.
 *
 * For recent timestamps (< 24 hours), returns relative time that updates
 * periodically. For older timestamps, returns absolute time that doesn't update.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string that updates automatically
 *
 * @example
 * ```tsx
 * function LastUpdated({ timestamp }) {
 *   const timeAgo = useRelativeTime(timestamp);
 *   return <span>Last updated: {timeAgo}</span>;
 * }
 * ```
 */
export function useRelativeTime(timestamp: number | null | undefined): string {
  const [formattedTime, setFormattedTime] = useState<string>(() =>
    timestamp ? formatTime(timestamp) : "Never"
  );

  useEffect(() => {
    if (!timestamp) {
      setFormattedTime("Never");
      return;
    }

    // Initial format
    setFormattedTime(formatTime(timestamp));

    const updateInterval = getUpdateInterval(timestamp);

    if (updateInterval === null) {
      // Absolute time - no need for interval
      return;
    }

    // Set up interval for periodic updates
    const intervalId = setInterval(() => {
      setFormattedTime(formatTime(timestamp));

      // Check if we should switch to a longer interval or stop
      const newInterval = getUpdateInterval(timestamp);
      if (newInterval === null || newInterval > updateInterval) {
        clearInterval(intervalId);
        // If we should continue with a longer interval, set up new interval
        if (newInterval !== null) {
          const newIntervalId = setInterval(() => {
            setFormattedTime(formatTime(timestamp));
          }, newInterval);

          // Store new interval ID for cleanup
          (window as unknown as { __timeIntervalId?: ReturnType<typeof setInterval> }).__timeIntervalId =
            newIntervalId;
        }
      }
    }, updateInterval);

    // Cleanup on unmount or when timestamp changes
    return () => {
      clearInterval(intervalId);
      const storedId = (window as unknown as { __timeIntervalId?: ReturnType<typeof setInterval> })
        .__timeIntervalId;
      if (storedId) {
        clearInterval(storedId);
      }
    };
  }, [timestamp]);

  return formattedTime;
}

export default useRelativeTime;
