/**
 * Subscriptions Mutations and Queries
 *
 * Provides the backend API for managing email alert subscriptions:
 * - upsertSubscription: Create or update subscriptions for a game with selected regions
 * - toggleSubscriptionActive: Pause or resume a subscription
 * - deleteSubscription: Remove a subscription entirely
 * - getUserSubscriptions: Get all subscriptions for the current user with game details
 * - getGameSubscription: Get subscription status for a specific game
 *
 * @module subscriptions
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel";
import { generateSecureToken } from "./lib/authUtils";

/**
 * Region type for subscriptions.
 */
type Region = "na" | "eu" | "asia" | "oce" | "global";

/**
 * All available regions for subscriptions.
 */
const ALL_REGIONS: Region[] = ["na", "eu", "asia", "oce", "global"];

/**
 * Generate a cryptographically secure random token for unsubscribe links.
 * Uses crypto.getRandomValues() via the shared generateSecureToken utility.
 */
function generateUnsubscribeToken(): string {
  return generateSecureToken(32);
}

/**
 * Upsert subscription for a game with selected regions.
 *
 * For each selected region: creates subscription if not exists, sets isActive to true if paused.
 * For each unselected region: deletes existing subscription record.
 *
 * @param gameId - The ID of the game to subscribe to
 * @param regions - Array of region codes to subscribe to
 * @param userId - Optional user ID (for custom auth systems without Convex native auth)
 * @returns Object with success status and subscription count
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * const upsertSubscription = useMutation(api.subscriptions.upsertSubscription);
 * const result = await upsertSubscription({ gameId: "game123", regions: ["na", "eu"], userId: "user123" });
 * console.log(`Subscribed to ${result.count} regions`);
 * ```
 */
export const upsertSubscription = mutation({
  args: {
    gameId: v.id("games"),
    regions: v.array(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { gameId, regions, userId: providedUserId }): Promise<{ success: boolean; count: number; gameName: string }> => {
    let userId: Id<"users"> | undefined = providedUserId;

    // If userId not provided, try to get from Convex auth identity
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        if (user) {
          userId = user._id;
        }
      }
    }

    if (!userId) {
      throw new Error("Authentication required to manage subscriptions");
    }

    // Verify user exists
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get game details for the response
    const game = await ctx.db.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // Validate regions
    const validRegions = regions.filter((r) =>
      ALL_REGIONS.includes(r as Region)
    ) as Region[];

    // Get existing subscriptions for this game
    const existingSubscriptions = await ctx.db
      .query("alertSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const gameIdStr = String(gameId);
    const gameSubscriptions = existingSubscriptions.filter(
      (sub) => String(sub.gameId) === gameIdStr
    );

    // Create a map of existing subscriptions by region
    type SubscriptionDoc = (typeof existingSubscriptions)[0];
    const existingByRegion = new Map<string, SubscriptionDoc>();
    for (const sub of gameSubscriptions) {
      existingByRegion.set(String(sub.region), sub);
    }

    // Process selected regions - create or reactivate
    for (const region of validRegions) {
      const existing = existingByRegion.get(region);
      if (existing) {
        // Reactivate if paused
        if (!existing.isActive) {
          await ctx.db.patch(existing._id as Id<"alertSubscriptions">, { isActive: true });
        }
      } else {
        // Create new subscription
        await ctx.db.insert("alertSubscriptions", {
          userId,
          gameId,
          region: region as "na" | "eu" | "asia" | "oce" | "global",
          isActive: true,
          unsubscribeToken: generateUnsubscribeToken(),
          createdAt: Date.now(),
        });
      }
    }

    // Process unselected regions - delete existing
    for (const region of ALL_REGIONS) {
      if (!validRegions.includes(region)) {
        const existing = existingByRegion.get(region);
        if (existing) {
          await ctx.db.delete(existing._id as Id<"alertSubscriptions">);
        }
      }
    }

    return {
      success: true,
      count: validRegions.length,
      gameName: String(game.displayName),
    };
  },
});

