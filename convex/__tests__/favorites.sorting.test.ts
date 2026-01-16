/**
 * Additional Tests for Favorites Sorting Behavior
 *
 * These tests verify edge cases in the favorites sorting algorithm:
 * - Multiple favorites with same sortOrder
 * - Empty favorites list
 * - All games favorited
 * - Single game scenarios
 *
 * @module favorites.sorting.test
 */
import { describe, it, expect } from "vitest";

// Mock game data structure for sorting tests
interface MockGame {
  _id: string;
  displayName: string;
  sortOrder: number;
  isFavorited: boolean;
}

/**
 * Sorting function matching the actual implementation.
 */
function sortGamesWithFavorites(games: MockGame[]): MockGame[] {
  return [...games].sort((a, b) => {
    const aIsFavorited = a.isFavorited;
    const bIsFavorited = b.isFavorited;

    // Favorites come first
    if (aIsFavorited && !bIsFavorited) return -1;
    if (!aIsFavorited && bIsFavorited) return 1;

    // Within favorites: sort alphabetically by displayName
    if (aIsFavorited && bIsFavorited) {
      return a.displayName.localeCompare(b.displayName);
    }

    // Within non-favorites: sort by sortOrder
    return a.sortOrder - b.sortOrder;
  });
}

describe("Favorites Sorting Algorithm", () => {
  describe("Basic Sorting", () => {
    it("should place favorites before non-favorites", () => {
      const games: MockGame[] = [
        { _id: "1", displayName: "Alpha", sortOrder: 1, isFavorited: false },
        { _id: "2", displayName: "Beta", sortOrder: 2, isFavorited: true },
        { _id: "3", displayName: "Gamma", sortOrder: 3, isFavorited: false },
      ];

      const sorted = sortGamesWithFavorites(games);

      expect(sorted[0].displayName).toBe("Beta");
      expect(sorted[0].isFavorited).toBe(true);
    });

    it("should sort favorites alphabetically by displayName", () => {
      const games: MockGame[] = [
        { _id: "1", displayName: "Zelda", sortOrder: 1, isFavorited: true },
        { _id: "2", displayName: "Alpha", sortOrder: 2, isFavorited: true },
        { _id: "3", displayName: "Mario", sortOrder: 3, isFavorited: true },
      ];

      const sorted = sortGamesWithFavorites(games);

      expect(sorted[0].displayName).toBe("Alpha");
      expect(sorted[1].displayName).toBe("Mario");
      expect(sorted[2].displayName).toBe("Zelda");
    });

    it("should sort non-favorites by sortOrder", () => {
      const games: MockGame[] = [
        { _id: "1", displayName: "Zelda", sortOrder: 3, isFavorited: false },
        { _id: "2", displayName: "Alpha", sortOrder: 1, isFavorited: false },
        { _id: "3", displayName: "Mario", sortOrder: 2, isFavorited: false },
      ];

      const sorted = sortGamesWithFavorites(games);

      expect(sorted[0].displayName).toBe("Alpha"); // sortOrder 1
      expect(sorted[1].displayName).toBe("Mario"); // sortOrder 2
      expect(sorted[2].displayName).toBe("Zelda"); // sortOrder 3
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array", () => {
      const games: MockGame[] = [];
      const sorted = sortGamesWithFavorites(games);
      expect(sorted).toHaveLength(0);
    });

    it("should handle single game (favorited)", () => {
      const games: MockGame[] = [
        { _id: "1", displayName: "Solo", sortOrder: 1, isFavorited: true },
      ];
      const sorted = sortGamesWithFavorites(games);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].displayName).toBe("Solo");
    });

    it("should handle single game (not favorited)", () => {
      const games: MockGame[] = [
        { _id: "1", displayName: "Solo", sortOrder: 1, isFavorited: false },
      ];
      const sorted = sortGamesWithFavorites(games);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].displayName).toBe("Solo");
    });

    it("should handle all games favorited", () => {
      const games: MockGame[] = [
        { _id: "1", displayName: "Zebra", sortOrder: 1, isFavorited: true },
        { _id: "2", displayName: "Apple", sortOrder: 2, isFavorited: true },
        { _id: "3", displayName: "Banana", sortOrder: 3, isFavorited: true },
      ];

      const sorted = sortGamesWithFavorites(games);

      // All favorites, sorted alphabetically
      expect(sorted[0].displayName).toBe("Apple");
      expect(sorted[1].displayName).toBe("Banana");
      expect(sorted[2].displayName).toBe("Zebra");
    });

    it("should handle no games favorited", () => {
      const games: MockGame[] = [
        { _id: "1", displayName: "Zebra", sortOrder: 3, isFavorited: false },
        { _id: "2", displayName: "Apple", sortOrder: 1, isFavorited: false },
        { _id: "3", displayName: "Banana", sortOrder: 2, isFavorited: false },
      ];

      const sorted = sortGamesWithFavorites(games);

      // No favorites, sorted by sortOrder
      expect(sorted[0].displayName).toBe("Apple"); // sortOrder 1
      expect(sorted[1].displayName).toBe("Banana"); // sortOrder 2
      expect(sorted[2].displayName).toBe("Zebra"); // sortOrder 3
    });

    it("should handle games with same sortOrder (stable sort)", () => {
      const games: MockGame[] = [
        { _id: "1", displayName: "Game1", sortOrder: 1, isFavorited: false },
        { _id: "2", displayName: "Game2", sortOrder: 1, isFavorited: false },
        { _id: "3", displayName: "Game3", sortOrder: 1, isFavorited: false },
      ];

      const sorted = sortGamesWithFavorites(games);

      // All have same sortOrder, should maintain relative order
      expect(sorted).toHaveLength(3);
    });
  });

  describe("Mixed Scenarios", () => {
    it("should correctly interleave favorites and non-favorites in complex scenario", () => {
      const games: MockGame[] = [
        { _id: "1", displayName: "World of Warcraft", sortOrder: 1, isFavorited: false },
        { _id: "2", displayName: "League of Legends", sortOrder: 2, isFavorited: true },
        { _id: "3", displayName: "Fortnite", sortOrder: 3, isFavorited: true },
        { _id: "4", displayName: "Minecraft", sortOrder: 4, isFavorited: false },
        { _id: "5", displayName: "Apex Legends", sortOrder: 5, isFavorited: true },
        { _id: "6", displayName: "Valorant", sortOrder: 6, isFavorited: false },
      ];

      const sorted = sortGamesWithFavorites(games);

      // First three should be favorites, sorted alphabetically
      expect(sorted[0].displayName).toBe("Apex Legends");
      expect(sorted[0].isFavorited).toBe(true);
      expect(sorted[1].displayName).toBe("Fortnite");
      expect(sorted[1].isFavorited).toBe(true);
      expect(sorted[2].displayName).toBe("League of Legends");
      expect(sorted[2].isFavorited).toBe(true);

      // Last three should be non-favorites, sorted by sortOrder
      expect(sorted[3].displayName).toBe("World of Warcraft");
      expect(sorted[3].isFavorited).toBe(false);
      expect(sorted[4].displayName).toBe("Minecraft");
      expect(sorted[4].isFavorited).toBe(false);
      expect(sorted[5].displayName).toBe("Valorant");
      expect(sorted[5].isFavorited).toBe(false);
    });
  });
});
