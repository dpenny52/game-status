/**
 * Exponential Backoff Retry Utilities
 *
 * Provides utilities for implementing exponential backoff retry logic
 * for external API calls in the server status fetching service.
 *
 * @module lib/retry
 */

import type { Platform } from "../schema";

/**
 * Maximum retry attempts per publisher per polling cycle.
 */
export const MAX_RETRY_ATTEMPTS = 5;

/**
 * Maximum backoff delay in milliseconds (16 seconds).
 */
export const MAX_BACKOFF_DELAY_MS = 16000;

/**
 * Base delay in milliseconds for exponential backoff (1 second).
 */
export const BASE_DELAY_MS = 1000;

/**
 * HTTP request timeout in milliseconds (30 seconds).
 */
export const HTTP_TIMEOUT_MS = 30000;

/**
 * Calculates the exponential backoff delay for a given retry attempt.
 *
 * Formula: Math.min(1000 * Math.pow(2, attempt), 16000)
 *
 * Attempt 0: 1000ms (1 second)
 * Attempt 1: 2000ms (2 seconds)
 * Attempt 2: 4000ms (4 seconds)
 * Attempt 3: 8000ms (8 seconds)
 * Attempt 4+: 16000ms (16 seconds, capped)
 *
 * @param attempt - The current retry attempt number (0-indexed)
 * @returns The delay in milliseconds before the next retry
 */
export function calculateBackoffDelay(attempt: number): number {
  return Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_BACKOFF_DELAY_MS);
}

/**
 * Determines if another retry attempt should be made.
 *
 * @param currentAttempt - The current attempt number (0-indexed)
 * @returns True if more retries are allowed, false otherwise
 */
export function shouldRetry(currentAttempt: number): boolean {
  return currentAttempt < MAX_RETRY_ATTEMPTS;
}

/**
 * Retry state tracker for managing retry counts per publisher.
 * Tracks consecutive failures for monitoring purposes.
 */
export interface RetryState {
  /** Current retry attempt count (0 = first attempt, not a retry) */
  attemptCount: number;
  /** Count of consecutive failures (for monitoring) */
  consecutiveFailures: number;
  /** Timestamp of last successful fetch (for monitoring) */
  lastSuccessAt: number | null;
  /** Timestamp of last failure (for error tracking) */
  lastFailureAt: number | null;
}

/**
 * Creates an initial retry state for a publisher.
 *
 * @returns A fresh retry state with all counters at zero
 */
export function createInitialRetryState(): RetryState {
  return {
    attemptCount: 0,
    consecutiveFailures: 0,
    lastSuccessAt: null,
    lastFailureAt: null,
  };
}

/**
 * Updates retry state after a successful fetch.
 * Resets attempt count and consecutive failures.
 *
 * @param state - The current retry state
 * @returns Updated retry state with reset counters
 */
export function onFetchSuccess(state: RetryState): RetryState {
  return {
    ...state,
    attemptCount: 0,
    consecutiveFailures: 0,
    lastSuccessAt: Date.now(),
  };
}

/**
 * Updates retry state after a failed fetch.
 * Increments failure counters for tracking and monitoring.
 *
 * @param state - The current retry state
 * @returns Updated retry state with incremented failure counters
 */
export function onFetchFailure(state: RetryState): RetryState {
  return {
    ...state,
    attemptCount: state.attemptCount + 1,
    consecutiveFailures: state.consecutiveFailures + 1,
    lastFailureAt: Date.now(),
  };
}

/**
 * In-memory retry state storage.
 * Note: In a production Convex environment, this would be stored in the database
 * for persistence across function invocations. For now, we track this in memory
 * within a single polling cycle.
 */
export type RetryStateMap = Map<Platform, RetryState>;

/**
 * Creates a new retry state map with initial states for all platforms.
 *
 * @returns A map with initial retry states for all supported platforms
 */
export function createRetryStateMap(): RetryStateMap {
  const map = new Map<Platform, RetryState>();
  const platforms: Platform[] = [
    "blizzard",
    "riot",
    "steam",
    "epic",
    "mojang",
    "squareenix",
  ];

  platforms.forEach((platform) => {
    map.set(platform, createInitialRetryState());
  });

  return map;
}
