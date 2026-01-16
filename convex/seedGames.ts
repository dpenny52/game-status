/**
 * Game Seeding Mutations
 *
 * Mutations for seeding game data into the database.
 * Run via: npx convex run seedGames:seedBlizzardGames
 *
 * @module seedGames
 */

import { mutation } from "./_generated/server";
import type { Platform } from "./schema";

/**
 * Game data structure for seeding.
 */
interface GameSeedData {
  slug: string;
  displayName: string;
  platform: Platform;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Blizzard games to seed.
 * Includes World of Warcraft, Overwatch 2, and Diablo IV as requested.
 */
const BLIZZARD_GAMES: GameSeedData[] = [
  {
    slug: "world-of-warcraft",
    displayName: "World of Warcraft",
    platform: "blizzard",
    iconUrl: "/icons/world-of-warcraft.jpg",
    sortOrder: 1,
    isActive: true,
  },
  {
    slug: "overwatch-2",
    displayName: "Overwatch 2",
    platform: "blizzard",
    iconUrl: "/icons/overwatch-2.jpg",
    sortOrder: 2,
    isActive: true,
  },
  {
    slug: "diablo-iv",
    displayName: "Diablo IV",
    platform: "blizzard",
    iconUrl: "/icons/diablo-iv.jpg",
    sortOrder: 3,
    isActive: true,
  },
];

/**
 * Seeds Blizzard games into the database.
 *
 * This mutation is idempotent - it will skip games that already exist
 * (based on slug matching).
 *
 * @returns Object with counts of games added and skipped
 *
 * @example
 * // Run via CLI:
 * // npx convex run seedGames:seedBlizzardGames
 */
export const seedBlizzardGames = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let added = 0;
    let skipped = 0;

    for (const gameData of BLIZZARD_GAMES) {
      // Check if game already exists
      const existingGame = await ctx.db
        .query("games")
        .withIndex("by_slug", (q) => q.eq("slug", gameData.slug))
        .first();

      if (existingGame) {
        console.log(`[INFO] Game "${gameData.displayName}" already exists, skipping.`);
        skipped++;
        continue;
      }

      // Insert the new game
      await ctx.db.insert("games", {
        ...gameData,
        updatedAt: now,
      });

      console.log(`[INFO] Added game "${gameData.displayName}".`);
      added++;
    }

    console.log(`[INFO] Seed complete. Added: ${added}, Skipped: ${skipped}`);
    return { added, skipped };
  },
});

/**
 * Updates icon URLs for existing Blizzard games to use local static paths.
 *
 * Run via: npx convex run seedGames:updateBlizzardGameIcons
 *
 * @returns Object with count of games updated
 */
export const updateBlizzardGameIcons = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let updated = 0;

    for (const gameData of BLIZZARD_GAMES) {
      const existingGame = await ctx.db
        .query("games")
        .withIndex("by_slug", (q) => q.eq("slug", gameData.slug))
        .first();

      if (existingGame && existingGame.iconUrl !== gameData.iconUrl) {
        await ctx.db.patch(existingGame._id, {
          iconUrl: gameData.iconUrl,
          updatedAt: now,
        });
        console.log(`[INFO] Updated icon URL for "${gameData.displayName}".`);
        updated++;
      }
    }

    console.log(`[INFO] Icon update complete. Updated: ${updated}`);
    return { updated };
  },
});
