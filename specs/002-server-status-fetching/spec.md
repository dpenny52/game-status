# Specification: Server Status Fetching Service

## Goal

Build a backend service using Convex scheduled functions that polls official game status APIs for all supported publishers at 1-minute intervals, stores results in the Convex database, and handles failures gracefully with exponential backoff retry logic.

## User Stories

- As a gamer, I want the system to automatically check server status every minute so that I see up-to-date information when I visit the dashboard
- As a system operator, I want failed API calls to retry with exponential backoff so that temporary outages don't cause permanent data gaps

## Specific Requirements

**Convex Scheduled Function Architecture**
- Create a main scheduler function that runs every 60 seconds using Convex crons
- Dispatch separate internal actions for each publisher to enable parallel fetching
- Each publisher action should be independently retriable without affecting others
- Use Convex internal actions for external HTTP calls (mutations cannot make external requests)
- Store fetched results by calling mutations from within actions

**Blizzard API Integration**
- Integrate with Battle.net Game Data API for World of Warcraft, Diablo IV, Overwatch 2, and Hearthstone
- Authenticate using OAuth2 client credentials flow with client_id and client_secret from environment variables
- Batch all Blizzard games in a single API session to reuse authentication token
- Track regional status for NA, EU, KR, TW regions where API provides data
- Implement HTML scraping fallback for World of Warcraft only if official API lacks real-time status
- Add TODO comment if official API coverage is incomplete for other Blizzard titles

**Riot Games API Integration**
- Integrate with Riot Status API v4 for League of Legends, Valorant, and Teamfight Tactics
- Use Riot API key stored in Convex environment variables
- Query platform status endpoint per game and region (NA1, EUW1, KR, etc.)
- Parse incident and maintenance arrays to determine current status
- Map Riot status types to internal status enum (online, degraded, maintenance, offline)

**Steam/Valve API Integration**
- Integrate with Steam Web API for Steam platform status (store and community)
- Use ISteamWebAPIUtil/GetServerInfo for basic connectivity check
- Query ICSGOServers_730/GetGameServersStatus if CS2 status needed (mark as TODO if not in game list)
- Store API key in environment variables; skip gracefully if not configured

**Epic Games Integration**
- Query Epic Games public status page API endpoint for Fortnite status
- Parse status page JSON for component statuses (game services, login, matchmaking)
- Map Epic status indicators to internal status enum
- No authentication required for public status endpoint

**Mojang/Microsoft Integration**
- Query Mojang Status API for Minecraft service status
- Check Xbox Live status API for authentication service dependencies
- No API key required for Mojang public endpoints
- Track individual service components (session, auth, skins, textures)

**Square Enix Integration**
- Query Lodestone API or FFXIV status endpoints for Final Fantasy XIV
- Track status per data center/world where available (NA, EU, JP, OCE)
- Parse maintenance notices from official sources
- Add TODO comment if official API requires authentication or is undocumented

**Regional Status Tracking**
- Store region-specific status when APIs provide regional data
- Use standardized region codes: NA, EU, ASIA, OCE, SA for consistency
- Fall back to single global status for games without regional granularity
- Update serverStatusRecords with region field per 001-data-models-schema

**Exponential Backoff Retry Logic**
- Implement retry with delays: 1s, 2s, 4s, 8s, max 16s between attempts
- Maximum 5 retry attempts per publisher per polling cycle
- Reset retry counter on successful fetch
- Track consecutive failures per publisher for monitoring
- Do not block other publishers while one is retrying

**Error Handling and Logging**
- Log all API errors with publisher name, endpoint, status code, and timestamp
- Use Convex console logging for debugging visibility
- Catch and handle network timeouts (30 second default)
- Log warning when skipping publisher due to missing credentials
- Continue processing remaining publishers when one fails

## Existing Code to Leverage

**Convex Scheduled Functions Pattern**
- Use crons.ts to define interval-based scheduled functions
- Reference Convex documentation for ctx.scheduler.runAfter for delayed retries
- Use internalAction for external HTTP calls, internalMutation for database writes
- Follow Convex pattern of separating actions (side effects) from mutations (database only)

**Schema from 001-data-models-schema**
- Write to serverStatusRecords table defined in spec 001
- Reference games table by gameId for foreign key relationship
- Use status enum values: "online", "offline", "degraded", "maintenance", "unknown"
- Update lastCheckedAt timestamp on every poll; update statusChangedAt only when status changes

**Error Handling Standards**
- Follow global/error-handling.md: implement exponential backoff for transient failures
- Follow global/error-handling.md: graceful degradation when non-critical services fail
- Follow global/error-handling.md: fail fast with clear error messages

**API Standards**
- Follow backend/api.md: respect rate limiting by batching requests per publisher
- Store all API credentials in Convex environment variables, never in code

## Out of Scope

- Status history storage and trend analysis (roadmap item 9: Status History Display)
- Email or push notifications when status changes (roadmap item 7: Alert Notification Service)
- User-facing dashboard or UI components (roadmap item 3: Status Dashboard UI)
- Real-time WebSocket push updates to clients (roadmap item 8: Auto-Refresh and Real-Time Updates)
- Scraping fallback for any game other than World of Warcraft
- User authentication or session management
- Admin interface for managing games or credentials
- Custom polling intervals per game or publisher
- Webhook integrations for status change events
- Rate limit tracking or quota management dashboards
