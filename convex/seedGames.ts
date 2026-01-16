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
    iconUrl: "https://blz-contentstack-images.akamaized.net/v3/assets/blt72f16e066f85e164/blt7c8acd72ee31c554/6716fb52f00aaf4a9d1b3c61/WoW_Logo_Large_RGB.webp",
    sortOrder: 1,
    isActive: true,
  },
  {
    slug: "overwatch-2",
    displayName: "Overwatch 2",
    platform: "blizzard",
    iconUrl: "https://blz-contentstack-images.akamaized.net/v3/assets/blt72f16e066f85e164/blt6c8a56f0cec4e20a/6716fb51a8d28347e50cd22e/Overwatch_Logo_Large_RGB.webp",
    sortOrder: 2,
    isActive: true,
  },
  {
    slug: "diablo-iv",
    displayName: "Diablo IV",
    platform: "blizzard",
    iconUrl: "https://blz-contentstack-images.akamaized.net/v3/assets/blt72f16e066f85e164/blt2a5b89eb7e84d4a2/6716fb51764ea4eeae9b8e87/Diablo_IV_Logo_Large_RGB.webp",
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
