/**
 * Tests for Game Seeding Data
 *
 * These tests verify that the seed data for all games is correctly
 * structured and matches the expected games from product/mission.md.
 */
import { describe, it, expect } from "vitest";
import { ALL_GAMES } from "../seedGames";
import type { Platform } from "../schema";

/**
 * Expected games from product/mission.md organized by platform.
 */
const EXPECTED_GAMES_BY_PLATFORM: Record<Platform, string[]> = {
  blizzard: ["World of Warcraft", "Diablo IV", "Overwatch 2", "Hearthstone"],
  riot: ["League of Legends", "Valorant", "Teamfight Tactics"],
  steam: ["Steam"],
  epic: ["Fortnite"],
  mojang: ["Minecraft"],
  squareenix: ["Final Fantasy XIV"],
};

/**
 * Expected total game count from mission.md.
 * Blizzard: 4, Riot: 3, Steam: 1, Epic: 1, Mojang: 1, Square Enix: 1 = 11
 */
const EXPECTED_TOTAL_GAMES = 11;

describe("Game Seed Data", () => {
  describe("ALL_GAMES export", () => {
    it("should export an array of games", () => {
      expect(Array.isArray(ALL_GAMES)).toBe(true);
      expect(ALL_GAMES.length).toBeGreaterThan(0);
    });

    it("should contain exactly the expected number of games", () => {
      expect(ALL_GAMES.length).toBe(EXPECTED_TOTAL_GAMES);
    });

    it("should have unique slugs for all games", () => {
      const slugs = ALL_GAMES.map((game) => game.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });
  });

  describe("Game Document Structure", () => {
    it("should have all required fields for each game", () => {
      ALL_GAMES.forEach((game) => {
        expect(game).toHaveProperty("slug");
        expect(game).toHaveProperty("displayName");
        expect(game).toHaveProperty("platform");
        expect(game).toHaveProperty("iconUrl");
        expect(game).toHaveProperty("sortOrder");
        expect(game).toHaveProperty("isActive");
      });
    });

    it("should have correct field types for each game", () => {
      ALL_GAMES.forEach((game) => {
        expect(typeof game.slug).toBe("string");
        expect(typeof game.displayName).toBe("string");
        expect(typeof game.platform).toBe("string");
        expect(typeof game.iconUrl).toBe("string");
        expect(typeof game.sortOrder).toBe("number");
        expect(typeof game.isActive).toBe("boolean");
      });
    });

    it("should have non-empty slugs", () => {
      ALL_GAMES.forEach((game) => {
        expect(game.slug.length).toBeGreaterThan(0);
      });
    });

    it("should have non-empty display names", () => {
      ALL_GAMES.forEach((game) => {
        expect(game.displayName.length).toBeGreaterThan(0);
      });
    });

    it("should have valid icon URLs", () => {
      ALL_GAMES.forEach((game) => {
        expect(game.iconUrl).toMatch(/^\/icons\/.+\.(jpg|svg)$/);
      });
    });

    it("should have positive sort orders", () => {
      ALL_GAMES.forEach((game) => {
        expect(game.sortOrder).toBeGreaterThan(0);
      });
    });

    it("should have all games set to active", () => {
      ALL_GAMES.forEach((game) => {
        expect(game.isActive).toBe(true);
      });
    });
  });

  describe("Platform Coverage", () => {
    const validPlatforms: Platform[] = [
      "blizzard",
      "riot",
      "steam",
      "epic",
      "mojang",
      "squareenix",
    ];

    it("should only use valid platform values", () => {
      ALL_GAMES.forEach((game) => {
        expect(validPlatforms).toContain(game.platform);
      });
    });

    it("should have games for all expected platforms", () => {
      const platformsInData = new Set(ALL_GAMES.map((game) => game.platform));
      validPlatforms.forEach((platform) => {
        expect(platformsInData.has(platform)).toBe(true);
      });
    });

    it("should have correct number of games per platform", () => {
      Object.entries(EXPECTED_GAMES_BY_PLATFORM).forEach(
        ([platform, expectedGames]) => {
          const gamesForPlatform = ALL_GAMES.filter(
            (game) => game.platform === platform
          );
          expect(gamesForPlatform.length).toBe(expectedGames.length);
        }
      );
    });

    it("should have correct game names per platform", () => {
      Object.entries(EXPECTED_GAMES_BY_PLATFORM).forEach(
        ([platform, expectedGames]) => {
          const gamesForPlatform = ALL_GAMES.filter(
            (game) => game.platform === platform
          );
          const gameNames = gamesForPlatform.map((game) => game.displayName);
          expectedGames.forEach((expectedGame) => {
            expect(gameNames).toContain(expectedGame);
          });
        }
      );
    });
  });

  describe("Blizzard Games", () => {
    const blizzardGames = ALL_GAMES.filter(
      (game) => game.platform === "blizzard"
    );

    it("should include World of Warcraft", () => {
      const wow = blizzardGames.find(
        (game) => game.slug === "world-of-warcraft"
      );
      expect(wow).toBeDefined();
      expect(wow?.displayName).toBe("World of Warcraft");
    });

    it("should include Diablo IV", () => {
      const diablo = blizzardGames.find((game) => game.slug === "diablo-iv");
      expect(diablo).toBeDefined();
      expect(diablo?.displayName).toBe("Diablo IV");
    });

    it("should include Overwatch 2", () => {
      const overwatch = blizzardGames.find(
        (game) => game.slug === "overwatch-2"
      );
      expect(overwatch).toBeDefined();
      expect(overwatch?.displayName).toBe("Overwatch 2");
    });

    it("should include Hearthstone", () => {
      const hearthstone = blizzardGames.find(
        (game) => game.slug === "hearthstone"
      );
      expect(hearthstone).toBeDefined();
      expect(hearthstone?.displayName).toBe("Hearthstone");
    });
  });

  describe("Riot Games", () => {
    const riotGames = ALL_GAMES.filter((game) => game.platform === "riot");

    it("should include League of Legends", () => {
      const lol = riotGames.find((game) => game.slug === "league-of-legends");
      expect(lol).toBeDefined();
      expect(lol?.displayName).toBe("League of Legends");
    });

    it("should include Valorant", () => {
      const valorant = riotGames.find((game) => game.slug === "valorant");
      expect(valorant).toBeDefined();
      expect(valorant?.displayName).toBe("Valorant");
    });

    it("should include Teamfight Tactics", () => {
      const tft = riotGames.find((game) => game.slug === "teamfight-tactics");
      expect(tft).toBeDefined();
      expect(tft?.displayName).toBe("Teamfight Tactics");
    });
  });

  describe("Steam Platform", () => {
    const steamGames = ALL_GAMES.filter((game) => game.platform === "steam");

    it("should include Steam", () => {
      const steam = steamGames.find((game) => game.slug === "steam");
      expect(steam).toBeDefined();
      expect(steam?.displayName).toBe("Steam");
    });
  });

  describe("Epic Games", () => {
    const epicGames = ALL_GAMES.filter((game) => game.platform === "epic");

    it("should include Fortnite", () => {
      const fortnite = epicGames.find((game) => game.slug === "fortnite");
      expect(fortnite).toBeDefined();
      expect(fortnite?.displayName).toBe("Fortnite");
    });
  });

  describe("Mojang Games", () => {
    const mojangGames = ALL_GAMES.filter((game) => game.platform === "mojang");

    it("should include Minecraft", () => {
      const minecraft = mojangGames.find((game) => game.slug === "minecraft");
      expect(minecraft).toBeDefined();
      expect(minecraft?.displayName).toBe("Minecraft");
    });
  });

  describe("Square Enix Games", () => {
    const squareenixGames = ALL_GAMES.filter(
      (game) => game.platform === "squareenix"
    );

    it("should include Final Fantasy XIV", () => {
      const ffxiv = squareenixGames.find(
        (game) => game.slug === "final-fantasy-xiv"
      );
      expect(ffxiv).toBeDefined();
      expect(ffxiv?.displayName).toBe("Final Fantasy XIV");
    });
  });

  describe("Slug Format", () => {
    it("should use lowercase slugs with hyphens", () => {
      ALL_GAMES.forEach((game) => {
        expect(game.slug).toMatch(/^[a-z0-9-]+$/);
      });
    });

    it("should not have leading or trailing hyphens", () => {
      ALL_GAMES.forEach((game) => {
        expect(game.slug).not.toMatch(/^-/);
        expect(game.slug).not.toMatch(/-$/);
      });
    });

    it("should not have consecutive hyphens", () => {
      ALL_GAMES.forEach((game) => {
        expect(game.slug).not.toMatch(/--/);
      });
    });
  });

  describe("Sort Order Validation", () => {
    it("should have unique sort orders within each platform", () => {
      const platforms = [...new Set(ALL_GAMES.map((game) => game.platform))];

      platforms.forEach((platform) => {
        const platformGames = ALL_GAMES.filter(
          (game) => game.platform === platform
        );
        const sortOrders = platformGames.map((game) => game.sortOrder);
        const uniqueSortOrders = new Set(sortOrders);
        expect(uniqueSortOrders.size).toBe(sortOrders.length);
      });
    });

    it("should have sequential sort orders within each platform starting at 1", () => {
      const platforms = [...new Set(ALL_GAMES.map((game) => game.platform))];

      platforms.forEach((platform) => {
        const platformGames = ALL_GAMES.filter(
          (game) => game.platform === platform
        );
        const sortedGames = [...platformGames].sort(
          (a, b) => a.sortOrder - b.sortOrder
        );

        sortedGames.forEach((game, index) => {
          expect(game.sortOrder).toBe(index + 1);
        });
      });
    });
  });
});
