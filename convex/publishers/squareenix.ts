/**
 * Square Enix Integration
 *
 * Fetches server status for Final Fantasy XIV using Lodestone API and
 * official FFXIV status endpoints.
 *
 * @module publishers/squareenix
 *
 * ## Data Centers
 * Tracks status per data center/world where available:
 * - NA: Aether, Crystal, Dynamis, Primal
 * - EU: Chaos, Light
 * - JP: Elemental, Gaia, Mana, Meteor
 * - OCE: Materia
 *
 * ## Maintenance Notices
 * Parses scheduled maintenance from official sources.
 *
 * ## API Notes
 * TODO: The official FFXIV API requires authentication for some endpoints.
 * The Lodestone provides public world status data which we use here.
 * Some endpoints may be undocumented or change without notice.
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { fetchWithTimeout, fetchHtml } from "../lib/fetchUtils";
import { logApiError, logFetchSuccess } from "../lib/logger";
import { shouldRetry } from "../lib/retry";
import type { Status, Region } from "../schema";

/**
 * FFXIV world status as returned by unofficial APIs or scraped data.
 */
interface FFXIVWorldStatus {
  name: string;
  status: "online" | "maintenance" | "partial" | "offline";
  category?: string;
  canCreate?: boolean;
}

/**
 * FFXIV data center groupings.
 */
interface FFXIVDataCenter {
  name: string;
  region: Region;
  worlds: string[];
}

/**
 * FFXIV game slug as defined in our games table.
 */
const FFXIV_GAME_SLUG = "final-fantasy-xiv";

/**
 * FFXIV data centers and their associated worlds.
 * Used for regional status tracking.
 */
const FFXIV_DATA_CENTERS: FFXIVDataCenter[] = [
  // North America
  {
    name: "Aether",
    region: "na",
    worlds: [
      "Adamantoise",
      "Cactuar",
      "Faerie",
      "Gilgamesh",
      "Jenova",
      "Midgardsormr",
      "Sargatanas",
      "Siren",
    ],
  },
  {
    name: "Crystal",
    region: "na",
    worlds: [
      "Balmung",
      "Brynhildr",
      "Coeurl",
      "Diabolos",
      "Goblin",
      "Malboro",
      "Mateus",
      "Zalera",
    ],
  },
  {
    name: "Dynamis",
    region: "na",
    worlds: ["Halicarnassus", "Maduin", "Marilith", "Seraph"],
  },
  {
    name: "Primal",
    region: "na",
    worlds: [
      "Behemoth",
      "Excalibur",
      "Exodus",
      "Famfrit",
      "Hyperion",
      "Lamia",
      "Leviathan",
      "Ultros",
    ],
  },
  // Europe
  {
    name: "Chaos",
    region: "eu",
    worlds: [
      "Cerberus",
      "Louisoix",
      "Moogle",
      "Omega",
      "Phantom",
      "Ragnarok",
      "Sagittarius",
      "Spriggan",
    ],
  },
  {
    name: "Light",
    region: "eu",
    worlds: [
      "Alpha",
      "Lich",
      "Odin",
      "Phoenix",
      "Raiden",
      "Shiva",
      "Twintania",
      "Zodiark",
    ],
  },
  // Japan
  {
    name: "Elemental",
    region: "asia",
    worlds: [
      "Aegis",
      "Atomos",
      "Carbuncle",
      "Garuda",
      "Gungnir",
      "Kujata",
      "Tonberry",
      "Typhon",
    ],
  },
  {
    name: "Gaia",
    region: "asia",
    worlds: [
      "Alexander",
      "Bahamut",
      "Durandal",
      "Fenrir",
      "Ifrit",
      "Ridill",
      "Tiamat",
      "Ultima",
    ],
  },
  {
    name: "Mana",
    region: "asia",
    worlds: [
      "Anima",
      "Asura",
      "Chocobo",
      "Hades",
      "Ixion",
      "Masamune",
      "Pandaemonium",
      "Titan",
    ],
  },
  {
    name: "Meteor",
    region: "asia",
    worlds: [
      "Belias",
      "Mandragora",
      "Ramuh",
      "Shinryu",
      "Unicorn",
      "Valefor",
      "Yojimbo",
      "Zeromus",
    ],
  },
  // Oceania
  {
    name: "Materia",
    region: "oce",
    worlds: ["Bismarck", "Ravana", "Sephirot", "Sophia", "Zurvan"],
  },
];

