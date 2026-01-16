/**
 * Game Seeding Mutations
 *
 * Mutations for seeding game data into the database.
 * Run via: npx convex run seedGames:seedAllGames
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
 * Includes World of Warcraft, Overwatch 2, Diablo IV, and Hearthstone.
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
  {
    slug: "hearthstone",
    displayName: "Hearthstone",
    platform: "blizzard",
    iconUrl: "/icons/hearthstone.svg",
    sortOrder: 4,
    isActive: true,
  },
];

/**
 * Riot games to seed.
 * Includes League of Legends, Valorant, and Teamfight Tactics.
 */
const RIOT_GAMES: GameSeedData[] = [
  {
    slug: "league-of-legends",
    displayName: "League of Legends",
    platform: "riot",
    iconUrl: "/icons/league-of-legends.svg",
    sortOrder: 1,
    isActive: true,
  },
  {
    slug: "valorant",
    displayName: "Valorant",
    platform: "riot",
    iconUrl: "/icons/valorant.svg",
    sortOrder: 2,
    isActive: true,
  },
  {
    slug: "teamfight-tactics",
    displayName: "Teamfight Tactics",
    platform: "riot",
    iconUrl: "/icons/teamfight-tactics.svg",
    sortOrder: 3,
    isActive: true,
  },
];

/**
 * Steam platform game to seed.
 */
const STEAM_GAMES: GameSeedData[] = [
  {
    slug: "steam",
    displayName: "Steam",
    platform: "steam",
    iconUrl: "/icons/steam.svg",
    sortOrder: 1,
    isActive: true,
  },
];

/**
 * Epic Games to seed.
 * Includes Fortnite.
 */
const EPIC_GAMES: GameSeedData[] = [
  {
    slug: "fortnite",
    displayName: "Fortnite",
    platform: "epic",
    iconUrl: "/icons/fortnite.svg",
    sortOrder: 1,
    isActive: true,
  },
];

/**
 * Mojang/Microsoft games to seed.
 * Includes Minecraft.
 */
const MOJANG_GAMES: GameSeedData[] = [
  {
    slug: "minecraft",
    displayName: "Minecraft",
    platform: "mojang",
    iconUrl: "/icons/minecraft.svg",
    sortOrder: 1,
    isActive: true,
  },
];

/**
 * Square Enix games to seed.
 * Includes Final Fantasy XIV.
 */
const SQUAREENIX_GAMES: GameSeedData[] = [
  {
    slug: "final-fantasy-xiv",
    displayName: "Final Fantasy XIV",
    platform: "squareenix",
    iconUrl: "/icons/final-fantasy-xiv.svg",
    sortOrder: 1,
    isActive: true,
  },
];

/**
 * All games combined for seeding.
 */
export const ALL_GAMES: GameSeedData[] = [
  ...BLIZZARD_GAMES,
  ...RIOT_GAMES,
  ...STEAM_GAMES,
  ...EPIC_GAMES,
  ...MOJANG_GAMES,
  ...SQUAREENIX_GAMES,
];

/**
 * Helper function to seed games from a given array.
 * This is idempotent - it will skip games that already exist.
 */
async function seedGamesFromArray(
  ctx: { db: { query: (table: "games") => { withIndex: (name: string, fn: (q: { eq: (field: string, value: string) => unknown }) => unknown) => { first: () => Promise<{ _id: string } | null> } }; insert: (table: "games", data: GameSeedData & { updatedAt: number }) => Promise<void> } },
  games: GameSeedData[]
): Promise<{ added: number; skipped: number }> {
  const now = Date.now();
  let added = 0;
  let skipped = 0;

  for (const gameData of games) {
    const existingGame = await ctx.db
      .query("games")
      .withIndex("by_slug", (q) => q.eq("slug", gameData.slug))
      .first();

    if (existingGame) {
      console.log(`[INFO] Game "${gameData.displayName}" already exists, skipping.`);
      skipped++;
      continue;
    }

    await ctx.db.insert("games", {
      ...gameData,
      updatedAt: now,
    });

    console.log(`[INFO] Added game "${gameData.displayName}".`);
    added++;
  }

  return { added, skipped };
}

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
    const result = await seedGamesFromArray(ctx, BLIZZARD_GAMES);
    console.log(`[INFO] Blizzard seed complete. Added: ${result.added}, Skipped: ${result.skipped}`);
    return result;
  },
});

/**
 * Seeds Riot games into the database.
 *
 * @returns Object with counts of games added and skipped
 *
 * @example
 * // Run via CLI:
 * // npx convex run seedGames:seedRiotGames
 */
export const seedRiotGames = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await seedGamesFromArray(ctx, RIOT_GAMES);
    console.log(`[INFO] Riot seed complete. Added: ${result.added}, Skipped: ${result.skipped}`);
    return result;
  },
});

/**
 * Seeds Steam platform into the database.
 *
 * @returns Object with counts of games added and skipped
 *
 * @example
 * // Run via CLI:
 * // npx convex run seedGames:seedSteamGames
 */
export const seedSteamGames = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await seedGamesFromArray(ctx, STEAM_GAMES);
    console.log(`[INFO] Steam seed complete. Added: ${result.added}, Skipped: ${result.skipped}`);
    return result;
  },
});

/**
 * Seeds Epic games into the database.
 *
 * @returns Object with counts of games added and skipped
 *
 * @example
 * // Run via CLI:
 * // npx convex run seedGames:seedEpicGames
 */
export const seedEpicGames = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await seedGamesFromArray(ctx, EPIC_GAMES);
    console.log(`[INFO] Epic seed complete. Added: ${result.added}, Skipped: ${result.skipped}`);
    return result;
  },
});

/**
 * Seeds Mojang/Microsoft games into the database.
 *
 * @returns Object with counts of games added and skipped
 *
 * @example
 * // Run via CLI:
 * // npx convex run seedGames:seedMojangGames
 */
export const seedMojangGames = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await seedGamesFromArray(ctx, MOJANG_GAMES);
    console.log(`[INFO] Mojang seed complete. Added: ${result.added}, Skipped: ${result.skipped}`);
    return result;
  },
});

/**
 * Seeds Square Enix games into the database.
 *
 * @returns Object with counts of games added and skipped
 *
 * @example
 * // Run via CLI:
 * // npx convex run seedGames:seedSquareEnixGames
 */
export const seedSquareEnixGames = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await seedGamesFromArray(ctx, SQUAREENIX_GAMES);
    console.log(`[INFO] Square Enix seed complete. Added: ${result.added}, Skipped: ${result.skipped}`);
    return result;
  },
});

/**
 * Seeds ALL games from all platforms into the database.
 * This is the primary mutation to use for initial database setup.
 *
 * @returns Object with counts of games added and skipped
 *
 * @example
 * // Run via CLI:
 * // npx convex run seedGames:seedAllGames
 */
export const seedAllGames = mutation({
  args: {},
  handler: async (ctx) => {
    const result = await seedGamesFromArray(ctx, ALL_GAMES);
    console.log(`[INFO] All games seed complete. Added: ${result.added}, Skipped: ${result.skipped}`);
    return result;
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

/**
 * Updates icon URLs for ALL games to use local static paths.
 *
 * Run via: npx convex run seedGames:updateAllGameIcons
 *
 * @returns Object with count of games updated
 */
export const updateAllGameIcons = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let updated = 0;

    for (const gameData of ALL_GAMES) {
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

    console.log(`[INFO] All icons update complete. Updated: ${updated}`);
    return { updated };
  },
});
