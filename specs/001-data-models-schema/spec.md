# Specification: Data Models and Schema

## Goal

Define the Convex database schema for GameStatus, establishing the foundational data models that support real-time server status monitoring, user personalization via favorites, and email alert subscriptions for game server availability.

## User Stories

- As a gamer, I want to see the current server status of all supported games so that I know which games are playable before launching them
- As a registered user, I want to save favorite games and subscribe to alerts so that I get notified when my preferred games come back online

## Specific Requirements

**Games Table**
- Store each supported game with a unique slug identifier for URL-friendly references
- Include display name, platform/publisher grouping (e.g., "blizzard", "riot", "steam")
- Store icon URL for dashboard display
- Include sort order field for controlling display sequence on the dashboard
- Track whether game is actively monitored (isActive boolean for soft-disable)

**Server Status Records Table**
- Store current status per game with enum values: "online", "offline", "degraded", "maintenance", "unknown"
- Include region field to track status per geographic region (e.g., "na", "eu", "asia", "oce", "global")
- Include timestamp for when status was last checked (lastCheckedAt)
- Include timestamp for when status last changed (statusChangedAt) for "down since" display
- Store optional status message from the game provider
- Reference games table via foreign key relationship
- Keep one status record per game+region combination (historical data in separate table)

**Status History Table**
- Store historical status changes for pattern analysis and outage duration tracking
- Record previous status, new status, and timestamp of change
- Reference games table via foreign key
- Enable queries for "game was down for X hours" calculations
- Implement data retention policy consideration (field for TTL or archival flag)

**Users Table**
- Store user authentication data with email as unique identifier
- Include display name for personalization
- Store email verification status (isEmailVerified boolean)
- Include created and updated timestamps per standards
- Support future OAuth provider linking via optional providerType and providerId fields

**Favorites Table**
- Create junction table linking users to their favorite games
- Store user reference and game reference as compound relationship
- Include timestamp for when favorite was added (for sorting by recency)
- Enforce uniqueness on user-game combination to prevent duplicates

**Alert Subscriptions Table**
- Store user preferences for email notifications per game and region
- Reference user and game via foreign keys
- Include region field to subscribe to specific regional server alerts (using region enum)
- Track subscription status (isActive boolean for pause/resume)
- Store when alert was last sent to implement rate limiting (lastAlertSentAt)
- Include created timestamp for auditing subscription history
- Enforce uniqueness on user+game+region combination to prevent duplicates

**Status Enum Definition**
- Define status as union type: "online" | "offline" | "degraded" | "maintenance" | "unknown"
- Use "unknown" as default for newly added games before first status check
- "degraded" indicates partial functionality or performance issues
- "maintenance" indicates scheduled downtime vs unexpected "offline" status

**Region Enum Definition**
- Define region as union type: "na" | "eu" | "asia" | "oce" | "global"
- "na" for North America servers
- "eu" for Europe servers
- "asia" for Asia-Pacific servers (may include Korea, Japan, SEA depending on game)
- "oce" for Oceania/Australia servers
- "global" for games that don't have regional servers or when tracking aggregate status
- Games may have multiple status records (one per supported region)

**Platform/Publisher Grouping**
- Define platform enum: "blizzard" | "riot" | "steam" | "epic" | "mojang" | "squareenix"
- Group games by platform for potential filtered views
- Blizzard: World of Warcraft, Diablo IV, Overwatch 2, Hearthstone
- Riot: League of Legends, Valorant, Teamfight Tactics
- Individual: Steam, Fortnite, Minecraft, Final Fantasy XIV

**Indexes for Query Performance**
- Index games table on slug for URL-based lookups
- Index games table on platform for filtered dashboard views
- Index serverStatusRecords on gameId for status lookups
- Index serverStatusRecords on region for regional filtering
- Compound index on serverStatusRecords (gameId, region) for unique game+region lookups
- Index statusHistory on gameId and timestamp for historical queries
- Index favorites on userId for loading user's favorites list
- Index alertSubscriptions on userId and isActive for notification processing
- Index alertSubscriptions on gameId and region for finding subscribers when status changes
- Compound index on alertSubscriptions (userId, gameId, region) for uniqueness enforcement
- Compound index on favorites (userId, gameId) for uniqueness enforcement

**Convex Real-Time Considerations**
- Design schema to support Convex reactive queries for live dashboard updates
- ServerStatusRecords table should be optimized for frequent reads by all users
- Favorites and alertSubscriptions tables will be queried per-user session
- Status polling jobs will write to serverStatusRecords; design for write efficiency

## Existing Code to Leverage

**Convex Schema Patterns**
- Use Convex defineSchema and defineTable from "convex/server" for schema definition
- Apply Convex v validator types (v.string(), v.boolean(), v.number(), v.id()) for field definitions
- Follow Convex convention of automatic _id and _creationTime fields on all tables
- Reference related tables using v.id("tableName") for foreign key relationships

**Project Standards**
- Follow models.md standard: include created/updated timestamps on all tables for auditing
- Follow queries.md standard: index foreign keys and frequently queried fields
- Follow validation.md standard: use Convex validators for type enforcement at database level

## Out of Scope

- User authentication flow implementation (schema only, not auth logic)
- Email sending functionality (schema supports subscriptions, not sending)
- Status polling/fetching logic from external APIs
- Frontend components for displaying data
- API endpoint implementations for CRUD operations
- Migration scripts or seed data for initial games
- Rate limiting implementation details beyond schema fields
- Push notification subscriptions (email only for MVP)
- User roles or permissions system
