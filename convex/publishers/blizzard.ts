/**
 * Blizzard API Integration
 *
 * Fetches server status for Blizzard games using the Battle.net Game Data API.
 * Supports World of Warcraft, Diablo IV, Overwatch 2, and Hearthstone.
 *
 * @module publishers/blizzard
 *
 * ## Authentication
 * Uses OAuth2 client credentials flow with BLIZZARD_CLIENT_ID and
 * BLIZZARD_CLIENT_SECRET environment variables.
 *
 * ## Regional Support
 * Tracks status for NA, EU, KR, TW regions where API provides data.
 *
 * ## Fallback
 * Implements HTML scraping fallback for World of Warcraft only if the
 * official API lacks real-time status.
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import {
  fetchWithTimeout,
  fetchHtml,
  isEnvVarSet,
} from "../lib/fetchUtils";
import { logApiError, logFetchSuccess, logMissingCredentials } from "../lib/logger";
import { shouldRetry } from "../lib/retry";
import type { Status, Region } from "../schema";
import { mapToInternalStatus } from "../statusMutations";

/**
 * Blizzard OAuth2 token response structure.
 */
interface BlizzardTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Blizzard game realm status response structure.
 * Note: This is a simplified representation. Actual API response may vary.
 */
interface BlizzardRealmStatus {
  realms?: Array<{
    name: string;
    slug: string;
    status: {
      type: string;
      name: string;
    };
  }>;
}

/**
 * Maps Blizzard API regions to our internal region codes.
 */
const BLIZZARD_REGION_MAP: Record<string, Region> = {
  us: "na",
  eu: "eu",
  kr: "asia",
  tw: "asia",
  cn: "asia",
};

/**
 * Blizzard API region endpoints.
 */
const BLIZZARD_REGIONS = ["us", "eu", "kr", "tw"] as const;

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
 * Authenticates with Battle.net OAuth2 using client credentials flow.
 *
 * @param clientId - The Blizzard client ID
 * @param clientSecret - The Blizzard client secret
 * @param region - The API region (us, eu, kr, tw)
 * @returns The access token or null if authentication fails
 */
async function authenticateBlizzard(
  clientId: string,
  clientSecret: string,
  region: string
): Promise<string | null> {
  const tokenUrl = `https://${region}.battle.net/oauth/token`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const result = await fetchWithTimeout<BlizzardTokenResponse>(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!result.success || !result.data) {
    return null;
  }

  return result.data.access_token;
}

/**
 * Fetches WoW realm status from Battle.net API.
 *
 * @param accessToken - The OAuth2 access token
 * @param region - The API region
 * @returns The realm status or null if fetch fails
 */
async function fetchWowRealmStatus(
  accessToken: string,
  region: string
): Promise<BlizzardRealmStatus | null> {
  // Note: This endpoint may not provide real-time status.
  // The connected-realm endpoint provides realm data but status
  // availability depends on Blizzard's API.
  const apiUrl = `https://${region}.api.blizzard.com/data/wow/connected-realm/index?namespace=dynamic-${region}&locale=en_US`;

  const result = await fetchWithTimeout<BlizzardRealmStatus>(apiUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!result.success || !result.data) {
    return null;
  }

  return result.data;
}

/**
 * Scrapes WoW status from the official status page as a fallback.
 * Only used if the official API lacks real-time status.
 *
 * TODO: This fallback is implemented but the actual parsing logic depends on
 * the structure of the official WoW status page. The current implementation
 * returns "unknown" as a placeholder. Update this once the page structure
 * is analyzed.
 *
 * @param region - The region to check
 * @returns The status determined from scraping
 */
async function scrapeWowStatus(region: string): Promise<Status> {
  // Official WoW status page URL
  const statusUrl = `https://worldofwarcraft.blizzard.com/${region}/game/status`;

  const result = await fetchHtml(statusUrl);

  if (!result.success || !result.data) {
    return "unknown";
  }

  // TODO: Implement actual HTML parsing based on page structure.
  // The WoW status page uses JavaScript rendering which may require
  // a different approach (e.g., checking for specific status indicators
  // in the initial HTML or using the embedded data if available).
  //
  // For now, return "online" as a placeholder since we cannot determine
  // the actual status without proper HTML parsing.
  //
  // FALLBACK TRIGGER CONDITIONS:
  // - Use scraping when Blizzard API does not provide real-time realm status
  // - API may return realm data without live status indicators
  // - Check API response for status field availability before falling back

  console.log(`[INFO] WoW scraping fallback executed for region: ${region}`);
  return "unknown";
}

