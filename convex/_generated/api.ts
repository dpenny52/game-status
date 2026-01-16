/**
 * Generated API Types
 *
 * This file provides type-safe references to Convex functions.
 * In a deployed Convex project, this file is auto-generated.
 */

import type { FunctionReference } from "convex/server";

type Platform = "blizzard" | "riot" | "steam" | "epic" | "mojang" | "squareenix";
type Status = "online" | "offline" | "degraded" | "maintenance" | "unknown";
type Region = "na" | "eu" | "asia" | "oce" | "global";

/**
 * Game with status data structure returned by queries.
 */
interface GameWithStatus {
  game: {
    _id: string;
    slug: string;
    displayName: string;
    platform: string;
    iconUrl: string;
    sortOrder: number;
    isActive: boolean;
  };
  statusRecords: Array<{
    _id: string;
    status: string;
    region: string;
    lastCheckedAt: number;
    statusChangedAt: number;
    statusMessage?: string;
  }>;
}

/**
 * Internal API references for server-to-server calls.
 */
export const internal = {
  statusFetcher: {
    dispatchAllPublishers: "_internal:statusFetcher:dispatchAllPublishers" as unknown as FunctionReference<
      "action",
      "internal",
      Record<string, never>,
      void
    >,
    scheduleRetry: "_internal:statusFetcher:scheduleRetry" as unknown as FunctionReference<
      "action",
      "internal",
      { platform: Platform; currentAttempt: number },
      void
    >,
  },
  statusMutations: {
    upsertServerStatus: "_internal:statusMutations:upsertServerStatus" as unknown as FunctionReference<
      "mutation",
      "internal",
      {
        gameSlug: string;
        status: Status;
        region: Region;
        statusMessage?: string;
      },
      string | null
    >,
    batchUpsertServerStatus: "_internal:statusMutations:batchUpsertServerStatus" as unknown as FunctionReference<
      "mutation",
      "internal",
      {
        records: Array<{
          gameSlug: string;
          status: Status;
          region: Region;
          statusMessage?: string;
        }>;
      },
      Array<{ gameSlug: string; success: boolean; error?: string }>
    >,
  },
  publishers: {
    blizzard: {
      fetchStatus: "_internal:publishers:blizzard:fetchStatus" as unknown as FunctionReference<
        "action",
        "internal",
        { attemptNumber: number },
        void
      >,
    },
    riot: {
      fetchStatus: "_internal:publishers:riot:fetchStatus" as unknown as FunctionReference<
        "action",
        "internal",
        { attemptNumber: number },
        void
      >,
    },
    steam: {
      fetchStatus: "_internal:publishers:steam:fetchStatus" as unknown as FunctionReference<
        "action",
        "internal",
        { attemptNumber: number },
        void
      >,
    },
    epic: {
      fetchStatus: "_internal:publishers:epic:fetchStatus" as unknown as FunctionReference<
        "action",
        "internal",
        { attemptNumber: number },
        void
      >,
    },
    mojang: {
      fetchStatus: "_internal:publishers:mojang:fetchStatus" as unknown as FunctionReference<
        "action",
        "internal",
        { attemptNumber: number },
        void
      >,
    },
    squareenix: {
      fetchStatus: "_internal:publishers:squareenix:fetchStatus" as unknown as FunctionReference<
        "action",
        "internal",
        { attemptNumber: number },
        void
      >,
    },
  },
};

/**
 * Public API references (for client-side calls).
 */
export const api = {
  queries: {
    getAllGamesWithStatus: "queries:getAllGamesWithStatus" as unknown as FunctionReference<
      "query",
      "public",
      Record<string, never>,
      GameWithStatus[]
    >,
    getGamesByPlatform: "queries:getGamesByPlatform" as unknown as FunctionReference<
      "query",
      "public",
      { platform: Platform },
      GameWithStatus[]
    >,
  },
};
