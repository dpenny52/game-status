/**
 * Status Transition Detection Utilities
 *
 * Provides functions for detecting status transitions that should trigger
 * alert notifications. Only offline-to-online transitions trigger alerts.
 *
 * @module lib/transitionDetection
 */

import type { Status } from "../schema";

/**
 * Determines if a status transition should trigger an alert notification.
 *
 * Only offline-to-online transitions trigger alerts. All other transitions
 * (including degraded/maintenance/unknown to online) are ignored.
 *
 * @param previousStatus - The previous status of the game+region
 * @param newStatus - The new status of the game+region
 * @returns True if the transition should trigger an alert
 *
 * @example
 * ```typescript
 * // Trigger alert for offline -> online
 * shouldTriggerAlert("offline", "online"); // true
 *
 * // No alert for other transitions
 * shouldTriggerAlert("maintenance", "online"); // false
 * shouldTriggerAlert("online", "offline"); // false
 * ```
 */
export function shouldTriggerAlert(
  previousStatus: Status,
  newStatus: Status
): boolean {
  // Only trigger alerts for offline -> online transitions
  return previousStatus === "offline" && newStatus === "online";
}

/**
 * Constants for transition detection configuration.
 */
export const TRANSITION_CONSTANTS = {
  /** The only previous status that triggers alerts when transitioning to online */
  ALERT_TRIGGER_FROM_STATUS: "offline" as Status,
  /** The target status that triggers alerts (when coming from offline) */
  ALERT_TRIGGER_TO_STATUS: "online" as Status,
} as const;