/**
 * Determines overall status for a Blizzard game.
 * For WoW, checks realm data. For other games, uses API or defaults.
 *
 * TODO: Blizzard does not provide a unified status API for all games.
 * - Diablo IV: No public status API found. Monitor Blizzard's official
 *   channels or status page for updates.
 * - Overwatch 2: No public status API found. The game uses different
 *   infrastructure from WoW.
 * - Hearthstone: No public status API found.
 *
 * These titles may need alternative approaches such as:
 * - Monitoring the Blizzard status Twitter account
 * - Scraping the official status page
 * - Using third-party status aggregators
 */
async function getBlizzardGameStatus(
  game: keyof typeof BLIZZARD_GAMES,
  region: string,
  accessToken: string | null
): Promise<Status> {
  if (game === "wow" && accessToken) {
    const realmStatus = await fetchWowRealmStatus(accessToken, region);

    if (!realmStatus) {
      // Fallback to scraping for WoW
      return await scrapeWowStatus(region);
    }

    // If we got realm data but no status info, use scraping fallback
    // TODO: Check actual API response structure for status indicators
    return await scrapeWowStatus(region);
  }

  // For other Blizzard games, return unknown until API endpoints are identified
  // TODO: Implement status fetching for Diablo IV, Overwatch 2, Hearthstone
  // when/if Blizzard provides public status APIs
  return "unknown";
}

/**
 * Main Blizzard status fetcher internal action.
 *
 * Fetches status for all Blizzard games across all supported regions.
 * Uses OAuth2 authentication and batches requests within a single token session.
 */
export const fetchStatus = internalAction({
  args: {
    attemptNumber: v.number(),
  },
  handler: async (ctx, { attemptNumber }) => {
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

    // Check for required credentials
    if (!isEnvVarSet(clientId) || !isEnvVarSet(clientSecret)) {
      logMissingCredentials("blizzard", ["BLIZZARD_CLIENT_ID", "BLIZZARD_CLIENT_SECRET"]);
      return;
    }

    const statusRecords: Array<{
      gameSlug: string;
      status: Status;
      region: Region;
      statusMessage?: string;
    }> = [];

    // Process each region
    for (const blizzardRegion of BLIZZARD_REGIONS) {
      const internalRegion = BLIZZARD_REGION_MAP[blizzardRegion];

      try {
        // Authenticate once per region (tokens are region-specific)
        const accessToken = await authenticateBlizzard(
          clientId!,
          clientSecret!,
          blizzardRegion
        );

        if (!accessToken) {
          logApiError({
            level: "error",
            publisher: "blizzard",
            endpoint: `https://${blizzardRegion}.battle.net/oauth/token`,
            statusCode: null,
            message: "OAuth2 authentication failed",
            timestamp: Date.now(),
            consecutiveFailures: attemptNumber + 1,
            attemptNumber,
          });

          // Schedule retry if attempts remaining
          if (shouldRetry(attemptNumber)) {
            await ctx.scheduler.runAfter(0, internal.statusFetcher.scheduleRetry, {
              platform: "blizzard",
              currentAttempt: attemptNumber,
            });
          }
          return;
        }

        // Fetch status for each Blizzard game
        for (const [gameKey, gameSlug] of Object.entries(BLIZZARD_GAMES)) {
          const status = await getBlizzardGameStatus(
            gameKey as keyof typeof BLIZZARD_GAMES,
            blizzardRegion,
            accessToken
          );

          statusRecords.push({
            gameSlug,
            status,
            region: internalRegion,
          });

          logFetchSuccess("blizzard", `${gameSlug}/${blizzardRegion}`, status);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logApiError({
          level: "error",
          publisher: "blizzard",
          endpoint: `region/${blizzardRegion}`,
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
  },
});