/**
 * Toggle subscription active state (pause/resume).
 *
 * @param subscriptionId - The ID of the subscription to toggle
 * @param isActive - The new active state
 * @returns The updated subscription
 * @throws Error if user is not authenticated or doesn't own the subscription
 *
 * @example
 * ```typescript
 * const toggleSubscriptionActive = useMutation(api.subscriptions.toggleSubscriptionActive);
 * await toggleSubscriptionActive({ subscriptionId: "sub123", isActive: false });
 * ```
 */
export const toggleSubscriptionActive = mutation({
  args: {
    subscriptionId: v.id("alertSubscriptions"),
    isActive: v.boolean(),
  },
  handler: async (ctx, { subscriptionId, isActive }): Promise<{ success: boolean }> => {
    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required to manage subscriptions");
    }

    // Look up user by email from identity
    const email = identity.email;
    if (!email) {
      throw new Error("User email not found in identity");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const userId = user._id;

    // Get the subscription
    const subscription = await ctx.db.get(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Verify ownership
    if (String(subscription.userId) !== String(userId)) {
      throw new Error("Not authorized to modify this subscription");
    }

    // Update isActive
    await ctx.db.patch(subscriptionId, { isActive });

    return { success: true };
  },
});

/**
 * Delete a subscription entirely.
 *
 * @param subscriptionId - The ID of the subscription to delete
 * @returns Success status
 * @throws Error if user is not authenticated or doesn't own the subscription
 *
 * @example
 * ```typescript
 * const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);
 * await deleteSubscription({ subscriptionId: "sub123" });
 * ```
 */
export const deleteSubscription = mutation({
  args: {
    subscriptionId: v.id("alertSubscriptions"),
  },
  handler: async (ctx, { subscriptionId }): Promise<{ success: boolean }> => {
    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required to manage subscriptions");
    }

    // Look up user by email from identity
    const email = identity.email;
    if (!email) {
      throw new Error("User email not found in identity");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const userId = user._id;

    // Get the subscription
    const subscription = await ctx.db.get(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Verify ownership
    if (String(subscription.userId) !== String(userId)) {
      throw new Error("Not authorized to delete this subscription");
    }

    // Delete the subscription
    await ctx.db.delete(subscriptionId);

    return { success: true };
  },
});

/**
 * Subscription with game details for display.
 */
export interface SubscriptionWithGame {
  _id: string;
  gameId: string;
  region: string;
  isActive: boolean;
  createdAt: number;
  game: {
    displayName: string;
    iconUrl: string;
    slug: string;
  } | null;
}

/**
 * Subscriptions grouped by game for settings page display.
 */
export interface GroupedSubscriptions {
  gameId: string;
  gameName: string;
  iconUrl: string;
  subscriptions: Array<{
    _id: string;
    region: string;
    isActive: boolean;
    createdAt: number;
  }>;
}

/**
 * Get all subscriptions for the current user with game details.
 *
 * Returns subscriptions grouped by game for efficient rendering.
 * Returns empty array for unauthenticated users.
 *
 * @returns Array of subscriptions with game details, grouped by game
 *
 * @example
 * ```typescript
 * const subscriptions = useQuery(api.subscriptions.getUserSubscriptions);
 * ```
 */
export const getUserSubscriptions = query({
  args: {},
  handler: async (ctx): Promise<GroupedSubscriptions[]> => {
    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return empty array for unauthenticated users
      return [];
    }

    // Look up user by email from identity
    const email = identity.email;
    if (!email) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      return [];
    }

    const userId = user._id;

    // Get all subscriptions for this user
    const subscriptions = await ctx.db
      .query("alertSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Get unique game IDs
    const gameIdSet = new Set<string>();
    for (const sub of subscriptions) {
      gameIdSet.add(String(sub.gameId));
    }
    const gameIds = Array.from(gameIdSet);

    // Fetch game details
    const gameMap = new Map<string, Doc<"games">>();
    for (const gameIdStr of gameIds) {
      const game = await ctx.db.get(gameIdStr as Id<"games">);
      if (game) {
        gameMap.set(gameIdStr, game as unknown as Doc<"games">);
      }
    }

    // Group subscriptions by game
    const groupedMap = new Map<string, GroupedSubscriptions>();

    for (const sub of subscriptions) {
      const gameIdStr = String(sub.gameId);
      const game = gameMap.get(gameIdStr);

      if (!groupedMap.has(gameIdStr)) {
        groupedMap.set(gameIdStr, {
          gameId: gameIdStr,
          gameName: game ? String(game.displayName) : "Unknown Game",
          iconUrl: game ? String(game.iconUrl) : "",
          subscriptions: [],
        });
      }

      const group = groupedMap.get(gameIdStr)!;
      group.subscriptions.push({
        _id: String(sub._id),
        region: String(sub.region),
        isActive: Boolean(sub.isActive),
        createdAt: Number(sub.createdAt),
      });
    }

    // Convert to array and sort by game name
    return Array.from(groupedMap.values()).sort((a, b) =>
      a.gameName.localeCompare(b.gameName)
    );
  },
});

/**
 * Game subscription status for bell icon.
 */
export interface GameSubscriptionStatus {
  isSubscribed: boolean;
  regions: string[];
  subscriptionIds: string[];
}

/**
 * Get subscription status for a specific game.
 *
 * Used by SubscriptionToggle to determine bell icon state.
 * Returns null for unauthenticated users.
 *
 * @param gameId - The ID of the game to check
 * @param userId - Optional user ID (for custom auth systems without Convex native auth)
 * @returns Subscription status with subscribed regions, or null if not authenticated
 *
 * @example
 * ```typescript
 * const status = useQuery(api.subscriptions.getGameSubscription, { gameId: "game123", userId: "user123" });
 * const isSubscribed = status?.isSubscribed ?? false;
 * ```
 */
export const getGameSubscription = query({
  args: {
    gameId: v.id("games"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { gameId, userId: providedUserId }): Promise<GameSubscriptionStatus | null> => {
    let userId: Id<"users"> | undefined = providedUserId;

    // If userId not provided, try to get from Convex auth identity
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        if (user) {
          userId = user._id;
        }
      }
    }

    if (!userId) {
      return null;
    }

    // Get all subscriptions for this user and game
    const subscriptions = await ctx.db
      .query("alertSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const gameIdStr = String(gameId);
    const gameSubscriptions = subscriptions.filter(
      (sub) => String(sub.gameId) === gameIdStr && sub.isActive
    );

    return {
      isSubscribed: gameSubscriptions.length > 0,
      regions: gameSubscriptions.map((sub) => String(sub.region)),
      subscriptionIds: gameSubscriptions.map((sub) => String(sub._id)),
    };
  },
});

/**
 * Get all subscription regions for a game (including inactive).
 *
 * Used by the region selection popover to pre-check existing regions.
 *
 * @param gameId - The ID of the game to check
 * @param userId - Optional user ID (for custom auth systems without Convex native auth)
 * @returns Array of subscribed regions (all subscriptions, not just active)
 */
export const getGameSubscribedRegions = query({
  args: {
    gameId: v.id("games"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { gameId, userId: providedUserId }): Promise<string[]> => {
    let userId: Id<"users"> | undefined = providedUserId;

    // If userId not provided, try to get from Convex auth identity
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity?.email) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        if (user) {
          userId = user._id;
        }
      }
    }

    if (!userId) {
      return [];
    }

    // Get all subscriptions for this user and game
    const subscriptions = await ctx.db
      .query("alertSubscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const gameIdStr = String(gameId);
    const gameSubscriptions = subscriptions.filter(
      (sub) => String(sub.gameId) === gameIdStr
    );

    return gameSubscriptions.map((sub) => String(sub.region));
  },
});
