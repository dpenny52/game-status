/**
 * useStaleData Hook
 *
 * Determines if data is stale based on a timestamp and threshold.
 * Updates periodically to detect staleness over time.
 *
 * @module useStaleData
 */
import { useState, useEffect } from "react";
import { isStale } from "../utils/timeFormat";

/**
 * Default stale threshold in minutes.
 * Data older than this threshold is considered stale.
 */
const DEFAULT_STALE_THRESHOLD_MINUTES = 10;

/**
 * Update interval for checking staleness (in milliseconds).
 * Checks every 30 seconds to detect when data becomes stale.
 */
const STALE_CHECK_INTERVAL = 30000;

/**
 * Options for useStaleData hook.
 */
export interface UseStaleDataOptions {
  /** Threshold in minutes after which data is considered stale (default: 10) */
  thresholdMinutes?: number;
}

/**
 * Return type for useStaleData hook.
 */
export interface UseStaleDataResult {
  /** Whether the data is currently stale */
  isStale: boolean;
  /** Minutes since the timestamp (null if timestamp is null/undefined) */
  minutesOld: number | null;
}

/**
 * Hook that determines if data is stale based on timestamp age.
 *
 * The hook periodically re-evaluates staleness to detect when
 * fresh data becomes stale over time without new updates.
 *
 * @param lastCheckedAt - Timestamp in milliseconds of last data update
 * @param options - Configuration options
 * @returns Object with isStale flag and minutesOld
 *
 * @example
 * ```tsx
 * function GameCard({ lastCheckedAt }) {
 *   const { isStale } = useStaleData(lastCheckedAt);
 *
 *   return (
 *     <div className={isStale ? 'stale-data-warning' : ''}>
 *       ...
 *     </div>
 *   );
 * }
 * ```
 */
export function useStaleData(
  lastCheckedAt: number | null | undefined,
  options: UseStaleDataOptions = {}
): UseStaleDataResult {
  const { thresholdMinutes = DEFAULT_STALE_THRESHOLD_MINUTES } = options;

  // Calculate initial stale state
  const calculateStaleState = (): UseStaleDataResult => {
    if (lastCheckedAt == null) {
      return { isStale: false, minutesOld: null };
    }

    const stale = isStale(lastCheckedAt, thresholdMinutes);
    const minutesOld = Math.floor((Date.now() - lastCheckedAt) / 60000);

    return { isStale: stale, minutesOld };
  };

  const [staleState, setStaleState] = useState<UseStaleDataResult>(calculateStaleState);

  useEffect(() => {
    // Recalculate immediately when timestamp changes
    setStaleState(calculateStaleState());

    // If no timestamp, no need to set up interval
    if (lastCheckedAt == null) {
      return;
    }

    // Set up interval to periodically check for staleness
    const intervalId = setInterval(() => {
      setStaleState(calculateStaleState());
    }, STALE_CHECK_INTERVAL);

    // Cleanup on unmount or when timestamp changes
    return () => {
      clearInterval(intervalId);
    };
  }, [lastCheckedAt, thresholdMinutes]);

  return staleState;
}

export default useStaleData;
