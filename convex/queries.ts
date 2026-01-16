/**
 * Dashboard Query Functions
 *
 * Public queries for fetching game status data for the dashboard display.
 * These queries are designed for reactive data fetching via useQuery hook.
 *
 * @module queries
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { platformValidator } from "./schema";
import type { Id, GamesDocument, ServerStatusRecordsDocument, Platform } from "./_generated/dataModel";

/**
 * Type representing combined game and status data for dashboard display.
 */
export interface GameWithStatus {
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
 * Internal type for game document from query.
 */
interface GameQueryResult {
  _id: string;
  slug: string;
  displayName: string;
  platform: string;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: number;
  _creationTime: number;
}

/**
 * Internal type for status record from query.
 */
interface StatusRecordQueryResult {
  _id: string;
  gameId: string;
  status: string;
  region: string;
  lastCheckedAt: number;
  statusChangedAt: number;
  statusMessage?: string;
  updatedAt: number;
  _creationTime: number;
}

/**
 * Fetches all active games with their current status records.
 *
 * This is the primary query for the dashboard, returning all games
 * grouped with their status information for display.
 *
 * @returns Array of games with their status records, sorted by platform then sortOrder
 *
 * @example
 * // In a React component:
 * const gamesWithStatus = useQuery(api.queries.getAllGamesWithStatus);
 */
export const getAllGamesWithStatus = query({
  args: {},
  handler: async (ctx): Promise<GameWithStatus[]> => {
    // Fetch all active games
    const allGames = await ctx.db.query("games").collect();

    // Cast to proper types and filter active games
    const games = allGames as unknown as GameQueryResult[];
    const activeGames = games.filter((game) => game.isActive);

    // Sort by platform first, then by sortOrder within platform
    const sortedGames = [...activeGames].sort((a, b) => {
      const platformCompare = a.platform.localeCompare(b.platform);
      if (platformCompare !== 0) return platformCompare;
      return a.sortOrder - b.sortOrder;
    });

    // Fetch all status records
    const allStatusRecords = await ctx.db.query("serverStatusRecords").collect();
    const statusRecords = allStatusRecords as unknown as StatusRecordQueryResult[];

    // Join games with their status records
    const gamesWithStatus: GameWithStatus[] = sortedGames.map((game) => {
      const gameStatusRecords = statusRecords
        .filter((sr) => sr.gameId === game._id)
        .map((sr) => ({
          _id: sr._id,
          status: sr.status,
          region: sr.region,
          lastCheckedAt: sr.lastCheckedAt,
          statusChangedAt: sr.statusChangedAt,
          statusMessage: sr.statusMessage,
        }));

      return {
        game: {
          _id: game._id,
          slug: game.slug,
          displayName: game.displayName,
          platform: game.platform,
          iconUrl: game.iconUrl,
          sortOrder: game.sortOrder,
          isActive: game.isActive,
        },
        statusRecords: gameStatusRecords,
      };
    });

    return gamesWithStatus;
  },
});

/**
 * Fetches games for a specific platform with their current status records.
 *
 * Uses the by_platform index for efficient lookup when filtering
 * by a single platform.
 *
 * @param platform - The platform to filter by (blizzard, riot, steam, epic, mojang, squareenix)
 * @returns Array of games with their status records, sorted by sortOrder
 *
 * @example
 * // In a React component:
 * const blizzardGames = useQuery(api.queries.getGamesByPlatform, { platform: "blizzard" });
 */
export const getGamesByPlatform = query({
  args: {
    platform: platformValidator,
  },
  handler: async (ctx, { platform }): Promise<GameWithStatus[]> => {
    // Fetch games for the specified platform using index
    const platformGames = await ctx.db
      .query("games")
      .withIndex("by_platform", (q) => q.eq("platform", platform))
      .collect();

    // Cast to proper types
    const games = platformGames as unknown as GameQueryResult[];

    // Filter to only active games and sort by sortOrder
    const activeGames = games
      .filter((game) => game.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // Fetch status records for these games
    const gameIds = new Set(activeGames.map((g) => g._id));
    const allStatusRecords = await ctx.db.query("serverStatusRecords").collect();
    const statusRecords = allStatusRecords as unknown as StatusRecordQueryResult[];
    const relevantStatusRecords = statusRecords.filter((sr) =>
      gameIds.has(sr.gameId)
    );

    // Join games with their status records
    const gamesWithStatus: GameWithStatus[] = activeGames.map((game) => {
      const gameStatusRecords = relevantStatusRecords
        .filter((sr) => sr.gameId === game._id)
        .map((sr) => ({
          _id: sr._id,
          status: sr.status,
          region: sr.region,
          lastCheckedAt: sr.lastCheckedAt,
          statusChangedAt: sr.statusChangedAt,
          statusMessage: sr.statusMessage,
        }));

      return {
        game: {
          _id: game._id,
          slug: game.slug,
          displayName: game.displayName,
          platform: game.platform,
          iconUrl: game.iconUrl,
          sortOrder: game.sortOrder,
          isActive: game.isActive,
        },
        statusRecords: gameStatusRecords,
      };
    });

    return gamesWithStatus;
  },
});
