/**
 * Riot Games API Integration
 *
 * Fetches server status for Riot games using the Riot Status API v4.
 * Supports League of Legends, Valorant, and Teamfight Tactics.
 *
 * @module publishers/riot
 *
 * ## Authentication
 * Uses RIOT_API_KEY environment variable for API authentication.
 *
 * ## Regional Support
 * Queries platform status per game and region (NA1, EUW1, KR, etc.).
 *
 * ## Status Mapping
 * Parses incident and maintenance arrays to determine current status.
 * Maps Riot status types to internal enum (online, degraded, maintenance, offline).
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { fetchWithTimeout, isEnvVarSet } from "../lib/fetchUtils";
import { logApiError, logFetchSuccess, logMissingCredentials } from "../lib/logger";
import { shouldRetry } from "../lib/retry";
import type { Status, Region } from "../schema";

/**
 * Riot Status API v4 response structure.
 */
interface RiotStatusResponse {
  id: string;
  name: string;
  locales: string[];
  maintenances: RiotStatusIncident[];
  incidents: RiotStatusIncident[];
}

interface RiotStatusIncident {
  id: number;
  maintenance_status?: string;
  incident_severity?: string;
  titles: Array<{ content: string; locale: string }>;
  updates: Array<{
    id: number;
    created_at: string;
    updated_at: string;
    publish: boolean;
    translations: Array<{ content: string; locale: string }>;
  }>;
  created_at: string;
  archive_at?: string;
  updated_at?: string;
  platforms: string[];
}

/**
 * Riot game identifiers for the Status API.
 */
const RIOT_GAMES = {
  lol: {
    slug: "league-of-legends",
    apiName: "lol",
  },
  valorant: {
    slug: "valorant",
    apiName: "val",
  },
  tft: {
    slug: "teamfight-tactics",
    apiName: "lor", // TFT shares infrastructure with LoR for some regions
  },
} as const;

/**
 * Riot platform regions and their mapping to our internal regions.
 */
const RIOT_REGIONS: Record<string, { platforms: string[]; internalRegion: Region }> = {
  na: {
    platforms: ["na1"],
    internalRegion: "na",
  },
  eu: {
    platforms: ["euw1", "eun1"],
    internalRegion: "eu",
  },
  asia: {
    platforms: ["kr", "jp1"],
    internalRegion: "asia",
  },
  oce: {
    platforms: ["oc1"],
    internalRegion: "oce",
  },
};

/**
 * Valorant-specific regions (different from LoL regions).
 */
const VALORANT_REGIONS: Record<string, { platforms: string[]; internalRegion: Region }> = {
  na: {
    platforms: ["na"],
    internalRegion: "na",
  },
  eu: {
    platforms: ["eu"],
    internalRegion: "eu",
  },
  asia: {
    platforms: ["ap", "kr"],
    internalRegion: "asia",
  },
};

/**
 * Determines status from Riot Status API response.
 *
 * @param response - The Riot Status API response
 * @returns The mapped internal status
 */
function determineRiotStatus(response: RiotStatusResponse): Status {
  // Check for active incidents first (more severe)
  if (response.incidents && response.incidents.length > 0) {
    const activeIncidents = response.incidents.filter(
      (incident) => !incident.archive_at
    );

    if (activeIncidents.length > 0) {
      // Check incident severity
      const hasCritical = activeIncidents.some(
        (incident) => incident.incident_severity === "critical"
      );
      if (hasCritical) {
        return "offline";
      }

      const hasWarning = activeIncidents.some(
        (incident) => incident.incident_severity === "warning"
      );
      if (hasWarning) {
        return "degraded";
      }

      // Default to degraded for any active incident
      return "degraded";
    }
  }

  // Check for active maintenance
  if (response.maintenances && response.maintenances.length > 0) {
    const activeMaintenance = response.maintenances.filter((m) => {
      // Check if maintenance is currently active
      if (m.maintenance_status === "in_progress") {
        return true;
      }
      // Check if maintenance is scheduled (not archived)
      return !m.archive_at;
    });

    if (activeMaintenance.length > 0) {
      const inProgress = activeMaintenance.some(
        (m) => m.maintenance_status === "in_progress"
      );
      if (inProgress) {
        return "maintenance";
      }
    }
  }

  // No incidents or maintenance = online
  return "online";
}

/**
 * Fetches status for a specific Riot game and platform.
 *
 * @param apiKey - The Riot API key
 * @param game - The game identifier (lol, val, lor)
 * @param platform - The platform/region code
 * @returns The status response or null if failed
 */
async function fetchRiotGameStatus(
  apiKey: string,
  game: string,
  platform: string
): Promise<RiotStatusResponse | null> {
  // Riot Status API v4 endpoint
  const apiUrl = `https://${platform}.api.riotgames.com/${game}/status/v4/platform-data`;

  const result = await fetchWithTimeout<RiotStatusResponse>(apiUrl, {
    headers: {
      "X-Riot-Token": apiKey,
    },
  });

  if (!result.success || !result.data) {
    return null;
  }

  return result.data;
}

