/**
 * Mojang/Microsoft Integration
 *
 * Fetches server status for Minecraft using Mojang Status API.
 * Also checks Xbox Live status for authentication service dependencies.
 *
 * @module publishers/mojang
 *
 * ## Authentication
 * No API key required - uses public endpoints.
 *
 * ## Service Components
 * - Minecraft Session Server
 * - Minecraft Authentication
 * - Minecraft Skins
 * - Minecraft Textures
 * - Xbox Live (authentication dependency)
 */

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { fetchWithTimeout } from "../lib/fetchUtils";
import { logApiError, logFetchSuccess } from "../lib/logger";
import { shouldRetry } from "../lib/retry";
import type { Status, Region } from "../schema";

/**
 * Mojang status API response structure.
 * Note: Mojang has deprecated their official status API.
 * We use alternative endpoints and the Xbox Live status for auth.
 */
interface MojangServiceStatus {
  name: string;
  status: "green" | "yellow" | "red";
}

/**
 * Xbox Live status response structure (from Microsoft).
 */
interface XboxLiveStatusResponse {
  Status?: {
    State?: string;
    Description?: string;
  };
  CoreServices?: Array<{
    Id?: string;
    Status?: {
      State?: string;
      Description?: string;
    };
  }>;
}

/**
 * Minecraft game slug as defined in our games table.
 */
const MINECRAFT_GAME_SLUG = "minecraft";

/**
 * Mojang service endpoints to check.
 * Since the official status API is deprecated, we check service endpoints directly.
 */
const MOJANG_SERVICES = {
  session: {
    name: "Session Server",
    url: "https://sessionserver.mojang.com/",
    healthCheck: async (): Promise<boolean> => {
      const result = await fetchWithTimeout<Record<string, unknown>>(
        "https://sessionserver.mojang.com/"
      );
      return result.success;
    },
  },
  auth: {
    name: "Authentication",
    url: "https://authserver.mojang.com/",
    healthCheck: async (): Promise<boolean> => {
      const result = await fetchWithTimeout<Record<string, unknown>>(
        "https://authserver.mojang.com/"
      );
      return result.success;
    },
  },
  api: {
    name: "API",
    url: "https://api.mojang.com/",
    healthCheck: async (): Promise<boolean> => {
      const result = await fetchWithTimeout<Record<string, unknown>>(
        "https://api.mojang.com/"
      );
      return result.success;
    },
  },
  textures: {
    name: "Textures",
    url: "https://textures.minecraft.net/",
    healthCheck: async (): Promise<boolean> => {
      const result = await fetchWithTimeout<Record<string, unknown>>(
        "https://textures.minecraft.net/"
      );
      // Even a 404 means the server is responding
      return result.success || result.statusCode === 404;
    },
  },
} as const;

/**
 * Xbox Live status page URL.
 * Microsoft doesn't provide a public JSON API for Xbox Live status,
 * but we can check the support page or use a third-party aggregator.
 */
const XBOX_STATUS_URL = "https://support.xbox.com/en-US/xbox-live-status";

/**
 * Checks Xbox Live authentication service status.
 * This affects Minecraft since it uses Microsoft accounts for authentication.
 *
 * @returns The Xbox Live status
 */
async function checkXboxLiveStatus(): Promise<{ online: boolean; message: string }> {
  // Xbox Live doesn't have a public JSON API for status
  // We'll check if the Xbox support page is accessible as a proxy
  // In production, you might use the Microsoft Service Health API if available

  try {
    // Check Xbox Live support page accessibility
    const result = await fetchWithTimeout<string>(XBOX_STATUS_URL);

    if (result.success) {
      // Page is accessible, assume Xbox Live is operational
      // Note: This is a basic check. For more accurate status,
      // Microsoft Graph API with appropriate permissions would be needed.
      return { online: true, message: "Xbox Live: Accessible" };
    }

    return { online: false, message: "Xbox Live: Unable to reach status page" };
  } catch {
    return { online: false, message: "Xbox Live: Check failed" };
  }
}

/**
 * Checks all Mojang service endpoints.
 *
 * @returns Status for each service
 */
async function checkMojangServices(): Promise<
  Array<{ name: string; online: boolean }>
> {
  const results: Array<{ name: string; online: boolean }> = [];

  for (const [key, service] of Object.entries(MOJANG_SERVICES)) {
    try {
      const online = await service.healthCheck();
      results.push({ name: service.name, online });
    } catch {
      results.push({ name: service.name, online: false });
    }
  }

  return results;
}

/**
 * Determines overall Minecraft status from service checks.
 *
 * @param services - Results from Mojang service checks
 * @param xboxStatus - Xbox Live status check result
 * @returns The determined status and message
 */
function determineMojangStatus(
  services: Array<{ name: string; online: boolean }>,
  xboxStatus: { online: boolean; message: string }
): { status: Status; message: string } {
  const onlineCount = services.filter((s) => s.online).length;
  const totalServices = services.length;

  // Build status message
  const serviceParts = services.map(
    (s) => `${s.name}: ${s.online ? "OK" : "DOWN"}`
  );
  serviceParts.push(xboxStatus.online ? "Xbox Live: OK" : "Xbox Live: DOWN");
  const message = serviceParts.join(" | ");

  // Determine overall status
  // If Xbox Live is down, Minecraft auth is affected
  if (!xboxStatus.online) {
    return {
      status: "degraded",
      message: `Xbox Live auth unavailable. ${message}`,
    };
  }

  if (onlineCount === 0) {
    return { status: "offline", message };
  }

  if (onlineCount < totalServices) {
    return { status: "degraded", message };
  }

  return { status: "online", message };
}

/**
 * Main Mojang/Microsoft status fetcher internal action.
 *
 * Fetches Minecraft status by checking Mojang service endpoints
 * and Xbox Live authentication status.
 * No authentication required.
 */
export const fetchStatus = internalAction({
  args: {
    attemptNumber: v.number(),
  },
  handler: async (ctx, { attemptNumber }) => {
    let hasError = false;

    try {
      // Check all Mojang services in parallel
      const [mojangServices, xboxStatus] = await Promise.all([
        checkMojangServices(),
        checkXboxLiveStatus(),
      ]);

      // Log individual service results
      for (const service of mojangServices) {
        if (service.online) {
          logFetchSuccess("mojang", service.name.toLowerCase(), "online");
        }
      }

      // Determine overall status
      const { status, message } = determineMojangStatus(mojangServices, xboxStatus);

      // Store status in database (Minecraft is global)
      await ctx.runMutation(internal.statusMutations.upsertServerStatus, {
        gameSlug: MINECRAFT_GAME_SLUG,
        status,
        region: "global" as Region,
        statusMessage: message,
      });

      logFetchSuccess("mojang", "minecraft/global", status);

      // Check for any service failures
      const failedServices = mojangServices.filter((s) => !s.online);
      if (failedServices.length > 0 || !xboxStatus.online) {
        // Log warning about degraded services but don't trigger retry
        // since partial data is still useful
        console.log(
          `[INFO] Mojang: ${failedServices.length} services degraded, ` +
            `Xbox Live: ${xboxStatus.online ? "OK" : "DOWN"}`
        );
      }
    } catch (error) {
      hasError = true;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logApiError({
        level: "error",
        publisher: "mojang",
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
        platform: "mojang",
        currentAttempt: attemptNumber,
      });
    }
  },
});
