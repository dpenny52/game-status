/**
 * Convex Database Schema for GameStatus
 *
 * This schema defines the foundational data models for real-time game server
 * status monitoring, user personalization, and alert subscriptions.
 *
 * @module schema
 *
 * ## Tables Overview
 * - `games` - Supported games with platform grouping
 * - `serverStatusRecords` - Current status per game+region combination
 * - `statusHistory` - Historical status changes for pattern analysis
 * - `users` - User authentication and profile data
 * - `favorites` - Junction table linking users to favorite games
 * - `alertSubscriptions` - Email notification preferences
 * - `authCredentials` - Password hashes for email/password auth
 * - `magicLinkTokens` - Tokens for passwordless authentication
 * - `passwordResetTokens` - Tokens for password reset flow
 *
 * ## Real-Time Considerations
 * This schema is optimized for Convex reactive queries:
 * - `serverStatusRecords` is designed for frequent reads by all users
 * - `favorites` and `alertSubscriptions` are queried per-user session
 * - Status polling jobs write to `serverStatusRecords`; design supports write efficiency
 *
 * ## Uniqueness Constraints
 * Compound uniqueness is enforced at the application layer:
 * - `favorites`: (userId, gameId) - use by_userId_gameId index to check before insert
 * - `alertSubscriptions`: (userId, gameId) - use compound index to check before insert
 * - `serverStatusRecords`: (gameId, region) - one record per combination
 * - `users`: email - use by_email index to check before insert
 */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Status Enum
 *
 * Represents the current state of a game server.
 *
 * @constant
 * @type {Validator}
 *
 * @description
 * Status values and their meanings:
 * - `"online"` - Server is fully operational and accepting connections
 * - `"offline"` - Server is down due to unexpected outage (not maintenance)
 * - `"degraded"` - Partial functionality or performance issues (e.g., high latency, some features unavailable)
 * - `"maintenance"` - Scheduled downtime announced by the game provider
 * - `"unknown"` - Default state before first status check; used for newly added games
 *
 * @example
 * // Use in a document
 * const statusRecord = {
 *   status: "online" as Status,
 *   // ...
 * };
 */
export const statusValidator = v.union(
  v.literal("online"),
  v.literal("offline"),
  v.literal("degraded"),
  v.literal("maintenance"),
  v.literal("unknown")
);

/**
 * Region Enum
 *
 * Represents geographic regions for server status tracking.
 * Games may have multiple status records (one per supported region).
 *
 * @constant
 * @type {Validator}
 *
 * @description
 * Region codes and coverage:
 * - `"na"` - North America servers (US, Canada)
 * - `"eu"` - Europe servers (Western and Eastern Europe)
 * - `"asia"` - Asia-Pacific servers (includes Korea, Japan, SEA depending on game)
 * - `"oce"` - Oceania/Australia servers (Australia, New Zealand)
 * - `"global"` - Games without regional servers or when tracking aggregate status
 *
 * @example
 * // Use for regional status tracking
 * const statusRecord = {
 *   region: "na" as Region,
 *   // ...
 * };
 */
export const regionValidator = v.union(
  v.literal("na"),
  v.literal("eu"),
  v.literal("asia"),
  v.literal("oce"),
  v.literal("global")
);

/**
 * Platform Enum
 *
 * Represents game publishers/platforms for grouping.
 *
 * @constant
 * @type {Validator}
 *
 * @description
 * Platform codes and associated games:
 * - `"blizzard"` - World of Warcraft, Diablo IV, Overwatch 2, Hearthstone
 * - `"riot"` - League of Legends, Valorant, Teamfight Tactics
 * - `"steam"` - Steam platform games
 * - `"epic"` - Epic Games Store / Fortnite
 * - `"mojang"` - Minecraft
 * - `"squareenix"` - Final Fantasy XIV
 *
 * @example
 * // Use for game categorization
 * const game = {
 *   platform: "blizzard" as Platform,
 *   // ...
 * };
 */
export const platformValidator = v.union(
  v.literal("blizzard"),
  v.literal("riot"),
  v.literal("steam"),
  v.literal("epic"),
  v.literal("mojang"),
  v.literal("squareenix")
);

/**
 * TypeScript type for status values.
 * @typedef {("online"|"offline"|"degraded"|"maintenance"|"unknown")} Status
 */
export type Status = "online" | "offline" | "degraded" | "maintenance" | "unknown";

/**
 * TypeScript type for region values.
 * @typedef {("na"|"eu"|"asia"|"oce"|"global")} Region
 */
export type Region = "na" | "eu" | "asia" | "oce" | "global";

/**
 * TypeScript type for platform values.
 * @typedef {("blizzard"|"riot"|"steam"|"epic"|"mojang"|"squareenix")} Platform
 */
export type Platform = "blizzard" | "riot" | "steam" | "epic" | "mojang" | "squareenix";

/**
 * GameStatus Database Schema
 *
 * Defines all tables for the game server status monitoring application.
 * Tables are designed for Convex reactive queries to enable real-time
 * dashboard updates.
 */
