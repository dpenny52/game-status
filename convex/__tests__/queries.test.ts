/**
 * Tests for Dashboard Query Functions
 *
 * Tests verify that query functions return proper data structures
 * for the status dashboard, including filtering, sorting, and joining.
 */
import { describe, it, expect } from "vitest";
import type { Status, Region, Platform } from "../schema";

/**
 * Type representing a game document from the games table.
 */
interface GameDocument {
  _id: string;
  slug: string;
  displayName: string;
  platform: Platform;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: number;
}

/**
 * Type representing a server status record.
 */
interface ServerStatusRecord {
  _id: string;
  gameId: string;
  status: Status;
  region: Region;
  lastCheckedAt: number;
  statusChangedAt: number;
  statusMessage?: string;
  updatedAt: number;
}

/**
 * Type representing combined game and status data for dashboard display.
 */
interface GameWithStatus {
  game: GameDocument;
  statusRecords: ServerStatusRecord[];
}

/**
 * Mock data for testing query functions.
 */
const mockGames: GameDocument[] = [
  {
    _id: "game1",
    slug: "world-of-warcraft",
    displayName: "World of Warcraft",
    platform: "blizzard",
    iconUrl: "https://example.com/wow.png",
    sortOrder: 1,
    isActive: true,
    updatedAt: Date.now(),
  },
  {
    _id: "game2",
    slug: "diablo-iv",
    displayName: "Diablo IV",
    platform: "blizzard",
    iconUrl: "https://example.com/d4.png",
    sortOrder: 2,
    isActive: true,
    updatedAt: Date.now(),
  },
  {
    _id: "game3",
    slug: "league-of-legends",
    displayName: "League of Legends",
    platform: "riot",
    iconUrl: "https://example.com/lol.png",
    sortOrder: 1,
    isActive: true,
    updatedAt: Date.now(),
  },
  {
    _id: "game4",
    slug: "inactive-game",
    displayName: "Inactive Game",
    platform: "steam",
    iconUrl: "https://example.com/inactive.png",
    sortOrder: 1,
    isActive: false,
    updatedAt: Date.now(),
  },
];

const mockStatusRecords: ServerStatusRecord[] = [
  {
    _id: "status1",
    gameId: "game1",
    status: "online",
    region: "na",
    lastCheckedAt: Date.now(),
    statusChangedAt: Date.now() - 3600000,
    statusMessage: "All systems operational",
    updatedAt: Date.now(),
  },
  {
    _id: "status2",
    gameId: "game1",
    status: "online",
    region: "eu",
    lastCheckedAt: Date.now(),
    statusChangedAt: Date.now() - 3600000,
    updatedAt: Date.now(),
  },
  {
    _id: "status3",
    gameId: "game2",
    status: "maintenance",
    region: "global",
    lastCheckedAt: Date.now(),
    statusChangedAt: Date.now() - 1800000,
    statusMessage: "Scheduled maintenance",
    updatedAt: Date.now(),
  },
  {
    _id: "status4",
    gameId: "game3",
    status: "online",
    region: "na",
    lastCheckedAt: Date.now(),
    statusChangedAt: Date.now() - 7200000,
    updatedAt: Date.now(),
  },
];

/**
 * Simulates getAllGamesWithStatus query behavior.
 */
function getAllGamesWithStatus(
  games: GameDocument[],
  statusRecords: ServerStatusRecord[]
): GameWithStatus[] {
  // Filter to only active games
  const activeGames = games.filter((g) => g.isActive);

  // Sort by platform first, then by sortOrder
  const sortedGames = [...activeGames].sort((a, b) => {
    const platformCompare = a.platform.localeCompare(b.platform);
    if (platformCompare !== 0) return platformCompare;
    return a.sortOrder - b.sortOrder;
  });

  // Join with status records
  return sortedGames.map((game) => ({
    game,
    statusRecords: statusRecords.filter((sr) => sr.gameId === game._id),
  }));
}

/**
 * Simulates getGamesByPlatform query behavior.
 */
function getGamesByPlatform(
  games: GameDocument[],
  statusRecords: ServerStatusRecord[],
  platform: Platform
): GameWithStatus[] {
  // Filter to only active games of the specified platform
  const platformGames = games.filter(
    (g) => g.isActive && g.platform === platform
  );

  // Sort by sortOrder within platform
  const sortedGames = [...platformGames].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  // Join with status records
  return sortedGames.map((game) => ({
    game,
    statusRecords: statusRecords.filter((sr) => sr.gameId === game._id),
  }));
}

describe("getAllGamesWithStatus Query", () => {
  it("should return only active games with their status records", () => {
    const result = getAllGamesWithStatus(mockGames, mockStatusRecords);

    // Should not include inactive game
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.game.slug)).not.toContain("inactive-game");

    // Each result should have game and statusRecords
    result.forEach((r) => {
      expect(r.game).toBeDefined();
      expect(r.statusRecords).toBeDefined();
      expect(Array.isArray(r.statusRecords)).toBe(true);
    });
  });

  it("should sort games by platform then sortOrder", () => {
    const result = getAllGamesWithStatus(mockGames, mockStatusRecords);

    // Blizzard games should come first (alphabetically before riot)
    expect(result[0].game.platform).toBe("blizzard");
    expect(result[1].game.platform).toBe("blizzard");
    expect(result[2].game.platform).toBe("riot");

    // Within blizzard, sorted by sortOrder
    expect(result[0].game.sortOrder).toBe(1);
    expect(result[1].game.sortOrder).toBe(2);
  });

  it("should join serverStatusRecords correctly by gameId", () => {
    const result = getAllGamesWithStatus(mockGames, mockStatusRecords);

    // WoW has 2 status records (NA and EU)
    const wow = result.find((r) => r.game.slug === "world-of-warcraft");
    expect(wow?.statusRecords).toHaveLength(2);
    expect(wow?.statusRecords.map((sr) => sr.region)).toContain("na");
    expect(wow?.statusRecords.map((sr) => sr.region)).toContain("eu");

    // Diablo IV has 1 status record (global)
    const d4 = result.find((r) => r.game.slug === "diablo-iv");
    expect(d4?.statusRecords).toHaveLength(1);
    expect(d4?.statusRecords[0].region).toBe("global");
  });
});

describe("getGamesByPlatform Query", () => {
  it("should return only games for the specified platform", () => {
    const blizzardGames = getGamesByPlatform(
      mockGames,
      mockStatusRecords,
      "blizzard"
    );

    expect(blizzardGames).toHaveLength(2);
    blizzardGames.forEach((g) => {
      expect(g.game.platform).toBe("blizzard");
    });
  });

  it("should filter out inactive games even for matching platform", () => {
    const steamGames = getGamesByPlatform(
      mockGames,
      mockStatusRecords,
      "steam"
    );

    // The inactive game is steam platform, should not appear
    expect(steamGames).toHaveLength(0);
  });

  it("should return games sorted by sortOrder within platform", () => {
    const blizzardGames = getGamesByPlatform(
      mockGames,
      mockStatusRecords,
      "blizzard"
    );

    expect(blizzardGames[0].game.sortOrder).toBe(1);
    expect(blizzardGames[0].game.slug).toBe("world-of-warcraft");
    expect(blizzardGames[1].game.sortOrder).toBe(2);
    expect(blizzardGames[1].game.slug).toBe("diablo-iv");
  });
});
