/**
 * Status Fetcher Coordinator
 *
 * Coordinates the dispatching of status fetchers for all publishers.
 * Implements parallel execution with independent error handling per publisher.
 *
 * @module statusFetcher
 */

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Platform } from "./schema";
import {
  logPollingCycleStart,
  logPollingCycleComplete,
  logApiError,
  logRetryScheduled,
  logRetryExhausted,
} from "./lib/logger";
import {
  calculateBackoffDelay,
  shouldRetry,
  MAX_RETRY_ATTEMPTS,
} from "./lib/retry";
import { v } from "convex/values";

/**
 * List of all supported publishers/platforms.
 * Each publisher has its own dedicated fetcher internal action.
 */
const SUPPORTED_PLATFORMS: Platform[] = [
  "blizzard",
  "riot",
  "steam",
  "epic",
  "mojang",
  "squareenix",
];

/**
 * Dispatches status fetchers for all publishers in parallel.
 *
 * This is the main entry point called by the cron scheduler.
 * Each publisher is fetched independently using Promise.allSettled to ensure
 * one failure does not block others.
 */
export const dispatchAllPublishers = internalAction({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    logPollingCycleStart();

    let successCount = 0;
    let failureCount = 0;

    // Dispatch all publisher fetchers in parallel
    const results = await Promise.allSettled(
      SUPPORTED_PLATFORMS.map(async (platform) => {
        try {
          // Schedule the platform-specific fetcher
          await ctx.scheduler.runAfter(0, internal.publishers[platform].fetchStatus, {
            attemptNumber: 0,
          });
          return { platform, success: true };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logApiError({
            level: "error",
            publisher: platform,
            endpoint: "dispatch",
            statusCode: null,
            message: `Failed to dispatch fetcher: ${errorMessage}`,
            timestamp: Date.now(),
            consecutiveFailures: 1,
            attemptNumber: 0,
          });
          return { platform, success: false, error: errorMessage };
        }
      })
    );

    // Count successes and failures
    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.success) {
        successCount++;
      } else {
        failureCount++;
      }
    });

    const durationMs = Date.now() - startTime;
    logPollingCycleComplete(successCount, failureCount, durationMs);
  },
});

/**
 * Schedules a retry for a failed publisher fetch with exponential backoff.
 *
 * @param ctx - The action context with scheduler
 * @param platform - The publisher that failed
 * @param currentAttempt - The current attempt number (0-indexed)
 */
export const scheduleRetry = internalAction({
  args: {
    platform: v.union(
      v.literal("blizzard"),
      v.literal("riot"),
      v.literal("steam"),
      v.literal("epic"),
      v.literal("mojang"),
      v.literal("squareenix")
    ),
    currentAttempt: v.number(),
  },
  handler: async (ctx, { platform, currentAttempt }) => {
    const nextAttempt = currentAttempt + 1;

    if (!shouldRetry(nextAttempt)) {
      logRetryExhausted(platform);
      return;
    }

    const delayMs = calculateBackoffDelay(nextAttempt);
    logRetryScheduled(platform, delayMs, nextAttempt);

    // Schedule the retry after the backoff delay
    await ctx.scheduler.runAfter(delayMs, internal.publishers[platform].fetchStatus, {
      attemptNumber: nextAttempt,
    });
  },
});

/**
 * Maximum retry attempts exported for use by publisher fetchers.
 */
export { MAX_RETRY_ATTEMPTS };
