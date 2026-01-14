# Task Breakdown: Data Models and Schema

## Overview
Total Tasks: 6 Task Groups, 30 Sub-tasks

This spec defines the Convex database schema for GameStatus, a game server status monitoring application. Tasks are organized by dependency order: foundational enums first, then independent tables, then dependent tables, and finally integration validation.

## Task List

### Foundation Layer

#### Task Group 1: Schema Setup and Enum Definitions
**Dependencies:** None

- [x] 1.0 Complete schema foundation and enum types
  - [x] 1.1 Write 3-5 focused tests for enum validators
    - Test status enum accepts valid values: "online", "offline", "degraded", "maintenance", "unknown"
    - Test region enum accepts valid values: "na", "eu", "asia", "oce", "global"
    - Test platform enum accepts valid values: "blizzard", "riot", "steam", "epic", "mojang", "squareenix"
    - Test enum validators reject invalid string values
  - [x] 1.2 Create schema file structure
    - Create `/convex/schema.ts` as main schema definition file
    - Import defineSchema, defineTable from "convex/server"
    - Import v validator from "convex/values"
  - [x] 1.3 Define status enum type
    - Create union type: `v.union(v.literal("online"), v.literal("offline"), v.literal("degraded"), v.literal("maintenance"), v.literal("unknown"))`
    - Document enum semantics: "unknown" = default before first check, "degraded" = partial functionality, "maintenance" = scheduled downtime
  - [x] 1.4 Define region enum type
    - Create union type: `v.union(v.literal("na"), v.literal("eu"), v.literal("asia"), v.literal("oce"), v.literal("global"))`
    - Document: "na" = North America, "eu" = Europe, "asia" = Asia-Pacific, "oce" = Oceania, "global" = no regional servers
  - [x] 1.5 Define platform enum type
    - Create union type: `v.union(v.literal("blizzard"), v.literal("riot"), v.literal("steam"), v.literal("epic"), v.literal("mojang"), v.literal("squareenix"))`
    - Document platform groupings: Blizzard (WoW, Diablo IV, Overwatch 2), Riot (LoL, Valorant), etc.
  - [x] 1.6 Ensure enum validator tests pass
    - Run ONLY the 3-5 tests written in 1.1
    - Verify enum types are correctly exported for reuse in table definitions

**Acceptance Criteria:**
- The 3-5 tests written in 1.1 pass
- Schema file created with proper Convex imports
- Status enum covers all five states
- Region enum covers all five regions
- Platform enum covers all six publishers
- Enums exported for use in table definitions

---

### Core Tables Layer

#### Task Group 2: Games Table
**Dependencies:** Task Group 1 (platform enum)

- [x] 2.0 Complete games table definition
  - [x] 2.1 Write 2-4 focused tests for games table schema
    - Test games table accepts valid game document with all required fields
    - Test slug field enforces string type
    - Test isActive boolean field validates correctly
    - Test platform field uses platform enum validator
  - [x] 2.2 Define games table schema
    - `slug`: v.string() - unique identifier for URL-friendly references
    - `displayName`: v.string() - human-readable game name
    - `platform`: platform enum type - publisher grouping
    - `iconUrl`: v.string() - URL for dashboard icon display
    - `sortOrder`: v.number() - controls display sequence on dashboard
    - `isActive`: v.boolean() - soft-disable flag for monitoring
    - `updatedAt`: v.number() - Unix timestamp for last modification
    - Note: _id and _creationTime auto-provided by Convex
  - [x] 2.3 Add games table indexes
    - Index on `slug` for URL-based lookups
    - Index on `platform` for filtered dashboard views
  - [x] 2.4 Ensure games table tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify table definition compiles without errors

**Acceptance Criteria:**
- The 2-4 tests written in 2.1 pass
- Games table includes all required fields per spec
- Indexes defined for slug and platform
- Table supports soft-disable via isActive flag

---

#### Task Group 3: Users Table
**Dependencies:** Task Group 1 (schema setup)

- [x] 3.0 Complete users table definition
  - [x] 3.1 Write 2-4 focused tests for users table schema
    - Test users table accepts valid user document
    - Test email field enforces string type
    - Test isEmailVerified boolean validates correctly
    - Test optional OAuth fields accept undefined or valid values
  - [x] 3.2 Define users table schema
    - `email`: v.string() - unique identifier for authentication
    - `displayName`: v.string() - personalization display
    - `isEmailVerified`: v.boolean() - verification status
    - `providerType`: v.optional(v.string()) - OAuth provider name (optional)
    - `providerId`: v.optional(v.string()) - ID from OAuth provider (optional)
    - `updatedAt`: v.number() - Unix timestamp for auditing
    - Note: _id and _creationTime auto-provided by Convex
  - [x] 3.3 Add users table indexes
    - Index on `email` for authentication lookups (uniqueness enforced at app layer)
  - [x] 3.4 Ensure users table tests pass
    - Run ONLY the 2-4 tests written in 3.1
    - Verify table definition compiles without errors

