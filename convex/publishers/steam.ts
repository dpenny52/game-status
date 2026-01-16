/**
 * Steam/Valve API Integration
 *
 * Fetches server status for Steam platform using the Steam Web API.
 * Monitors Steam Store and Community status.
 *
 * @module publishers/steam
 *
 * ## Authentication
 * Uses STEAM_API_KEY environment variable. Skips gracefully if not configured.
 *
 * ## Monitored Services
 * - Steam Store
 * - Steam Community
 *
 * ## CS2 Status
 * TODO: If CS2 needs to be monitored, use ICSGOServers_730/GetGameServersStatus
 * endpoint. CS2 is not currently in the game list.
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { fetchWithTimeout, isEnvVarSet } from "../lib/fetchUtils";
import { logApiError, logFetchSuccess, logMissingCredentials } from "../lib/logger";
import { shouldRetry } from "../lib/retry";
import type { Status, Region } from "../schema";

/**
 * Steam Web API server info response.
 */
interface SteamServerInfoResponse {
  servertime: number;
  servertimestring: string;
}

/**
 * Steam status page response structure (unofficial API).
 * Steam doesn't have an official status API, so we use the web API
 * server info as a connectivity check.
 */
interface SteamStatusResponse {
  result?: {
    online?: boolean;
  };
}

/**
 * Steam game slug as defined in our games table.
 */
const STEAM_GAME_SLUG = "steam";

/**
 * Fetches Steam Web API server info to check connectivity.
 * This is a basic health check - if the API responds, Steam services
 * are likely operational.
 *
 * @param apiKey - The Steam Web API key
 * @returns True if Steam API is responding, false otherwise
 */
async function checkSteamApiConnectivity(apiKey: string): Promise<boolean> {
  const apiUrl = `https://api.steampowered.com/ISteamWebAPIUtil/GetServerInfo/v1/?key=${apiKey}`;

  const result = await fetchWithTimeout<SteamServerInfoResponse>(apiUrl);

  if (!result.success || !result.data) {
    return false;
  }

  // If we get a servertime, the API is responding
  return typeof result.data.servertime === "number";
}

/**
 * Checks Steam Store status by hitting the store API.
 * This is an indirect check - we verify the storefront API responds.
 *
 * @returns True if Steam Store is accessible, false otherwise
 */
async function checkSteamStoreStatus(): Promise<boolean> {
  // Use a lightweight store endpoint
  const storeUrl = "https://store.steampowered.com/api/featured/";

  const result = await fetchWithTimeout<Record<string, unknown>>(storeUrl);

  return result.success;
}

/**
 * Checks Steam Community status.
 * Uses the community profile endpoint as a health check.
 *
 * @returns True if Steam Community is accessible, false otherwise
 */
async function checkSteamCommunityStatus(): Promise<boolean> {
  // Use the community status endpoint (if available) or fallback to profile check
  const communityUrl = "https://steamcommunity.com/";

  const result = await fetchWithTimeout<string>(communityUrl);

  return result.success;
}

/**
 * Determines overall Steam status based on service checks.
 *
 * @param apiConnected - Whether the Steam Web API responded
 * @param storeOnline - Whether Steam Store is accessible
 * @param communityOnline - Whether Steam Community is accessible
 * @returns The determined status
 */
function determineSteamStatus(
  apiConnected: boolean,
  storeOnline: boolean,
  communityOnline: boolean
): Status {
  if (!apiConnected && !storeOnline && !communityOnline) {
    return "offline";
  }

  if (apiConnected && storeOnline && communityOnline) {
    return "online";
  }

  // Partial availability = degraded
  return "degraded";
}

/**
 * TODO: CS2 Status Monitoring
 *
 * If Counter-Strike 2 needs to be added to the monitored games list,
 * use the following endpoint:
 *
 * API Endpoint: ICSGOServers_730/GetGameServersStatus/v1
 * URL: https://api.steampowered.com/ICSGOServers_730/GetGameServersStatus/v1/?key={apiKey}
 *
 * Response includes:
 * - matchmaking: { scheduler, online_servers, online_players, searching_players }
 * - services: { SessionsLogon, SteamCommunity, IEconItems, Leaderboards }
 * - datacenters: { peru, eu_west, eu_east, india, etc. }
 *
 * Each datacenter/service has a "load" field indicating status.
 *
 * CS2 is not currently in the game list (spec 001). Add it to the games
 * table first if monitoring is needed.
 */

/**
 * Main Steam status fetcher internal action.
 *
 * Performs connectivity checks to determine Steam platform status.
 * Steam is a global service, so we store a single global status.
 */
export const fetchStatus = internalAction({
  args: {
    attemptNumber: v.number(),
  },
  handler: async (ctx, { attemptNumber }) => {
    const apiKey = process.env.STEAM_API_KEY;

    // Steam API key is optional - skip gracefully if not configured
    if (!isEnvVarSet(apiKey)) {
      logMissingCredentials("steam", ["STEAM_API_KEY"]);

      // Even without API key, we can check public endpoints
      // But for full functionality, log and continue with limited checks
    }

    let hasError = false;
    let apiConnected = false;
    let storeOnline = false;
    let communityOnline = false;

    try {
      // Check API connectivity (requires API key)
      if (isEnvVarSet(apiKey)) {
        apiConnected = await checkSteamApiConnectivity(apiKey!);
        if (apiConnected) {
          logFetchSuccess("steam", "api", "connected");
        }
      }

      // Check Steam Store (public endpoint)
      storeOnline = await checkSteamStoreStatus();
      if (storeOnline) {
        logFetchSuccess("steam", "store", "online");
      }

      // Check Steam Community (public endpoint)
      communityOnline = await checkSteamCommunityStatus();
      if (communityOnline) {
        logFetchSuccess("steam", "community", "online");
      }

      // Determine overall status
      const status = determineSteamStatus(apiConnected, storeOnline, communityOnline);

      // Build status message with component details
      const components: string[] = [];
      components.push(`API: ${apiConnected ? "OK" : "N/A"}`);
      components.push(`Store: ${storeOnline ? "OK" : "DOWN"}`);
      components.push(`Community: ${communityOnline ? "OK" : "DOWN"}`);
      const statusMessage = components.join(" | ");

      // Store status in database (Steam is global)
      await ctx.runMutation(internal.statusMutations.upsertServerStatus, {
        gameSlug: STEAM_GAME_SLUG,
        status,
        region: "global" as Region,
        statusMessage,
      });

      logFetchSuccess("steam", "global", status);
    } catch (error) {
      hasError = true;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logApiError({
        level: "error",
        publisher: "steam",
        endpoint: "multiple",
        statusCode: null,
        message: errorMessage,
        timestamp: Date.now(),
        consecutiveFailures: attemptNumber + 1,
        attemptNumber,
      });
    }

    // Schedule retry if there were errors and attempts remaining
    if (hasError && shouldRetry(attemptNumber)) {
      await ctx.scheduler.runAfter(0, internal.statusFetcher.scheduleRetry, {
        platform: "steam",
        currentAttempt: attemptNumber,
      });
    }
  },
});
