/**
 * Blizzard Web Scraping Integration
 *
 * Fetches server status for Blizzard games using web scraping and health checks.
 * Supports World of Warcraft, Diablo IV, Overwatch 2, and Hearthstone.
 *
 * @module publishers/blizzard
 *
 * ## No Authentication Required
 * This module uses public web endpoints and health checks instead of the
 * Battle.net API, which has been found to be unreliable for real-time status.
 *
 * ## Approach
 * Uses health check pattern similar to Steam publisher:
 * - Check if game-specific endpoints respond
 * - Check Battle.net launcher/login services
 * - Parse maintenance indicators from status pages
 *
 * ## Regional Support
 * Tracks status for NA, EU, Asia regions based on regional endpoints.
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { fetchHtml } from "../lib/fetchUtils";
import { logApiError, logFetchSuccess } from "../lib/logger";
import { shouldRetry } from "../lib/retry";
import type { Status, Region } from "../schema";

/**
 * Regional endpoints for health checks.
 */
const REGION_CONFIGS = {
  us: {
    region: "na" as Region,
    wowStatusPage: "https://worldofwarcraft.blizzard.com/en-us/game/status/us",
    battleNetUrl: "https://us.battle.net/login/en/",
    diabloUrl: "https://diablo4.blizzard.com/en-us/",
    overwatchUrl: "https://overwatch.blizzard.com/en-us/",
    hearthstoneUrl: "https://hearthstone.blizzard.com/en-us/",
  },
  eu: {
    region: "eu" as Region,
    wowStatusPage: "https://worldofwarcraft.blizzard.com/en-gb/game/status/eu",
    battleNetUrl: "https://eu.battle.net/login/en/",
    diabloUrl: "https://diablo4.blizzard.com/en-gb/",
    overwatchUrl: "https://overwatch.blizzard.com/en-gb/",
    hearthstoneUrl: "https://hearthstone.blizzard.com/en-gb/",
  },
  asia: {
    region: "asia" as Region,
    wowStatusPage: "https://worldofwarcraft.blizzard.com/ko-kr/game/status/kr",
    battleNetUrl: "https://kr.battle.net/login/ko/",
    diabloUrl: "https://diablo4.blizzard.com/ko-kr/",
    overwatchUrl: "https://overwatch.blizzard.com/ko-kr/",
    hearthstoneUrl: "https://hearthstone.blizzard.com/ko-kr/",
  },
} as const;

/**
 * Blizzard game slugs as defined in our games table.
 */
const BLIZZARD_GAMES = {
  wow: "world-of-warcraft",
  diablo4: "diablo-iv",
  overwatch2: "overwatch-2",
  hearthstone: "hearthstone",
} as const;

/**
 * Keywords indicating maintenance in page content.
 */
const MAINTENANCE_KEYWORDS = [
  "maintenance",
  "scheduled downtime",
  "currently unavailable",
  "undergoing maintenance",
  "service interruption",
  "temporarily offline",
];

/**
 * Keywords indicating degraded service.
 */
const DEGRADED_KEYWORDS = [
  "experiencing issues",
  "degraded",
  "partial outage",
  "some players may",
  "intermittent",
  "connectivity issues",
];

/**
 * Checks if HTML content contains maintenance indicators.
 */
function containsMaintenanceIndicators(html: string): boolean {
  const lowerHtml = html.toLowerCase();
  return MAINTENANCE_KEYWORDS.some((keyword) => lowerHtml.includes(keyword));
}

/**
 * Checks if HTML content contains degraded service indicators.
 */
function containsDegradedIndicators(html: string): boolean {
  const lowerHtml = html.toLowerCase();
  return DEGRADED_KEYWORDS.some((keyword) => lowerHtml.includes(keyword));
}

/**
 * Performs a health check on a URL and optionally checks content for status indicators.
 *
 * @param url - The URL to check
 * @param checkContent - Whether to check the HTML content for status indicators
 * @returns Status based on the health check result
 */
async function healthCheck(
  url: string,
  checkContent: boolean = false
): Promise<{ accessible: boolean; status: Status; html?: string }> {
  const result = await fetchHtml(url);

  if (!result.success || !result.data) {
    return { accessible: false, status: "offline" };
  }

  const html = result.data;

  if (checkContent) {
    if (containsMaintenanceIndicators(html)) {
      return { accessible: true, status: "maintenance", html };
    }
    if (containsDegradedIndicators(html)) {
      return { accessible: true, status: "degraded", html };
    }
  }

  return { accessible: true, status: "online", html };
}

/**
 * Checks Battle.net login service health for a region.
 */
async function checkBattleNetHealth(
  regionConfig: (typeof REGION_CONFIGS)[keyof typeof REGION_CONFIGS]
): Promise<boolean> {
  const result = await fetchHtml(regionConfig.battleNetUrl);
  return result.success;
}

/**
 * Fetches and analyzes WoW status page for a region.
 * The status page may contain embedded data or status indicators.
 */