**Acceptance Criteria:**
- The 2-4 tests written in 3.1 pass
- Users table includes authentication and profile fields
- Email serves as unique identifier
- OAuth fields optional for future extensibility
- Index on email for lookup performance

---

### Status Tracking Layer

#### Task Group 4: Server Status Tables
**Dependencies:** Task Group 1 (status and region enums), Task Group 2 (games table for foreign key)

- [x] 4.0 Complete server status tables
  - [x] 4.1 Write 4-6 focused tests for status tables
    - Test serverStatusRecords accepts valid status document with game reference
    - Test status field uses status enum validator
    - Test region field uses region enum validator
    - Test statusHistory accepts valid history document with previous/new status
    - Test foreign key references validate as v.id("games")
    - Test optional statusMessage field accepts string or undefined
  - [x] 4.2 Define serverStatusRecords table schema
    - `gameId`: v.id("games") - foreign key to games table
    - `status`: status enum type - current server state
    - `region`: region enum type - geographic region for this status record
    - `lastCheckedAt`: v.number() - Unix timestamp of last poll
    - `statusChangedAt`: v.number() - Unix timestamp for "down since" display
    - `statusMessage`: v.optional(v.string()) - optional provider message
    - `updatedAt`: v.number() - standard audit timestamp
    - Document: one record per game+region combination
  - [x] 4.3 Add serverStatusRecords indexes
    - Index on `gameId` for status lookups by game
    - Index on `region` for regional filtering
    - Compound index on [`gameId`, `region`] for unique game+region lookups
  - [x] 4.4 Define statusHistory table schema
    - `gameId`: v.id("games") - foreign key to games table
    - `previousStatus`: status enum type - state before change
    - `newStatus`: status enum type - state after change
    - `timestamp`: v.number() - Unix timestamp of status transition
    - `isArchived`: v.optional(v.boolean()) - TTL/archival flag for data retention
  - [x] 4.5 Add statusHistory indexes
    - Index on `gameId` for game-specific history queries
    - Index on `timestamp` for time-range queries
  - [x] 4.6 Ensure status tables tests pass
    - Run ONLY the 4-6 tests written in 4.1
    - Verify both tables compile without errors

**Acceptance Criteria:**
- The 4-6 tests written in 4.1 pass
- serverStatusRecords stores current status per game+region combination
- Region field supports five geographic regions
- statusHistory enables outage duration calculations
- Foreign key references properly typed as v.id("games")
- Indexes support regional filtering and historical queries

---

### User Preferences Layer

#### Task Group 5: Favorites and Alert Subscriptions Tables
**Dependencies:** Task Group 2 (games table), Task Group 3 (users table)

- [x] 5.0 Complete user preference tables
  - [x] 5.1 Write 3-5 focused tests for preference tables
    - Test favorites accepts valid document with user and game references
    - Test alertSubscriptions accepts valid subscription document
    - Test isActive boolean on subscriptions validates correctly
    - Test foreign key references validate as v.id("users") and v.id("games")
    - Test lastAlertSentAt optional field accepts number or undefined
  - [x] 5.2 Define favorites table schema (junction table)
    - `userId`: v.id("users") - foreign key to users table
    - `gameId`: v.id("games") - foreign key to games table
    - `createdAt`: v.number() - Unix timestamp for when favorite was added (for recency sorting)
    - Document: compound uniqueness on (userId, gameId) enforced at application layer
  - [x] 5.3 Add favorites table indexes
    - Index on `userId` for loading user's favorites list
    - Compound index on [`userId`, `gameId`] for uniqueness enforcement
  - [x] 5.4 Define alertSubscriptions table schema
    - `userId`: v.id("users") - foreign key to users table
    - `gameId`: v.id("games") - foreign key to games table
    - `isActive`: v.boolean() - pause/resume subscription flag
    - `lastAlertSentAt`: v.optional(v.number()) - rate limiting timestamp
    - `createdAt`: v.number() - subscription audit timestamp
  - [x] 5.5 Add alertSubscriptions indexes
    - Index on `userId` for user subscription management
    - Compound index on [`userId`, `isActive`] for notification processing
  - [x] 5.6 Ensure preference tables tests pass
    - Run ONLY the 3-5 tests written in 5.1
    - Verify both tables compile without errors

