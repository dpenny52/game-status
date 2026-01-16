/**
 * Status Mutations
 *
 * Internal mutations for storing server status results in the database.
 * Called by publisher fetcher actions after successfully retrieving status data.
 * Includes transition detection for triggering alert notifications.
 *
 * @module statusMutations
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { statusValidator, regionValidator } from "./schema";
import type { Status, Region } from "./schema";
import type { Id } from "./_generated/dataModel";
import { shouldTriggerAlert } from "./lib/transitionDetection";
import { internal } from "./_generated/api";

/**
 * Upserts a server status record for a game and region.
 *
 * If a record exists for the game+region combination, it updates the existing record.
 * If no record exists, it creates a new one.
 *
 * Updates lastCheckedAt on every call.
 * Updates statusChangedAt only when the status actually changes.
 *
 * When an offline-to-online transition is detected, schedules alert processing.
 */
export const upsertServerStatus = internalMutation({
  args: {
    gameSlug: v.string(),
    status: statusValidator,
    region: regionValidator,
    statusMessage: v.optional(v.string()),
  },
  handler: async (ctx, { gameSlug, status, region, statusMessage }) => {
    const now = Date.now();

    // Find the game by slug
    const game = await ctx.db
      .query("games")
      .withIndex("by_slug", (q) => q.eq("slug", gameSlug))
      .first();

    if (!game) {
      console.warn(`[WARN] Game not found for slug: ${gameSlug}. Status update skipped.`);
      return null;
    }

    const gameId = game._id as Id<"games">;

    // Find existing status record for this game+region
    // Query by gameId first, then filter by region
    const existingRecords = await ctx.db
      .query("serverStatusRecords")
      .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
      .collect();

    const existingRecord = existingRecords.find((r) => r.region === region);

    if (existingRecord) {
      // Capture previous status before update for transition detection
      const previousStatus = existingRecord.status as Status;
      const statusChanged = previousStatus !== status;
      const recordId = existingRecord._id as Id<"serverStatusRecords">;

      await ctx.db.patch(recordId, {
        status,
        lastCheckedAt: now,
        statusChangedAt: statusChanged ? now : existingRecord.statusChangedAt,
        statusMessage: statusMessage !== undefined ? statusMessage : existingRecord.statusMessage,
        updatedAt: now,
      });

      // Check for offline-to-online transition and trigger alert processing
      if (shouldTriggerAlert(previousStatus, status)) {
        console.log(`[INFO] Offline-to-online transition detected for ${gameSlug}/${region}. Scheduling alert processing.`);
        await ctx.scheduler.runAfter(0, internal.alertNotifications.processAlerts, {
          gameId,
          region,
        });
      }

      return existingRecord._id;
    } else {
      // Create new record - only include statusMessage if defined
      const baseRecord = {
        gameId,
        status,
        region,
        lastCheckedAt: now,
        statusChangedAt: now,
        updatedAt: now,
      };

      const newRecordId = await ctx.db.insert(
        "serverStatusRecords",
        statusMessage !== undefined
          ? { ...baseRecord, statusMessage }
          : baseRecord
      );

      // Note: New records don't trigger alerts as there's no previous status to transition from

      return newRecordId;
    }
  },
});

/**
 * Batch upserts multiple server status records.
 * Useful for publishers that provide status for multiple games/regions at once.
 *
 * Includes transition detection for triggering alert notifications on
 * offline-to-online transitions.
 */
