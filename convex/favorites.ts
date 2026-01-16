/**
 * Favorites Mutations and Queries
 *
 * Provides the backend API for managing user favorites:
 * - toggleFavorite: Add or remove a game from favorites
 * - getUserFavorites: Get all favorite game IDs for the current user
 *
 * @module favorites
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/**
 * Toggle a game as favorite for the authenticated user.
 *
 * If the game is not favorited, adds it to favorites.
 * If the game is already favorited, removes it from favorites.
 *
 * @param gameId - The ID of the game to toggle
 * @returns Boolean indicating the new favorite state (true = favorited, false = unfavorited)
 * @throws Error if user is not authenticated
 *
 * @example
 * ```typescript
 * const toggleFavorite = useMutation(api.favorites.toggleFavorite);
 * const isFavorited = await toggleFavorite({ gameId: "game123" });
 * console.log(isFavorited ? "Added to favorites" : "Removed from favorites");
 * ```
 */
export const toggleFavorite = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }): Promise<boolean> => {
    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required to toggle favorites");
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

    const userId = user._id as Id<"users">;

    // Check if favorite already exists
    // Query by userId first, then filter by gameId for compound uniqueness
    const userFavorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const existingFavorite = userFavorites.find(
      (fav) => (fav.gameId as string) === (gameId as string)
    );

    if (existingFavorite) {
      // Remove existing favorite
      const favoriteId = existingFavorite._id as Id<"favorites">;
      await ctx.db.delete(favoriteId);
      return false;
    } else {
      // Add new favorite
      await ctx.db.insert("favorites", {
        userId,
        gameId,
        createdAt: Date.now(),
      });
      return true;
    }
  },
});

/**
 * Get all favorite game IDs for the authenticated user.
 *
 * Returns an empty array for unauthenticated users (no error thrown).
 * This allows the query to be used safely in components that may
 * render before authentication state is determined.
 *
 * @returns Array of game IDs that the user has favorited
 *
 * @example
 * ```typescript
 * const favorites = useQuery(api.favorites.getUserFavorites);
 * const isFavorited = favorites?.includes(gameId);
 * ```
 */
export const getUserFavorites = query({
  args: {},
  handler: async (ctx): Promise<string[]> => {
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

    const userId = user._id as Id<"users">;

    // Get all favorites for this user
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Return array of game IDs
    return favorites.map((fav) => fav.gameId as string);
  },
});

/**
 * Check if a specific game is favorited by the current user.
 *
 * @param gameId - The ID of the game to check
 * @returns Boolean indicating if the game is favorited
 *
 * @example
 * ```typescript
 * const isFavorited = useQuery(api.favorites.isFavorited, { gameId: "game123" });
 * ```
 */
export const isFavorited = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }): Promise<boolean> => {
    // Get current user identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    // Look up user by email from identity
    const email = identity.email;
    if (!email) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      return false;
    }

    const userId = user._id as Id<"users">;

    // Query by userId first, then filter by gameId
    const userFavorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const favorite = userFavorites.find(
      (fav) => (fav.gameId as string) === (gameId as string)
    );

    return favorite !== undefined;
  },
});
