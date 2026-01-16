/**
 * Epic Games Integration
 *
 * Fetches server status for Epic Games / Fortnite using the public status page API.
 * No authentication required.
 *
 * @module publishers/epic
 *
 * ## Status Page
 * Uses Epic Games public status page API endpoint to get Fortnite status.
 *
 * ## Components Tracked
 * - Game Services
 * - Login
 * - Matchmaking
 * - Party
 * - Stats/Leaderboards
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { fetchWithTimeout } from "../lib/fetchUtils";
import { logApiError, logFetchSuccess } from "../lib/logger";
import { shouldRetry } from "../lib/retry";
import type { Status, Region } from "../schema";

/**
 * Epic Games status page API response structure.
 * Based on the Atlassian Statuspage format commonly used.
 */
interface EpicStatusPageResponse {
  page?: {
    id: string;
    name: string;
    url: string;
    time_zone: string;
    updated_at: string;
  };
  status?: {
    indicator: string; // none, minor, major, critical
    description: string;
  };
  components?: EpicStatusComponent[];
  incidents?: EpicStatusIncident[];
  scheduled_maintenances?: EpicStatusMaintenance[];
}

interface EpicStatusComponent {
  id: string;
  name: string;
  status: string; // operational, degraded_performance, partial_outage, major_outage
  created_at: string;
  updated_at: string;
  position: number;
  description?: string;
  showcase: boolean;
  group_id?: string;
  page_id: string;
  group: boolean;
  only_show_if_degraded: boolean;
  components?: string[];
}

interface EpicStatusIncident {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  impact: string;
  shortlink?: string;
  incident_updates?: Array<{
    id: string;
    status: string;
    body: string;
    created_at: string;
    updated_at: string;
  }>;
}

interface EpicStatusMaintenance {
  id: string;
  name: string;
  status: string;
  scheduled_for: string;
  scheduled_until: string;
  created_at: string;
  updated_at: string;
  impact: string;
}

/**
 * Epic Games status page URL.
 * This is the public API endpoint that returns JSON status data.
 */
const EPIC_STATUS_API_URL = "https://status.epicgames.com/api/v2/summary.json";

/**
 * Fortnite game slug as defined in our games table.
 */
const FORTNITE_GAME_SLUG = "fortnite";

/**
 * Fortnite-related component names to look for in the status page.
 */
const FORTNITE_COMPONENTS = [
  "Fortnite",
  "Login",
  "Matchmaking",
  "Game Services",
  "Party",
  "Stats & Leaderboards",
];

/**
 * Maps Epic status page indicator to our internal status enum.
 *
 * @param indicator - The Epic status indicator (none, minor, major, critical)
 * @returns The mapped internal status
 */
function mapEpicIndicatorToStatus(indicator: string): Status {
  switch (indicator.toLowerCase()) {
    case "none":
      return "online";
    case "minor":
      return "degraded";
    case "major":
      return "degraded";
    case "critical":
      return "offline";
    case "maintenance":
      return "maintenance";
    default:
      return "unknown";
  }
}

/**
 * Maps Epic component status to our internal status enum.
 *
 * @param componentStatus - The Epic component status string
 * @returns The mapped internal status
 */
function mapComponentStatusToInternal(componentStatus: string): Status {
  switch (componentStatus.toLowerCase()) {
    case "operational":
      return "online";
    case "degraded_performance":
      return "degraded";
    case "partial_outage":
      return "degraded";
    case "major_outage":
      return "offline";
    case "under_maintenance":
      return "maintenance";
    default:
      return "unknown";
  }
}

/**
 * Aggregates component statuses to determine overall Fortnite status.
 *
 * @param components - The status components from Epic API
 * @returns The aggregated status and a status message
 */
function aggregateFortniteStatus(
  components: EpicStatusComponent[]
): { status: Status; message: string } {
  // Filter to Fortnite-related components
  const fortniteComponents = components.filter(
    (c) =>
      FORTNITE_COMPONENTS.some((name) =>
        c.name.toLowerCase().includes(name.toLowerCase())
      ) || c.name.toLowerCase().includes("fortnite")
  );

  if (fortniteComponents.length === 0) {
    // If no specific Fortnite components found, use all components
    return aggregateAllComponents(components);
  }

  // Check each component status
  const componentStatuses = fortniteComponents.map((c) => ({
    name: c.name,
    status: mapComponentStatusToInternal(c.status),
  }));

  // Build status message
  const statusParts = componentStatuses.map((c) => `${c.name}: ${c.status}`);
  const message = statusParts.join(" | ");

  // Determine overall status (worst case wins)
  let overallStatus: Status = "online";

  for (const comp of componentStatuses) {
    if (comp.status === "offline") {
      overallStatus = "offline";
      break;
    }
    if (comp.status === "maintenance") {
      overallStatus = "maintenance";
    } else if (comp.status === "degraded" && overallStatus === "online") {
      overallStatus = "degraded";
    } else if (comp.status === "unknown" && overallStatus === "online") {
      overallStatus = "unknown";
    }
  }

  return { status: overallStatus, message };
}

