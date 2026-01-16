/**
 * Error Logging Utilities
 *
 * Provides structured logging utilities for the server status fetching service.
 * Uses Convex console logging for debugging visibility.
 *
 * @module lib/logger
 */

import type { Platform } from "../schema";

/**
 * Log level enumeration for categorizing log messages.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Structured error log entry for API errors.
 */
export interface ApiErrorLogEntry {
  /** Log level */
  level: LogLevel;
  /** Publisher/platform name */
  publisher: Platform;
  /** API endpoint that was called */
  endpoint: string;
  /** HTTP status code (if available) */
  statusCode: number | null;
  /** Error message */
  message: string;
  /** Timestamp of the error */
  timestamp: number;
  /** Number of consecutive failures for this publisher */
  consecutiveFailures: number;
  /** Current retry attempt number */
  attemptNumber: number;
}

/**
 * Logs an API error with structured data.
 * Uses console.error for visibility in Convex dashboard.
 *
 * @param entry - The structured error log entry
 */
export function logApiError(entry: ApiErrorLogEntry): void {
  const formattedTimestamp = new Date(entry.timestamp).toISOString();

  console.error(
    `[${entry.level.toUpperCase()}] [${formattedTimestamp}] ` +
      `Publisher: ${entry.publisher} | ` +
      `Endpoint: ${entry.endpoint} | ` +
      `Status: ${entry.statusCode ?? "N/A"} | ` +
      `Attempt: ${entry.attemptNumber}/${5} | ` +
      `Consecutive Failures: ${entry.consecutiveFailures} | ` +
      `Message: ${entry.message}`
  );
}

/**
 * Logs a warning when skipping a publisher due to missing credentials.
 *
 * @param publisher - The publisher being skipped
 * @param missingCredentials - List of missing credential names
 */
export function logMissingCredentials(
  publisher: Platform,
  missingCredentials: string[]
): void {
  console.warn(
    `[WARN] Skipping publisher ${publisher}: ` +
      `Missing credentials: ${missingCredentials.join(", ")}`
  );
}

/**
 * Logs successful status fetch for a publisher.
 *
 * @param publisher - The publisher that was fetched
 * @param region - The region that was fetched (if applicable)
 * @param status - The status that was determined
 */
export function logFetchSuccess(
  publisher: Platform,
  region: string | null,
  status: string
): void {
  const regionInfo = region ? ` (${region})` : "";
  console.log(
    `[INFO] Successfully fetched status for ${publisher}${regionInfo}: ${status}`
  );
}

/**
 * Logs retry scheduling information.
 *
 * @param publisher - The publisher that will be retried
 * @param delayMs - The delay in milliseconds before retry
 * @param attemptNumber - The upcoming attempt number
 */
export function logRetryScheduled(
  publisher: Platform,
  delayMs: number,
  attemptNumber: number
): void {
  console.log(
    `[INFO] Scheduling retry for ${publisher} in ${delayMs}ms (attempt ${attemptNumber}/5)`
  );
}

/**
 * Logs when maximum retry attempts have been exhausted.
 *
 * @param publisher - The publisher that exhausted retries
 */
export function logRetryExhausted(publisher: Platform): void {
  console.error(
    `[ERROR] Maximum retry attempts exhausted for ${publisher}. ` +
      `Will try again in next polling cycle.`
  );
}

/**
 * Logs the start of a polling cycle.
 */
export function logPollingCycleStart(): void {
  console.log(
    `[INFO] Starting status polling cycle at ${new Date().toISOString()}`
  );
}

/**
 * Logs the completion of a polling cycle.
 *
 * @param successCount - Number of successful publisher fetches
 * @param failureCount - Number of failed publisher fetches
 * @param durationMs - Duration of the polling cycle in milliseconds
 */
export function logPollingCycleComplete(
  successCount: number,
  failureCount: number,
  durationMs: number
): void {
  console.log(
    `[INFO] Polling cycle complete: ${successCount} succeeded, ` +
      `${failureCount} failed, duration: ${durationMs}ms`
  );
}
