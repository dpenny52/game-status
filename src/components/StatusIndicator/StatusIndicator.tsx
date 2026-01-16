/**
 * StatusIndicator Component
 *
 * A reusable status indicator with five visual states for game server status.
 * Includes text labels alongside icons for accessibility.
 *
 * @module StatusIndicator
 */
import React from "react";
import "./StatusIndicator.css";

/**
 * Status type representing the server state.
 */
export type Status = "online" | "offline" | "degraded" | "maintenance" | "unknown";

/**
 * Props for the StatusIndicator component.
 */
export interface StatusIndicatorProps {
  /** The current server status */
  status: Status;
  /** Whether to show the text label (default: true) */
  showLabel?: boolean;
  /** Size variant (default: "medium") */
  size?: "small" | "medium" | "large";
  /** Additional CSS class names */
  className?: string;
}

/**
 * Status configuration for visual display.
 */
interface StatusConfig {
  label: string;
  ariaLabel: string;
  icon: React.ReactNode;
}

/**
 * Configuration for each status type.
 */
const STATUS_CONFIG: Record<Status, StatusConfig> = {
  online: {
    label: "Online",
    ariaLabel: "Server status: Online - Operational",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="status-icon"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path
          d="M9 12l2 2 4-4"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  offline: {
    label: "Offline",
    ariaLabel: "Server status: Offline - Service unavailable",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="status-icon"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path
          d="M15 9l-6 6M9 9l6 6"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  degraded: {
    label: "Degraded",
    ariaLabel: "Server status: Degraded - Partial service issues",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="status-icon"
        aria-hidden="true"
      >
        <path d="M12 2L2 22h20L12 2z" />
        <path
          d="M12 9v4M12 17h.01"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  maintenance: {
    label: "Maintenance",
    ariaLabel: "Server status: Maintenance - Scheduled downtime",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="status-icon"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          transform="scale(0.5) translate(12, 12)"
        />
      </svg>
    ),
  },
  unknown: {
    label: "Unknown",
    ariaLabel: "Server status: Unknown - Status not available",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="status-icon"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path
          d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
};

/**
 * StatusIndicator displays a visual indicator for game server status.
 *
 * @example
 * ```tsx
 * <StatusIndicator status="online" />
 * <StatusIndicator status="offline" showLabel={false} size="small" />
 * ```
 */
export function StatusIndicator({
  status,
  showLabel = true,
  size = "medium",
  className = "",
}: StatusIndicatorProps): JSX.Element {
  const config = STATUS_CONFIG[status];

  return (
    <div
      data-testid="status-indicator"
      data-status={status}
      role="status"
      aria-label={config.ariaLabel}
      className={`status-indicator status-${status} status-size-${size} ${className}`.trim()}
    >
      <span className="status-icon-wrapper">{config.icon}</span>
      {showLabel && <span className="status-label">{config.label}</span>}
    </div>
  );
}

export default StatusIndicator;
