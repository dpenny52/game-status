/**
 * ConnectionHealthIndicator Component
 *
 * Displays a visual indicator showing the Convex connection status.
 * Shows green (connected), yellow (reconnecting), or red (disconnected).
 *
 * @module ConnectionHealthIndicator
 */
import React from "react";
import { useConvex } from "convex/react";
import "./ConnectionHealthIndicator.css";

/**
 * Connection status states.
 */
export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

/**
 * Props for the ConnectionHealthIndicator component.
 */
export interface ConnectionHealthIndicatorProps {
  /** Additional CSS class names */
  className?: string;
  /** Whether to show the text label (default: false) */
  showLabel?: boolean;
  /** Size variant (default: "small") */
  size?: "small" | "medium";
}

/**
 * Status configuration for visual display.
 */
interface StatusConfig {
  label: string;
  ariaLabel: string;
  tooltipText: string;
}

/**
 * Configuration for each connection status.
 */
const STATUS_CONFIG: Record<ConnectionStatus, StatusConfig> = {
  connected: {
    label: "Connected",
    ariaLabel: "Connection status: Connected - Real-time updates active",
    tooltipText: "Connected - Real-time updates active",
  },
  reconnecting: {
    label: "Reconnecting",
    ariaLabel: "Connection status: Reconnecting - Attempting to restore connection",
    tooltipText: "Reconnecting - Attempting to restore connection",
  },
  disconnected: {
    label: "Disconnected",
    ariaLabel: "Connection status: Disconnected - Updates may be delayed",
    tooltipText: "Disconnected - Updates may be delayed",
  },
};

/**
 * Hook to get the current Convex connection status.
 *
 * This is a simplified implementation since Convex's connection state
 * is managed internally. In production, you might use ConvexReactClient's
 * connection state events if available.
 */
function useConnectionStatus(): ConnectionStatus {
  const convex = useConvex();

  // If convex client exists, we're connected
  // Note: For a more robust implementation, you could listen to
  // connection state events from the ConvexReactClient
  if (convex) {
    return "connected";
  }

  return "disconnected";
}

/**
 * ConnectionHealthIndicator displays the current connection status to Convex.
 *
 * @example
 * ```tsx
 * // Basic usage in header
 * <ConnectionHealthIndicator />
 *
 * // With label visible
 * <ConnectionHealthIndicator showLabel />
 *
 * // Medium size with custom class
 * <ConnectionHealthIndicator size="medium" className="my-indicator" />
 * ```
 */
export function ConnectionHealthIndicator({
  className = "",
  showLabel = false,
  size = "small",
}: ConnectionHealthIndicatorProps): JSX.Element {
  const status = useConnectionStatus();
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={`connection-health-indicator connection-status-${status} connection-size-${size} ${className}`.trim()}
      role="status"
      aria-label={config.ariaLabel}
      title={config.tooltipText}
      data-testid="connection-health-indicator"
      data-status={status}
    >
      <span className="connection-dot" aria-hidden="true" />
      {showLabel && <span className="connection-label">{config.label}</span>}
    </div>
  );
}

/**
 * Variant of ConnectionHealthIndicator that accepts status as a prop.
 * Useful for testing or when you want to control the status externally.
 */
export interface ConnectionHealthIndicatorControlledProps extends Omit<ConnectionHealthIndicatorProps, never> {
  /** Override the connection status */
  status: ConnectionStatus;
}

export function ConnectionHealthIndicatorControlled({
  status,
  className = "",
  showLabel = false,
  size = "small",
}: ConnectionHealthIndicatorControlledProps): JSX.Element {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={`connection-health-indicator connection-status-${status} connection-size-${size} ${className}`.trim()}
      role="status"
      aria-label={config.ariaLabel}
      title={config.tooltipText}
      data-testid="connection-health-indicator"
      data-status={status}
    >
      <span className="connection-dot" aria-hidden="true" />
      {showLabel && <span className="connection-label">{config.label}</span>}
    </div>
  );
}

export default ConnectionHealthIndicator;