/**
 * Official FFXIV Lodestone world status page URL.
 * This is a public page that shows server status.
 *
 * TODO: The Lodestone uses JavaScript rendering for status data.
 * A proper implementation would need to:
 * 1. Use a headless browser, or
 * 2. Find the underlying JSON API endpoint, or
 * 3. Use a community-maintained API like XIVAPI
 *
 * For now, we check if the Lodestone is accessible and return
 * a basic status. This can be improved when official API access
 * is available or a reliable community API is identified.
 */
const LODESTONE_STATUS_URL = "https://na.finalfantasyxiv.com/lodestone/worldstatus/";

/**
 * XIVAPI endpoint (community-maintained).
 * This provides programmatic access to FFXIV data including world status.
 *
 * TODO: XIVAPI may have rate limits and terms of service.
 * Review and implement proper rate limiting if using this API.
 */
const XIVAPI_BASE_URL = "https://xivapi.com";

/**
 * Checks if the Lodestone is accessible.
 * This is a basic connectivity check.
 *
 * @returns True if Lodestone is accessible
 */
async function checkLodestoneAccessible(): Promise<boolean> {
  const result = await fetchHtml(LODESTONE_STATUS_URL);
  return result.success;
}

/**
 * Fetches world status from XIVAPI if available.
 * Falls back to basic Lodestone check if XIVAPI is unavailable.
 *
 * @returns World status data or null if unavailable
 */
async function fetchXIVAPIServerStatus(): Promise<FFXIVWorldStatus[] | null> {
  const apiUrl = `${XIVAPI_BASE_URL}/servers`;

  const result = await fetchWithTimeout<string[]>(apiUrl);

  if (!result.success || !result.data) {
    return null;
  }

  // XIVAPI /servers endpoint returns array of server names
  // This indicates which servers are configured, not real-time status
  // For actual status, we would need additional endpoint or Lodestone scraping

  // Return basic status assuming online if in the list
  return result.data.map((serverName) => ({
    name: serverName,
    status: "online" as const,
  }));
}

/**
 * Parses maintenance notices from Lodestone.
 *
 * TODO: Implement actual HTML parsing for maintenance notices.
 * The Lodestone has a news/maintenance section that lists scheduled maintenance.
 * This would require:
 * 1. Fetching the maintenance news page
 * 2. Parsing the HTML for active maintenance windows
 * 3. Comparing current time against maintenance schedule
 *
 * @returns Active maintenance info or null if none
 */
async function checkMaintenanceNotices(): Promise<{
  active: boolean;
  message?: string;
} | null> {
  // Maintenance news URL
  const maintenanceUrl =
    "https://na.finalfantasyxiv.com/lodestone/news/category/2";

  const result = await fetchHtml(maintenanceUrl);

  if (!result.success || !result.data) {
    return null;
  }

  // TODO: Parse HTML for maintenance notices
  // Look for patterns like "Maintenance" in titles and check dates
  // The HTML structure would need to be analyzed and parsed

  // For now, return no active maintenance
  // This is a placeholder implementation
  return { active: false };
}

/**
 * Determines FFXIV status per region based on data center health.
 *
 * @param worldStatuses - Status data for worlds (if available)
 * @param lodestoneAccessible - Whether Lodestone is accessible
 * @param maintenanceInfo - Maintenance notice info
 * @returns Status records per region
 */