async function getWowStatus(
  regionConfig: (typeof REGION_CONFIGS)[keyof typeof REGION_CONFIGS]
): Promise<Status> {
  const check = await healthCheck(regionConfig.wowStatusPage, true);

  if (!check.accessible) {
    return "offline";
  }

  // Check for specific offline indicators in the WoW status page
  if (check.html) {
    const html = check.html.toLowerCase();

    // Look for realm offline indicators
    if (
      html.includes("no realm data") ||
      html.includes("realms are offline") ||
      html.includes("all realms offline")
    ) {
      return "offline";
    }

    // Check for the status page React mount point - if it loads, services are up
    if (html.includes("realm-status-mount")) {
      // The page structure loaded successfully
      // Additional status comes from maintenance/degraded keyword checks
      return check.status;
    }
  }

  return check.status;
}

/**
 * Gets status for Diablo IV by checking the game page.
 */
async function getDiabloStatus(
  regionConfig: (typeof REGION_CONFIGS)[keyof typeof REGION_CONFIGS]
): Promise<Status> {
  const check = await healthCheck(regionConfig.diabloUrl, true);
  return check.accessible ? check.status : "offline";
}

/**
 * Gets status for Overwatch 2 by checking the game page.
 */
async function getOverwatchStatus(
  regionConfig: (typeof REGION_CONFIGS)[keyof typeof REGION_CONFIGS]
): Promise<Status> {
  const check = await healthCheck(regionConfig.overwatchUrl, true);
  return check.accessible ? check.status : "offline";
}

/**
 * Gets status for Hearthstone by checking the game page.
 */
async function getHearthstoneStatus(
  regionConfig: (typeof REGION_CONFIGS)[keyof typeof REGION_CONFIGS]
): Promise<Status> {
  const check = await healthCheck(regionConfig.hearthstoneUrl, true);
  return check.accessible ? check.status : "offline";
}

/**
 * Determines overall status for a Blizzard game in a region.
 * Uses web scraping and health checks instead of API.
 */
async function getBlizzardGameStatus(
  game: keyof typeof BLIZZARD_GAMES,
  regionKey: keyof typeof REGION_CONFIGS
): Promise<Status> {
  const regionConfig = REGION_CONFIGS[regionKey];

  switch (game) {
    case "wow":
      return getWowStatus(regionConfig);
    case "diablo4":
      return getDiabloStatus(regionConfig);
    case "overwatch2":
      return getOverwatchStatus(regionConfig);
    case "hearthstone":
      return getHearthstoneStatus(regionConfig);
    default:
      return "unknown";
  }
}

/**
 * Regions to check - mapped to our internal region format.
 */
const REGIONS_TO_CHECK = ["us", "eu", "asia"] as const;

/**
 * Main Blizzard status fetcher internal action.
 *
 * Fetches status for all Blizzard games across all supported regions.
 * Uses web scraping and health checks - no API credentials required.
 */
export const fetchStatus = internalAction({
  args: {
    attemptNumber: v.number(),
  },
  handler: async (ctx, { attemptNumber }) => {
    const statusRecords: Array<{
      gameSlug: string;
      status: Status;
      region: Region;
      statusMessage?: string;
    }> = [];

    let hasError = false;

    // Process each region
    for (const regionKey of REGIONS_TO_CHECK) {
      const regionConfig = REGION_CONFIGS[regionKey];

      try {
        // First check if Battle.net is accessible for this region
        const battleNetHealthy = await checkBattleNetHealth(regionConfig);

        if (!battleNetHealthy) {
          // Battle.net login is down - all games likely affected
          for (const [, gameSlug] of Object.entries(BLIZZARD_GAMES)) {
            statusRecords.push({
              gameSlug,
              status: "offline",
              region: regionConfig.region,
              statusMessage: "Battle.net services unreachable",
            });
          }
          continue;
        }

        // Fetch status for each Blizzard game
        for (const [gameKey, gameSlug] of Object.entries(BLIZZARD_GAMES)) {
          try {
            const status = await getBlizzardGameStatus(
              gameKey as keyof typeof BLIZZARD_GAMES,
              regionKey
            );

            statusRecords.push({
              gameSlug,
              status,
              region: regionConfig.region,
            });

            logFetchSuccess("blizzard", `${gameSlug}/${regionKey}`, status);
          } catch (gameError) {
            // Individual game check failed - mark as unknown
            statusRecords.push({
              gameSlug,
              status: "unknown",
              region: regionConfig.region,
            });

            const errorMessage =
              gameError instanceof Error ? gameError.message : String(gameError);
            logApiError({
              level: "warn",
              publisher: "blizzard",
              endpoint: `${gameSlug}/${regionKey}`,
              statusCode: null,
              message: errorMessage,
              timestamp: Date.now(),
              consecutiveFailures: attemptNumber + 1,
              attemptNumber,
            });
          }
        }
      } catch (error) {
        hasError = true;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logApiError({
          level: "error",
          publisher: "blizzard",
          endpoint: `region/${regionKey}`,
          statusCode: null,
          message: errorMessage,
          timestamp: Date.now(),
          consecutiveFailures: attemptNumber + 1,
          attemptNumber,
        });
      }
    }

    // Store all status records in the database
    if (statusRecords.length > 0) {
      await ctx.runMutation(internal.statusMutations.batchUpsertServerStatus, {
        records: statusRecords,
      });
    }

    // Schedule retry if there were errors and attempts remaining
    if (hasError && shouldRetry(attemptNumber)) {
      await ctx.scheduler.runAfter(0, internal.statusFetcher.scheduleRetry, {
        platform: "blizzard",
        currentAttempt: attemptNumber,
      });
    }
  },
});
