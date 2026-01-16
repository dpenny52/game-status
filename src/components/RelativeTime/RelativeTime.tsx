/**
 * RelativeTime Component
 *
 * A reusable component that displays human-readable relative timestamps
 * that auto-update periodically without page refresh.
 *
 * @module RelativeTime
 */
import React from "react";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import "./RelativeTime.css";

/**
 * Props for the RelativeTime component.
 */
export interface RelativeTimeProps {
  /** Unix timestamp in milliseconds */
  timestamp: number | null | undefined;
  /** Fallback text when timestamp is null/undefined (default: "Never") */
  fallback?: string;
  /** Additional CSS class names */
  className?: string;
  /** Data test ID for testing */
  testId?: string;
}

/**
 * RelativeTime displays a human-readable timestamp that updates automatically.
 *
 * For recent timestamps (< 24 hours), displays relative time that updates
 * periodically (e.g., "just now", "2 minutes ago", "1 hour ago").
 * For older timestamps (>= 24 hours), displays absolute time (e.g., "Jan 14, 2:30 PM").
 *
 * @example
 * ```tsx
 * // Basic usage
 * <RelativeTime timestamp={Date.now() - 120000} />
 * // Output: "2 minutes ago"
 *
 * // With custom fallback
 * <RelativeTime timestamp={null} fallback="Not available" />
 * // Output: "Not available"
 *
 * // With custom class
 * <RelativeTime timestamp={Date.now()} className="my-timestamp" />
 * ```
 */
export function RelativeTime({
  timestamp,
  fallback = "Never",
  className = "",
  testId = "relative-time",
}: RelativeTimeProps): JSX.Element {
  // Use the existing hook which handles auto-updating
  const formattedTime = useRelativeTime(timestamp);

  // If timestamp is null/undefined, the hook returns "Never" by default
  // but we allow custom fallback
  const displayTime = timestamp == null ? fallback : formattedTime;

  return (
    <time
      className={`relative-time ${className}`.trim()}
      dateTime={timestamp ? new Date(timestamp).toISOString() : undefined}
      data-testid={testId}
    >
      {displayTime}
    </time>
  );
}

export default RelativeTime;
