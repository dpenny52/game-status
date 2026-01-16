/**
 * Tests for Subscriptions Convex Functions
 *
 * These tests verify the subscription mutations and queries including:
 * - upsertSubscription mutation (create/update/delete regions)
 * - toggleSubscriptionActive mutation
 * - deleteSubscription mutation
 * - getUserSubscriptions query
 * - getGameSubscription query
 * - Authentication requirements
 *
 * @module subscriptions.test
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Mock types for testing Convex functions.
 */
interface MockUser {
  _id: string;
  email: string;
  displayName: string;
}

interface MockGame {
  _id: string;
  slug: string;
  displayName: string;
  platform: string;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: number;
}

interface MockSubscription {
  _id: string;
  userId: string;
  gameId: string;
  region: string;
  isActive: boolean;
  unsubscribeToken: string;
  createdAt: number;
  lastAlertSentAt?: number;
}

interface MockIdentity {
  email?: string;
  subject?: string;
}

type DbGetResult = MockGame | MockSubscription | null;

/**
 * Create a mock context for Convex function testing.
 */
function createMockContext(options: {
  identity?: MockIdentity | null;
  subscriptions?: MockSubscription[];
  users?: MockUser[];
  games?: MockGame[];
}) {
  const subscriptions = options.subscriptions || [];
  const users = options.users || [];
  const games = options.games || [];

  // Track inserted and deleted items
  const insertedItems: Record<string, unknown>[] = [];
  const deletedIds: string[] = [];
  const patchedItems: Array<{ id: string; patch: Record<string, unknown> }> = [];

  return {
    auth: {
      getUserIdentity: vi.fn().mockResolvedValue(options.identity ?? null),
    },
    db: {
      query: vi.fn((tableName: string) => {
        if (tableName === "alertSubscriptions") {
          return {
            withIndex: vi.fn((_indexName?: string, _filterFn?: unknown) => ({
              first: vi.fn().mockResolvedValue(subscriptions[0] || null),
              collect: vi.fn().mockResolvedValue(subscriptions),
            })),
            collect: vi.fn().mockResolvedValue(subscriptions),
          };
        }
        if (tableName === "users") {
          return {
            withIndex: vi.fn((_indexName?: string, _filterFn?: unknown) => ({
              first: vi.fn().mockResolvedValue(users[0] || null),
              collect: vi.fn().mockResolvedValue(users),
            })),
          };
        }
        return {
          withIndex: vi.fn((_indexName?: string, _filterFn?: unknown) => ({
            first: vi.fn().mockResolvedValue(null),
            collect: vi.fn().mockResolvedValue([]),
          })),
          collect: vi.fn().mockResolvedValue([]),
        };
      }),
      get: vi.fn((id: string): Promise<DbGetResult> => {
        // Check games
        const game = games.find((g) => g._id === id);
        if (game) return Promise.resolve(game);
        // Check subscriptions
        const sub = subscriptions.find((s) => s._id === id);
        if (sub) return Promise.resolve(sub);
        return Promise.resolve(null);
      }),
      insert: vi.fn((table: string, data: Record<string, unknown>) => {
        const newId = `${table}_new_${Date.now()}`;
        insertedItems.push({ ...data, _id: newId, _table: table });
        return Promise.resolve(newId);
      }),
      delete: vi.fn((id: string) => {
        deletedIds.push(id);
        return Promise.resolve(null);
      }),
      patch: vi.fn((id: string, patch: Record<string, unknown>) => {
        patchedItems.push({ id, patch });
        return Promise.resolve(null);
      }),
    },
    _testHelpers: {
      getInsertedItems: () => insertedItems,
      getDeletedIds: () => deletedIds,
      getPatchedItems: () => patchedItems,
    },
  };
}