**Acceptance Criteria:**
- The 3-5 tests written in 5.1 pass
- Favorites enables user-game relationships with recency sorting
- AlertSubscriptions supports email notification preferences
- Rate limiting supported via lastAlertSentAt field
- Indexes optimized for per-user session queries and notification processing

---

### Validation and Integration

#### Task Group 6: Schema Integration and Final Validation
**Dependencies:** Task Groups 1-5

- [x] 6.0 Complete schema integration and validation
  - [x] 6.1 Review all tests from Task Groups 1-5
    - Review tests from enum definitions (Task 1.1): ~3-5 tests
    - Review tests from games table (Task 2.1): ~2-4 tests
    - Review tests from users table (Task 3.1): ~2-4 tests
    - Review tests from status tables (Task 4.1): ~4-6 tests
    - Review tests from preference tables (Task 5.1): ~3-5 tests
    - Total existing tests: approximately 14-24 tests
  - [x] 6.2 Assemble complete schema export
    - Combine all 6 table definitions in single defineSchema call
    - Tables: games, serverStatusRecords, statusHistory, users, favorites, alertSubscriptions
    - Verify all foreign key references point to valid table names
    - Export schema as default from `/convex/schema.ts`
  - [x] 6.3 Write up to 5 additional integration tests if needed
    - Test complete schema compiles and exports successfully
    - Test cross-table reference integrity (favorites references both users and games)
    - Test serverStatusRecords correctly references games with region support
    - Focus on integration points between tables
  - [x] 6.4 Add inline documentation
    - Document real-time query optimization notes for serverStatusRecords (frequent reads by all users)
    - Document compound uniqueness constraints for favorites (userId, gameId)
    - Document data retention considerations for statusHistory (isArchived flag)
    - Document one-record-per-game-region design for serverStatusRecords
    - Add JSDoc comments for enum semantics
  - [x] 6.5 Run all schema-related tests
    - Run ONLY tests related to this spec (tests from 1.1, 2.1, 3.1, 4.1, 5.1, and 6.3)
    - Expected total: approximately 19-29 tests maximum
    - Verify schema deploys to Convex without errors
    - Do NOT run unrelated application tests

**Acceptance Criteria:**
- All schema tests pass (approximately 19-29 tests total)
- Schema exports successfully from `/convex/schema.ts`
- All 6 tables defined with correct field types
- All table relationships properly typed with v.id() references
- All required indexes defined per spec
- Documentation inline for maintainability
- Schema ready for Convex deployment

---

## Execution Order

Recommended implementation sequence:

```
1. Schema Setup and Enum Definitions (Task Group 1)
   - Creates: status, region, platform enums
   |
   +---> 2. Games Table (Task Group 2)
   |         - Requires: platform enum
   |         |
   |         +---> 4. Server Status Tables (Task Group 4)
   |                   - Requires: games table, status enum, region enum
   |
   +---> 3. Users Table (Task Group 3)
             - Requires: schema setup only
             |
             +---> 5. Favorites and Alerts (Task Group 5)
                       - Requires: games table, users table
                       |
                       v
                  6. Schema Integration (Task Group 6)
                       - Requires: all tables complete
```

**Parallel Opportunities:**
- Task Groups 2 and 3 can be developed in parallel after Task Group 1
- Task Group 4 depends only on Task Groups 1 and 2
- Task Group 5 requires both Task Groups 2 and 3

---

## File Outputs

Upon completion, this spec should produce:

| File | Description |
|------|-------------|
| `/convex/schema.ts` | Complete Convex schema with all 6 tables and 3 enum types |
| Test files | 19-29 tests validating schema definitions and integration |

---

## Summary of Tables and Indexes

| Table | Fields | Indexes |
|-------|--------|---------|
| games | slug, displayName, platform, iconUrl, sortOrder, isActive, updatedAt | slug, platform |
| serverStatusRecords | gameId, status, region, lastCheckedAt, statusChangedAt, statusMessage, updatedAt | gameId, region, [gameId, region] |
| statusHistory | gameId, previousStatus, newStatus, timestamp, isArchived | gameId, timestamp |
| users | email, displayName, isEmailVerified, providerType, providerId, updatedAt | email |
| favorites | userId, gameId, createdAt | userId, [userId, gameId] |
| alertSubscriptions | userId, gameId, isActive, lastAlertSentAt, createdAt | userId, [userId, isActive] |

---

## Notes

- This is a schema-only spec; no API endpoints, mutations, or queries are in scope
- Convex provides automatic `_id` and `_creationTime` fields on all tables
- Uniqueness constraints (e.g., email in users, userId+gameId in favorites) must be enforced at application layer
- Schema designed to support Convex reactive queries for real-time dashboard updates
- serverStatusRecords optimized for frequent reads; one record per game+region combination