/**
 * Aggregates all components when Fortnite-specific ones aren't found.
 *
 * @param components - All status components
 * @returns The aggregated status and message
 */
function aggregateAllComponents(
  components: EpicStatusComponent[]
): { status: Status; message: string } {
  const componentStatuses = components
    .filter((c) => !c.group) // Exclude group headers
    .map((c) => ({
      name: c.name,
      status: mapComponentStatusToInternal(c.status),
    }));

  if (componentStatuses.length === 0) {
    return { status: "unknown", message: "No component data available" };
  }

  // Determine overall status
  let overallStatus: Status = "online";
  let degradedCount = 0;
  let offlineCount = 0;

  for (const comp of componentStatuses) {
    if (comp.status === "offline") offlineCount++;
    if (comp.status === "degraded") degradedCount++;
    if (comp.status === "maintenance") overallStatus = "maintenance";
  }

  if (offlineCount > 0) {
    overallStatus = offlineCount === componentStatuses.length ? "offline" : "degraded";
  } else if (degradedCount > 0) {
    overallStatus = "degraded";
  }

  const message = `${componentStatuses.length} services: ${
    componentStatuses.filter((c) => c.status === "online").length
  } online, ${degradedCount} degraded, ${offlineCount} offline`;

  return { status: overallStatus, message };
}

/**
 * Fetches Epic Games status page data.
 *
 * @returns The status page response or null if failed
 */
async function fetchEpicStatusPage(): Promise<EpicStatusPageResponse | null> {
  const result = await fetchWithTimeout<EpicStatusPageResponse>(EPIC_STATUS_API_URL);

  if (!result.success || !result.data) {
    return null;
  }

  return result.data;
}

/**
 * Main Epic Games status fetcher internal action.
 *
 * Fetches Fortnite status from Epic Games public status page.
 * No authentication required.
 */
export const fetchStatus = internalAction({
  args: {
    attemptNumber: v.number(),
  },
  handler: async (ctx, { attemptNumber }) => {
    let hasError = false;

    try {
      const statusPage = await fetchEpicStatusPage();

      if (!statusPage) {
        hasError = true;
        logApiError({
          level: "error",
          publisher: "epic",
          endpoint: EPIC_STATUS_API_URL,
          statusCode: null,
          message: "Failed to fetch Epic Games status page",
          timestamp: Date.now(),
          consecutiveFailures: attemptNumber + 1,
          attemptNumber,
        });
      } else {
        // Determine status from page data
        let status: Status;
        let statusMessage: string;

        // Check for active incidents first
        if (statusPage.incidents && statusPage.incidents.length > 0) {
          const activeIncidents = statusPage.incidents.filter(
            (i) => i.status !== "resolved" && i.status !== "postmortem"
          );

          if (activeIncidents.length > 0) {
            status =
              activeIncidents[0].impact === "critical" ? "offline" : "degraded";
            statusMessage = activeIncidents[0].name;
          } else if (statusPage.components) {
            const result = aggregateFortniteStatus(statusPage.components);
            status = result.status;
            statusMessage = result.message;
          } else if (statusPage.status) {
            status = mapEpicIndicatorToStatus(statusPage.status.indicator);
            statusMessage = statusPage.status.description;
          } else {
            status = "unknown";
            statusMessage = "Unable to determine status";
          }
        } else if (statusPage.scheduled_maintenances) {
          // Check for active maintenance
          const now = new Date();
          const activeMaintenance = statusPage.scheduled_maintenances.filter(
            (m) => {
              const start = new Date(m.scheduled_for);
              const end = new Date(m.scheduled_until);
              return now >= start && now <= end;
            }
          );

          if (activeMaintenance.length > 0) {
            status = "maintenance";
            statusMessage = activeMaintenance[0].name;
          } else if (statusPage.components) {
            const result = aggregateFortniteStatus(statusPage.components);
            status = result.status;
            statusMessage = result.message;
          } else {
            status = "online";
            statusMessage = "All systems operational";
          }
        } else if (statusPage.components) {
          const result = aggregateFortniteStatus(statusPage.components);
          status = result.status;
          statusMessage = result.message;
        } else if (statusPage.status) {
          status = mapEpicIndicatorToStatus(statusPage.status.indicator);
          statusMessage = statusPage.status.description;
        } else {
          status = "unknown";
          statusMessage = "Unable to determine status";
        }

        // Store status in database (Fortnite is global for now)
        await ctx.runMutation(internal.statusMutations.upsertServerStatus, {
          gameSlug: FORTNITE_GAME_SLUG,
          status,
          region: "global" as Region,
          statusMessage,
        });

        logFetchSuccess("epic", "fortnite/global", status);
      }
    } catch (error) {
      hasError = true;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logApiError({
        level: "error",
        publisher: "epic",
        endpoint: EPIC_STATUS_API_URL,
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
        platform: "epic",
        currentAttempt: attemptNumber,
      });
    }
  },
});