export const batchUpsertServerStatus = internalMutation({
  args: {
    records: v.array(
      v.object({
        gameSlug: v.string(),
        status: statusValidator,
        region: regionValidator,
        statusMessage: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { records }) => {
    const now = Date.now();
    const results: { gameSlug: string; success: boolean; error?: string }[] = [];
    const alertsToProcess: Array<{ gameId: Id<"games">; region: Region }> = [];

    for (const record of records) {
      try {
        // Find the game by slug
        const game = await ctx.db
          .query("games")
          .withIndex("by_slug", (q) => q.eq("slug", record.gameSlug))
          .first();

        if (!game) {
          results.push({
            gameSlug: record.gameSlug,
            success: false,
            error: `Game not found for slug: ${record.gameSlug}`,
          });
          continue;
        }

        const gameId = game._id as Id<"games">;

        // Find existing status record for this game+region
        // Query by gameId first, then filter by region
        const existingRecords = await ctx.db
          .query("serverStatusRecords")
          .withIndex("by_gameId", (q) => q.eq("gameId", gameId))
          .collect();

        const existingRecord = existingRecords.find((r) => r.region === record.region);

        if (existingRecord) {
          // Capture previous status before update for transition detection
          const previousStatus = existingRecord.status as Status;
          const statusChanged = previousStatus !== record.status;
          const recordId = existingRecord._id as Id<"serverStatusRecords">;

          await ctx.db.patch(recordId, {
            status: record.status,
            lastCheckedAt: now,
            statusChangedAt: statusChanged ? now : existingRecord.statusChangedAt,
            statusMessage: record.statusMessage !== undefined ? record.statusMessage : existingRecord.statusMessage,
            updatedAt: now,
          });

          // Check for offline-to-online transition
          if (shouldTriggerAlert(previousStatus, record.status)) {
            console.log(`[INFO] Offline-to-online transition detected for ${record.gameSlug}/${record.region}. Queuing alert processing.`);
            alertsToProcess.push({ gameId, region: record.region });
          }
        } else {
          // Create new record - only include statusMessage if defined
          const baseRecord = {
            gameId,
            status: record.status,
            region: record.region,
            lastCheckedAt: now,
            statusChangedAt: now,
            updatedAt: now,
          };

          await ctx.db.insert(
            "serverStatusRecords",
            record.statusMessage !== undefined
              ? { ...baseRecord, statusMessage: record.statusMessage }
              : baseRecord
          );
          // Note: New records don't trigger alerts as there's no previous status
        }

        results.push({ gameSlug: record.gameSlug, success: true });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({
          gameSlug: record.gameSlug,
          success: false,
          error: errorMessage,
        });
      }
    }

    // Schedule alert processing for all offline-to-online transitions
    for (const alert of alertsToProcess) {
      await ctx.scheduler.runAfter(0, internal.alertNotifications.processAlerts, {
        gameId: alert.gameId,
        region: alert.region,
      });
    }

    return results;
  },
});

/**
 * Maps raw status strings from various APIs to our internal Status enum.
 *
 * @param rawStatus - The status string from an external API
 * @param source - The source of the status (for logging purposes)
 * @returns The mapped Status enum value
 */
export function mapToInternalStatus(
  rawStatus: string,
  source: string = "unknown"
): Status {
  const normalizedStatus = rawStatus.toLowerCase().trim();

  // Online statuses
  if (
    normalizedStatus === "online" ||
    normalizedStatus === "operational" ||
    normalizedStatus === "up" ||
    normalizedStatus === "green" ||
    normalizedStatus === "healthy" ||
    normalizedStatus === "normal"
  ) {
    return "online";
  }

  // Offline statuses
  if (
    normalizedStatus === "offline" ||
    normalizedStatus === "down" ||
    normalizedStatus === "outage" ||
    normalizedStatus === "major_outage" ||
    normalizedStatus === "critical"
  ) {
    return "offline";
  }

  // Degraded statuses
  if (
    normalizedStatus === "degraded" ||
    normalizedStatus === "degraded_performance" ||
    normalizedStatus === "partial" ||
    normalizedStatus === "partial_outage" ||
    normalizedStatus === "yellow" ||
    normalizedStatus === "warning"
  ) {
    return "degraded";
  }

  // Maintenance statuses
  if (
    normalizedStatus === "maintenance" ||
    normalizedStatus === "under_maintenance" ||
    normalizedStatus === "scheduled" ||
    normalizedStatus === "blue"
  ) {
    return "maintenance";
  }

  // Unknown as fallback
  console.warn(
    `[WARN] Unknown status value "${rawStatus}" from ${source}, defaulting to "unknown"`
  );
  return "unknown";
}