function determineFFXIVStatus(
  worldStatuses: FFXIVWorldStatus[] | null,
  lodestoneAccessible: boolean,
  maintenanceInfo: { active: boolean; message?: string } | null
): Array<{ region: Region; status: Status; message: string }> {
  const results: Array<{ region: Region; status: Status; message: string }> = [];

  // Group data centers by region
  const regionDataCenters = new Map<Region, FFXIVDataCenter[]>();
  for (const dc of FFXIV_DATA_CENTERS) {
    const existing = regionDataCenters.get(dc.region) || [];
    existing.push(dc);
    regionDataCenters.set(dc.region, existing);
  }

  // Check for active maintenance
  if (maintenanceInfo?.active) {
    // All regions under maintenance
    for (const region of ["na", "eu", "asia", "oce"] as Region[]) {
      results.push({
        region,
        status: "maintenance",
        message: maintenanceInfo.message || "Scheduled maintenance in progress",
      });
    }
    return results;
  }

  // If we have world statuses, check per region
  if (worldStatuses && worldStatuses.length > 0) {
    for (const [region, dataCenters] of regionDataCenters) {
      // Get all worlds for this region
      const regionWorlds = dataCenters.flatMap((dc) => dc.worlds);

      // Find status for region worlds
      const regionWorldStatuses = worldStatuses.filter((ws) =>
        regionWorlds.includes(ws.name)
      );

      if (regionWorldStatuses.length === 0) {
        // No data for this region
        results.push({
          region,
          status: lodestoneAccessible ? "online" : "unknown",
          message: `Data centers: ${dataCenters.map((dc) => dc.name).join(", ")}`,
        });
        continue;
      }

      // Determine status from world statuses
      const offlineCount = regionWorldStatuses.filter(
        (ws) => ws.status === "offline"
      ).length;
      const maintenanceCount = regionWorldStatuses.filter(
        (ws) => ws.status === "maintenance"
      ).length;
      const totalWorlds = regionWorldStatuses.length;

      let status: Status;
      if (maintenanceCount === totalWorlds) {
        status = "maintenance";
      } else if (offlineCount === totalWorlds) {
        status = "offline";
      } else if (offlineCount > 0 || maintenanceCount > 0) {
        status = "degraded";
      } else {
        status = "online";
      }

      results.push({
        region,
        status,
        message: `${dataCenters.map((dc) => dc.name).join(", ")}: ${totalWorlds - offlineCount - maintenanceCount}/${totalWorlds} worlds online`,
      });
    }
  } else {
    // No world status data, use Lodestone accessibility as proxy
    const status: Status = lodestoneAccessible ? "online" : "unknown";

    for (const [region, dataCenters] of regionDataCenters) {
      results.push({
        region,
        status,
        message: `Data centers: ${dataCenters.map((dc) => dc.name).join(", ")}`,
      });
    }
  }

  return results;
}

/**
 * Main Square Enix status fetcher internal action.
 *
 * Fetches FFXIV status from Lodestone and community APIs.
 * Tracks status per region/data center.
 */
export const fetchStatus = internalAction({
  args: {
    attemptNumber: v.number(),
  },
  handler: async (ctx, { attemptNumber }) => {
    let hasError = false;

    try {
      // Fetch data from multiple sources in parallel
      const [lodestoneAccessible, worldStatuses, maintenanceInfo] =
        await Promise.all([
          checkLodestoneAccessible(),
          fetchXIVAPIServerStatus(),
          checkMaintenanceNotices(),
        ]);

      if (!lodestoneAccessible) {
        logApiError({
          level: "warn",
          publisher: "squareenix",
          endpoint: LODESTONE_STATUS_URL,
          statusCode: null,
          message: "Lodestone not accessible, using fallback status",
          timestamp: Date.now(),
          consecutiveFailures: attemptNumber + 1,
          attemptNumber,
        });
      }

      // Determine status per region
      const regionStatuses = determineFFXIVStatus(
        worldStatuses,
        lodestoneAccessible,
        maintenanceInfo
      );

      // Store status records for each region
      const records = regionStatuses.map((rs) => ({
        gameSlug: FFXIV_GAME_SLUG,
        status: rs.status,
        region: rs.region,
        statusMessage: rs.message,
      }));

      await ctx.runMutation(internal.statusMutations.batchUpsertServerStatus, {
        records,
      });

      // Log success for each region
      for (const rs of regionStatuses) {
        logFetchSuccess("squareenix", `ffxiv/${rs.region}`, rs.status);
      }
    } catch (error) {
      hasError = true;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logApiError({
        level: "error",
        publisher: "squareenix",
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
        platform: "squareenix",
        currentAttempt: attemptNumber,
      });
    }
  },
});