export default defineSchema({
  /**
   * Games Table
   *
   * Stores information about each supported game for server status monitoring.
   * Each game has a unique slug for URL-friendly references and belongs to a
   * platform/publisher group.
   *
   * @remarks
   * - Convex automatically provides `_id` and `_creationTime` fields
   * - Slug uniqueness is enforced at the application layer
   * - Use `isActive: false` to soft-disable monitoring without deleting the game
   *
   * @index by_slug - For URL-based lookups (e.g., /game/world-of-warcraft)
   * @index by_platform - For filtered dashboard views (e.g., show all Blizzard games)
   */
  games: defineTable({
    /** Unique identifier for URL-friendly references (e.g., "world-of-warcraft") */
    slug: v.string(),
    /** Human-readable game name for display (e.g., "World of Warcraft") */
    displayName: v.string(),
    /** Publisher/platform grouping for filtered views */
    platform: platformValidator,
    /** URL for dashboard icon display */
    iconUrl: v.string(),
    /** Controls display sequence on dashboard (lower numbers appear first) */
    sortOrder: v.number(),
    /** Soft-disable flag for monitoring - set to false to stop tracking */
    isActive: v.boolean(),
    /** Unix timestamp for last modification (for auditing) */
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_platform", ["platform"]),

  /**
   * Users Table
   *
   * Stores user authentication data and profile information.
   * Email serves as the unique identifier for authentication.
   * OAuth fields are optional to support future provider linking.
   *
   * @remarks
   * - Convex automatically provides `_id` and `_creationTime` fields
   * - Email uniqueness is enforced at the application layer
   * - Use by_email index to check for existing user before insert
   *
   * @index by_email - For authentication lookups and uniqueness enforcement
   */
  users: defineTable({
    /** Unique identifier for authentication - enforced at app layer */
    email: v.string(),
    /** Human-readable display name for personalization */
    displayName: v.string(),
    /** Whether the user's email has been verified */
    isEmailVerified: v.boolean(),
    /** OAuth provider name (e.g., "discord", "twitch") - optional */
    providerType: v.optional(v.string()),
    /** ID from OAuth provider - optional */
    providerId: v.optional(v.string()),
    /** Unix timestamp for last modification (auditing) */
    updatedAt: v.number(),
  })
    .index("by_email", ["email"]),

  /**
   * Auth Credentials Table
   *
   * Stores password hashes for users who sign up with email/password.
   * Separated from users table to allow for multiple auth methods per user.
   *
   * @remarks
   * - Password hashes should use bcrypt or argon2 in production
   * - One record per user with email/password authentication
   *
   * @index by_userId - For credential lookups during login
   */
  authCredentials: defineTable({
    /** Foreign key to users table */
    userId: v.id("users"),
    /** Hashed password (use bcrypt/argon2 in production) */
    passwordHash: v.string(),
    /** Unix timestamp for creation */
    createdAt: v.number(),
    /** Unix timestamp for last modification */
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  /**
   * Magic Link Tokens Table
   *
   * Stores tokens for passwordless authentication via email.
   * Tokens are single-use and expire after 15 minutes.
   *
   * @remarks
   * - Tokens should be securely generated (32+ bytes of randomness)
   * - Clean up expired tokens periodically
   *
   * @index by_token - For token validation during authentication
   * @index by_email - For finding pending tokens for an email
   */
  magicLinkTokens: defineTable({
    /** Email address the token was sent to */
    email: v.string(),
    /** Secure random token */
    token: v.string(),
    /** Unix timestamp for creation */
    createdAt: v.number(),
    /** Unix timestamp for expiration */
    expiresAt: v.number(),
    /** Whether the token has been used */
    isUsed: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_email", ["email"]),

  /**
   * Password Reset Tokens Table
   *
   * Stores tokens for password reset flow.
   * Tokens are single-use and expire after 1 hour.
   *
   * @remarks
   * - Tokens should be securely generated (32+ bytes of randomness)
   * - Clean up expired tokens periodically
   *
   * @index by_token - For token validation during password reset
   * @index by_userId - For finding pending reset tokens for a user
   */
  passwordResetTokens: defineTable({
    /** Foreign key to users table */
    userId: v.id("users"),
    /** Email address for the user */
    email: v.string(),
    /** Secure random token */
    token: v.string(),
    /** Unix timestamp for creation */
    createdAt: v.number(),
    /** Unix timestamp for expiration */
    expiresAt: v.number(),
    /** Whether the token has been used */
    isUsed: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  /**
   * Server Status Records Table
   *
   * Stores the current status per game+region combination for real-time dashboard display.
   *
   * @remarks
   * ## Real-Time Query Optimization
   * This table is optimized for frequent reads by all users via Convex reactive queries.
   * All connected clients subscribing to status updates will receive live changes.
   *
   * ## One Record Per Game+Region Design
   * Each game+region combination has exactly one record. When status changes:
   * 1. Update this record with new status and timestamps
   * 2. Create a new entry in statusHistory for historical tracking
   *
   * Use the by_gameId_region compound index for unique lookups.
   *
   * @index by_gameId - For status lookups by game
   * @index by_region - For regional filtering (e.g., show all NA servers)
   * @index by_gameId_region - Compound index for unique game+region lookups
   */
  serverStatusRecords: defineTable({
    /** Foreign key to games table - references the game being monitored */
    gameId: v.id("games"),
    /** Current server state - uses status enum validator */
    status: statusValidator,
    /** Geographic region for this status record - uses region enum validator */
    region: regionValidator,
    /** Unix timestamp of last status poll from external API */
    lastCheckedAt: v.number(),
    /** Unix timestamp when status last changed - used for "down since" display */
    statusChangedAt: v.number(),
    /** Optional message from game provider (e.g., maintenance notes) */
    statusMessage: v.optional(v.string()),
    /** Unix timestamp for last modification (standard audit field) */
    updatedAt: v.number(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_region", ["region"])
    .index("by_gameId_region", ["gameId", "region"]),

  /**
   * Status History Table
   *
   * Stores historical status changes for pattern analysis and outage duration tracking.
   * Enables queries like "game was down for X hours" calculations.
   *
   * @remarks
   * ## Data Retention Policy
   * Use the `isArchived` flag to mark old records for cleanup or archival.
   * Recommended retention strategies:
   * - Archive records older than 90 days
   * - Keep archived records in cold storage for compliance
   * - Delete archived records based on storage constraints
   *
   * The isArchived field is optional and defaults to undefined (not archived).
   *
   * @index by_gameId - For game-specific history queries
   * @index by_timestamp - For time-range queries (e.g., outages in last 24 hours)
   */
  statusHistory: defineTable({
    /** Foreign key to games table - references the game whose status changed */
    gameId: v.id("games"),
    /** Server state before the change - uses status enum validator */
    previousStatus: statusValidator,
    /** Server state after the change - uses status enum validator */
    newStatus: statusValidator,
    /** Unix timestamp when the status transition occurred */
    timestamp: v.number(),
    /** TTL/archival flag for data retention policy - optional, defaults to not archived */
    isArchived: v.optional(v.boolean()),
  })
    .index("by_gameId", ["gameId"])
    .index("by_timestamp", ["timestamp"]),

  /**
   * Favorites Table (Junction Table)
   *
   * Links users to their favorite games for personalized dashboard views.
   * Enables quick access to frequently monitored games.
   *
   * @remarks
   * ## Compound Uniqueness Constraint
   * The (userId, gameId) combination must be unique to prevent duplicate favorites.
   * This uniqueness is enforced at the application layer:
   *
   * ```typescript
   * // Before inserting a new favorite, check for existing:
   * const existing = await ctx.db
   *   .query("favorites")
   *   .withIndex("by_userId_gameId", (q) =>
   *     q.eq("userId", userId).eq("gameId", gameId)
   *   )
   *   .first();
   *
   * if (existing) {
   *   throw new Error("Game already in favorites");
   * }
   * ```
   *
   * @index by_userId - For loading user's favorites list
   * @index by_userId_gameId - For uniqueness enforcement (userId, gameId)
   */
  favorites: defineTable({
    /** Foreign key to users table - references the user who favorited the game */
    userId: v.id("users"),
    /** Foreign key to games table - references the favorited game */
    gameId: v.id("games"),
    /** Unix timestamp for when favorite was added (for recency sorting) */
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_gameId", ["userId", "gameId"]),

  /**
   * Alert Subscriptions Table
   *
   * Stores user preferences for email notifications when game server status changes.
   * Users can subscribe to alerts for specific games and pause/resume subscriptions.
   *
   * @remarks
   * ## Rate Limiting Support
   * The `lastAlertSentAt` field enables rate limiting to prevent alert spam.
   * Recommended implementation:
   * - Check lastAlertSentAt before sending a new alert
   * - Enforce minimum interval between alerts (e.g., 5 minutes)
   * - Update lastAlertSentAt after each successful alert send
   *
   * ## Compound Uniqueness Constraint
   * The (userId, gameId) combination must be unique.
   * Enforced at the application layer using compound index lookups.
   *
   * @index by_userId - For user subscription management
   * @index by_userId_isActive - Compound index for notification processing (active subscriptions per user)
   */
  alertSubscriptions: defineTable({
    /** Foreign key to users table - references the subscriber */
    userId: v.id("users"),
    /** Foreign key to games table - references the game to monitor */
    gameId: v.id("games"),
    /** Pause/resume subscription flag - false to temporarily disable alerts */
    isActive: v.boolean(),
    /** Unix timestamp of last alert sent - used for rate limiting (optional) */
    lastAlertSentAt: v.optional(v.number()),
    /** Unix timestamp for subscription creation (auditing) */
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isActive", ["userId", "isActive"]),
});