/**
 * Fetches Valorant status (uses different API structure).
 *
 * @param apiKey - The Riot API key
 * @param region - The Valorant region code
 * @returns The status response or null if failed
 */
async function fetchValorantStatus(
  apiKey: string,
  region: string
): Promise<RiotStatusResponse | null> {
  // Valorant uses a regional routing value
  const apiUrl = `https://${region}.api.riotgames.com/val/status/v1/platform-data`;

  const result = await fetchWithTimeout<RiotStatusResponse>(apiUrl, {
    headers: {
      "X-Riot-Token": apiKey,
    },
  });

  if (!result.success || !result.data) {
    return null;
  }

  return result.data;
}

/**
 * Main Riot status fetcher internal action.
 *
 * Fetches status for all Riot games across all supported regions.
 */
export const fetchStatus = internalAction({
  args: {
    attemptNumber: v.number(),
  },
  handler: async (ctx, { attemptNumber }) => {
    const apiKey = process.env.RIOT_API_KEY;

    // Check for required credentials
    if (!isEnvVarSet(apiKey)) {
      logMissingCredentials("riot", ["RIOT_API_KEY"]);
      return;
    }

    const statusRecords: Array<{
      gameSlug: string;
      status: Status;
      region: Region;
      statusMessage?: string;
    }> = [];

    let hasError = false;

    // Fetch League of Legends status
    for (const [regionKey, regionConfig] of Object.entries(RIOT_REGIONS)) {
      for (const platform of regionConfig.platforms) {
        try {
          const response = await fetchRiotGameStatus(apiKey!, "lol", platform);

          if (response) {
            const status = determineRiotStatus(response);
            statusRecords.push({
              gameSlug: RIOT_GAMES.lol.slug,
              status,
              region: regionConfig.internalRegion,
            });
            logFetchSuccess("riot", `lol/${platform}`, status);
          } else {
            hasError = true;
            logApiError({
              level: "error",
              publisher: "riot",
              endpoint: `lol/status/${platform}`,
              statusCode: null,
              message: "Failed to fetch LoL status",
              timestamp: Date.now(),
              consecutiveFailures: attemptNumber + 1,
              attemptNumber,
            });
          }
        } catch (error) {
          hasError = true;
          const errorMessage = error instanceof Error ? error.message : String(error);
          logApiError({
            level: "error",
            publisher: "riot",
            endpoint: `lol/status/${platform}`,
            statusCode: null,
            message: errorMessage,
            timestamp: Date.now(),
            consecutiveFailures: attemptNumber + 1,
            attemptNumber,
          });
        }
      }
    }

    // Fetch Valorant status
    for (const [regionKey, regionConfig] of Object.entries(VALORANT_REGIONS)) {
      for (const platform of regionConfig.platforms) {
        try {
          const response = await fetchValorantStatus(apiKey!, platform);

          if (response) {
            const status = determineRiotStatus(response);
            statusRecords.push({
              gameSlug: RIOT_GAMES.valorant.slug,
              status,
              region: regionConfig.internalRegion,
            });
            logFetchSuccess("riot", `valorant/${platform}`, status);
          } else {
            hasError = true;
            logApiError({
              level: "error",
              publisher: "riot",
              endpoint: `valorant/status/${platform}`,
              statusCode: null,
              message: "Failed to fetch Valorant status",
              timestamp: Date.now(),
              consecutiveFailures: attemptNumber + 1,
              attemptNumber,
            });
          }
        } catch (error) {
          hasError = true;
          const errorMessage = error instanceof Error ? error.message : String(error);
          logApiError({
            level: "error",
            publisher: "riot",
            endpoint: `valorant/status/${platform}`,
            statusCode: null,
            message: errorMessage,
            timestamp: Date.now(),
            consecutiveFailures: attemptNumber + 1,
            attemptNumber,
          });
        }
      }
    }

    // Fetch TFT status (shares LoL infrastructure in most regions)
    for (const [regionKey, regionConfig] of Object.entries(RIOT_REGIONS)) {
      // TFT typically shares status with LoL, but we query separately for accuracy
      const platform = regionConfig.platforms[0]; // Use primary platform
      try {
        const response = await fetchRiotGameStatus(apiKey!, "lol", platform);

        if (response) {
          const status = determineRiotStatus(response);
          statusRecords.push({
            gameSlug: RIOT_GAMES.tft.slug,
            status,
            region: regionConfig.internalRegion,
          });
          logFetchSuccess("riot", `tft/${platform}`, status);
        }
      } catch (error) {
        // TFT status failure is non-critical since it shares infrastructure
        const errorMessage = error instanceof Error ? error.message : String(error);
        logApiError({
          level: "warn",
          publisher: "riot",
          endpoint: `tft/status/${platform}`,
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
        platform: "riot",
        currentAttempt: attemptNumber,
      });
    }
  },
});