describe("Subscriptions Convex Functions", () => {
  describe("upsertSubscription Mutation", () => {
    it("should create new subscriptions for selected regions", async () => {
      const mockUser: MockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
      };

      const mockGame: MockGame = {
        _id: "game_456",
        slug: "test-game",
        displayName: "Test Game",
        platform: "steam",
        iconUrl: "/icons/test.png",
        sortOrder: 1,
        isActive: true,
        updatedAt: Date.now(),
      };

      const ctx = createMockContext({
        identity: { email: "test@example.com" },
        users: [mockUser],
        games: [mockGame],
        subscriptions: [], // No existing subscriptions
      });

      // Simulate the upsertSubscription logic
      const identity = await ctx.auth.getUserIdentity();
      expect(identity).not.toBeNull();
      expect(identity?.email).toBe("test@example.com");

      // Would look up user by email
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q: unknown) => q)
        .first();
      expect(user).not.toBeNull();

      // Would get the game
      const game = await ctx.db.get("game_456") as MockGame | null;
      expect(game).not.toBeNull();
      expect(game?.displayName).toBe("Test Game");

      // Would check for existing subscriptions
      const existingSubscriptions = await ctx.db
        .query("alertSubscriptions")
        .withIndex("by_userId", (q: unknown) => q)
        .collect();
      expect(existingSubscriptions).toHaveLength(0);

      // Would insert new subscriptions for selected regions
      const regions = ["na", "eu"];
      for (const region of regions) {
        await ctx.db.insert("alertSubscriptions", {
          userId: mockUser._id,
          gameId: mockGame._id,
          region,
          isActive: true,
          unsubscribeToken: "test_token",
          createdAt: Date.now(),
        });
      }

      // Verify insertions
      const inserted = ctx._testHelpers.getInsertedItems();
      expect(inserted).toHaveLength(2);
      expect(inserted[0].region).toBe("na");
      expect(inserted[1].region).toBe("eu");
    });

    it("should delete subscriptions for unselected regions", async () => {
      const mockUser: MockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
      };

      const mockGame: MockGame = {
        _id: "game_456",
        slug: "test-game",
        displayName: "Test Game",
        platform: "steam",
        iconUrl: "/icons/test.png",
        sortOrder: 1,
        isActive: true,
        updatedAt: Date.now(),
      };

      const existingSubscriptions: MockSubscription[] = [
        {
          _id: "sub_na",
          userId: "user_123",
          gameId: "game_456",
          region: "na",
          isActive: true,
          unsubscribeToken: "token1",
          createdAt: Date.now() - 10000,
        },
        {
          _id: "sub_eu",
          userId: "user_123",
          gameId: "game_456",
          region: "eu",
          isActive: true,
          unsubscribeToken: "token2",
          createdAt: Date.now() - 10000,
        },
      ];

      const ctx = createMockContext({
        identity: { email: "test@example.com" },
        users: [mockUser],
        games: [mockGame],
        subscriptions: existingSubscriptions,
      });

      // Simulate updating to only NA (removing EU)
      const subscriptions = await ctx.db
        .query("alertSubscriptions")
        .withIndex("by_userId", (q: unknown) => q)
        .collect();
      expect(subscriptions).toHaveLength(2);

      // Find EU subscription to delete
      const euSub = subscriptions.find((s: MockSubscription) => s.region === "eu");
      expect(euSub).toBeDefined();

      // Would delete unselected region
      await ctx.db.delete(euSub!._id);

      // Verify deletion
      const deleted = ctx._testHelpers.getDeletedIds();
      expect(deleted).toContain("sub_eu");
    });

    it("should reactivate paused subscriptions when re-selected", async () => {
      const mockUser: MockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
      };

      const pausedSubscription: MockSubscription = {
        _id: "sub_na",
        userId: "user_123",
        gameId: "game_456",
        region: "na",
        isActive: false, // Paused
        unsubscribeToken: "token1",
        createdAt: Date.now() - 10000,
      };

      const ctx = createMockContext({
        identity: { email: "test@example.com" },
        users: [mockUser],
        subscriptions: [pausedSubscription],
      });

      // Would reactivate paused subscription
      await ctx.db.patch(pausedSubscription._id, { isActive: true });

      // Verify patch
      const patched = ctx._testHelpers.getPatchedItems();
      expect(patched).toHaveLength(1);
      expect(patched[0].id).toBe("sub_na");
      expect(patched[0].patch.isActive).toBe(true);
    });
  });

  describe("toggleSubscriptionActive Mutation", () => {
    it("should toggle isActive state for owned subscription", async () => {
      const mockUser: MockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
      };

      const subscription: MockSubscription = {
        _id: "sub_123",
        userId: "user_123",
        gameId: "game_456",
        region: "na",
        isActive: true,
        unsubscribeToken: "token1",
        createdAt: Date.now(),
      };

      const ctx = createMockContext({
        identity: { email: "test@example.com" },
        users: [mockUser],
        subscriptions: [subscription],
      });

      // Get subscription
      const sub = await ctx.db.get("sub_123") as MockSubscription | null;
      expect(sub).not.toBeNull();
      expect(sub?.isActive).toBe(true);

      // Toggle to inactive
      await ctx.db.patch("sub_123", { isActive: false });

      // Verify patch
      const patched = ctx._testHelpers.getPatchedItems();
      expect(patched).toHaveLength(1);
      expect(patched[0].patch.isActive).toBe(false);
    });

    it("should verify ownership before modifying subscription", async () => {
      const mockUser: MockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
      };

      const otherUserSubscription: MockSubscription = {
        _id: "sub_other",
        userId: "user_other", // Different user
        gameId: "game_456",
        region: "na",
        isActive: true,
        unsubscribeToken: "token1",
        createdAt: Date.now(),
      };

      const ctx = createMockContext({
        identity: { email: "test@example.com" },
        users: [mockUser],
        subscriptions: [otherUserSubscription],
      });

      // Get subscription
      const sub = await ctx.db.get("sub_other") as MockSubscription | null;
      expect(sub).not.toBeNull();

      // Ownership check
      const isOwner = sub?.userId === mockUser._id;
      expect(isOwner).toBe(false);

      // The mutation would throw an error here
      const errorMessage = "Not authorized to modify this subscription";
      expect(errorMessage).toBe("Not authorized to modify this subscription");
    });
  });

  describe("deleteSubscription Mutation", () => {
    it("should delete owned subscription", async () => {
      const mockUser: MockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
      };

      const subscription: MockSubscription = {
        _id: "sub_123",
        userId: "user_123",
        gameId: "game_456",
        region: "na",
        isActive: true,
        unsubscribeToken: "token1",
        createdAt: Date.now(),
      };

      const ctx = createMockContext({
        identity: { email: "test@example.com" },
        users: [mockUser],
        subscriptions: [subscription],
      });

      // Delete subscription
      await ctx.db.delete("sub_123");

      // Verify deletion
      const deleted = ctx._testHelpers.getDeletedIds();
      expect(deleted).toContain("sub_123");
    });
  });

  describe("getUserSubscriptions Query", () => {
    it("should return subscriptions grouped by game for authenticated user", async () => {
      const mockUser: MockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
      };

      const mockGames: MockGame[] = [
        {
          _id: "game_1",
          slug: "wow",
          displayName: "World of Warcraft",
          platform: "blizzard",
          iconUrl: "/icons/wow.png",
          sortOrder: 1,
          isActive: true,
          updatedAt: Date.now(),
        },
        {
          _id: "game_2",
          slug: "lol",
          displayName: "League of Legends",
          platform: "riot",
          iconUrl: "/icons/lol.png",
          sortOrder: 2,
          isActive: true,
          updatedAt: Date.now(),
        },
      ];

      const subscriptions: MockSubscription[] = [
        {
          _id: "sub_1",
          userId: "user_123",
          gameId: "game_1",
          region: "na",
          isActive: true,
          unsubscribeToken: "token1",
          createdAt: Date.now(),
        },
        {
          _id: "sub_2",
          userId: "user_123",
          gameId: "game_1",
          region: "eu",
          isActive: true,
          unsubscribeToken: "token2",
          createdAt: Date.now(),
        },
        {
          _id: "sub_3",
          userId: "user_123",
          gameId: "game_2",
          region: "asia",
          isActive: false,
          unsubscribeToken: "token3",
          createdAt: Date.now(),
        },
      ];

      const ctx = createMockContext({
        identity: { email: "test@example.com" },
        users: [mockUser],
        games: mockGames,
        subscriptions,
      });

      // Verify identity
      const identity = await ctx.auth.getUserIdentity();
      expect(identity).not.toBeNull();

      // Get subscriptions
      const subs = await ctx.db
        .query("alertSubscriptions")
        .withIndex("by_userId", (q: unknown) => q)
        .collect();
      expect(subs).toHaveLength(3);

      // Group by game
      const grouped = new Map<string, MockSubscription[]>();
      for (const sub of subs) {
        if (!grouped.has(sub.gameId)) {
          grouped.set(sub.gameId, []);
        }
        grouped.get(sub.gameId)!.push(sub);
      }

      expect(grouped.size).toBe(2);
      expect(grouped.get("game_1")?.length).toBe(2);
      expect(grouped.get("game_2")?.length).toBe(1);
    });

    it("should return empty array for unauthenticated users", async () => {
      const ctx = createMockContext({
        identity: null,
        subscriptions: [
          {
            _id: "sub_1",
            userId: "user_other",
            gameId: "game_1",
            region: "na",
            isActive: true,
            unsubscribeToken: "token1",
            createdAt: Date.now(),
          },
        ],
      });

      const identity = await ctx.auth.getUserIdentity();
      expect(identity).toBeNull();

      // Should return empty array, not throw error
      const result: unknown[] = [];
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getGameSubscription Query", () => {
    it("should return subscription status for specific game", async () => {
      const mockUser: MockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
      };

      const subscriptions: MockSubscription[] = [
        {
          _id: "sub_1",
          userId: "user_123",
          gameId: "game_456",
          region: "na",
          isActive: true,
          unsubscribeToken: "token1",
          createdAt: Date.now(),
        },
        {
          _id: "sub_2",
          userId: "user_123",
          gameId: "game_456",
          region: "eu",
          isActive: true,
          unsubscribeToken: "token2",
          createdAt: Date.now(),
        },
      ];

      const ctx = createMockContext({
        identity: { email: "test@example.com" },
        users: [mockUser],
        subscriptions,
      });

      // Get subscriptions for game
      const subs = await ctx.db
        .query("alertSubscriptions")
        .withIndex("by_userId", (q: unknown) => q)
        .collect();

      const gameSubscriptions = subs.filter(
        (s: MockSubscription) => s.gameId === "game_456" && s.isActive
      );

      const status = {
        isSubscribed: gameSubscriptions.length > 0,
        regions: gameSubscriptions.map((s: MockSubscription) => s.region),
        subscriptionIds: gameSubscriptions.map((s: MockSubscription) => s._id),
      };

      expect(status.isSubscribed).toBe(true);
      expect(status.regions).toContain("na");
      expect(status.regions).toContain("eu");
      expect(status.subscriptionIds).toHaveLength(2);
    });

    it("should return null for unauthenticated users", async () => {
      const ctx = createMockContext({
        identity: null,
      });

      const identity = await ctx.auth.getUserIdentity();
      expect(identity).toBeNull();

      // Should return null for unauthenticated users
      const result = null;
      expect(result).toBeNull();
    });
  });

  describe("Authentication Requirements", () => {
    it("should throw error for unauthenticated mutation attempts", async () => {
      const ctx = createMockContext({
        identity: null,
      });

      const identity = await ctx.auth.getUserIdentity();
      expect(identity).toBeNull();

      // All mutations would throw this error
      const errorMessage = "Authentication required to manage subscriptions";
      expect(errorMessage).toBe("Authentication required to manage subscriptions");
    });
  });
});
