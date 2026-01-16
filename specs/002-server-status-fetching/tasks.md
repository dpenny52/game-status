# Task Breakdown: Server Status Fetching Service

## Overview
Total Tasks: 35

This is a backend-only service that implements scheduled polling of game status APIs. Since there is no frontend or dedicated API layer exposed to clients, the task groups focus on core infrastructure, publisher integrations, and testing.

## Task List

### Core Infrastructure

#### Task Group 1: Scheduler and Retry Framework
**Dependencies:** 001-data-models-schema must be implemented

- [x] 1.0 Complete core scheduler and retry infrastructure
  - [x] 1.1 Write 4-6 focused tests for scheduler and retry logic
    - Test cron scheduler triggers at expected interval
    - Test exponential backoff delay calculation (1s, 2s, 4s, 8s, 16s max)
    - Test retry counter resets on success
    - Test maximum retry attempts (5) enforced
    - Test parallel publisher dispatch (one failure does not block others)
  - [x] 1.2 Create crons.ts with main scheduler function
    - Define 60-second interval cron job
    - Dispatch internal actions for each publisher in parallel
    - Use Convex crons API pattern
  - [x] 1.3 Implement exponential backoff utility
    - Calculate delay: Math.min(1000 * Math.pow(2, attempt), 16000)
    - Track retry attempts per publisher
    - Use ctx.scheduler.runAfter for delayed retries
    - Maximum 5 retry attempts per cycle
  - [x] 1.4 Create publisher dispatch coordinator
    - Internal action that spawns per-publisher fetchers
    - Independent error handling per publisher
    - Continue processing when individual publishers fail
  - [x] 1.5 Implement error logging utility
    - Log publisher name, endpoint, status code, timestamp
    - Use Convex console logging
    - Track consecutive failures per publisher
  - [x] 1.6 Ensure scheduler infrastructure tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify scheduler configuration is correct
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 1.1 pass
- Cron job is configured for 60-second intervals
- Exponential backoff calculates correct delays
- Publishers are dispatched independently
- Error logging captures required fields

---

### Publisher Integrations

#### Task Group 2: Blizzard API Integration
**Dependencies:** Task Group 1

- [x] 2.0 Complete Blizzard API integration
  - [x] 2.1 Write 4-6 focused tests for Blizzard integration
    - Test OAuth2 client credentials authentication flow
    - Test token reuse across batched game requests
    - Test status mapping to internal enum (online, degraded, maintenance, offline, unknown)
    - Test regional status parsing (NA, EU, KR, TW)
    - Test graceful skip when credentials missing
  - [x] 2.2 Implement Battle.net OAuth2 authentication
    - Use client_id and client_secret from environment variables
    - Implement client credentials flow
    - Cache token for batch requests within single cycle
  - [x] 2.3 Create Blizzard status fetcher internal action
    - Fetch status for WoW, Diablo IV, Overwatch 2, Hearthstone
    - Batch all games in single API session
    - Parse regional data for NA, EU, KR, TW regions
    - 30-second timeout for HTTP requests
  - [x] 2.4 Implement WoW HTML scraping fallback
    - Activate only if official API lacks real-time status
    - Parse official WoW status page HTML
    - Add TODO comment documenting fallback trigger conditions
  - [x] 2.5 Create mutation to store Blizzard status results
    - Write to serverStatusRecords table
    - Update lastCheckedAt on every poll
    - Update statusChangedAt only when status changes
    - Include region field per 001-data-models-schema
  - [x] 2.6 Add TODO comments for incomplete API coverage
    - Document any Blizzard titles with missing real-time status
    - Note which endpoints were attempted
  - [x] 2.7 Ensure Blizzard integration tests pass
    - Run ONLY the 4-6 tests written in 2.1
    - Verify authentication and status fetching work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 2.1 pass
- OAuth2 authentication works correctly
- All four Blizzard games fetch status successfully
- Regional status tracked where available
- Graceful handling of missing credentials

---

#### Task Group 3: Riot Games API Integration
**Dependencies:** Task Group 1

- [x] 3.0 Complete Riot Games API integration
  - [x] 3.1 Write 4-6 focused tests for Riot integration
    - Test API key authentication
    - Test status fetching for LoL, Valorant, TFT
    - Test incident/maintenance array parsing
    - Test status mapping (Riot types to internal enum)
    - Test regional platform queries (NA1, EUW1, KR, etc.)
  - [x] 3.2 Create Riot status fetcher internal action
    - Use Riot API key from environment variables
    - Query Status API v4 for each game
    - Query per region: NA1, EUW1, KR, etc.
    - 30-second timeout for HTTP requests
  - [x] 3.3 Implement status parsing logic
    - Parse incident and maintenance arrays
    - Map Riot status types to internal enum
    - Determine overall status from multiple indicators
  - [x] 3.4 Create mutation to store Riot status results
    - Write to serverStatusRecords table
    - Store region-specific status records
    - Update timestamps appropriately
  - [x] 3.5 Ensure Riot integration tests pass
    - Run ONLY the 4-6 tests written in 3.1
    - Verify status fetching and parsing work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 3.1 pass
- All three Riot games fetch status successfully
- Regional status tracked per platform
- Status mapping is accurate

---

#### Task Group 4: Steam/Valve API Integration
**Dependencies:** Task Group 1

- [x] 4.0 Complete Steam/Valve API integration
  - [x] 4.1 Write 3-4 focused tests for Steam integration
    - Test Steam Web API connectivity check
    - Test graceful skip when API key not configured
    - Test status mapping for store and community
  - [x] 4.2 Create Steam status fetcher internal action
    - Use Steam Web API key from environment variables
    - Query ISteamWebAPIUtil/GetServerInfo for connectivity
    - Check store and community status
    - 30-second timeout for HTTP requests
  - [x] 4.3 Add TODO for CS2 status if needed
    - Document ICSGOServers_730/GetGameServersStatus endpoint
    - Mark as TODO if CS2 not in current game list
  - [x] 4.4 Create mutation to store Steam status results
    - Write to serverStatusRecords table
    - Store platform-level status (store, community)
    - Update timestamps appropriately
  - [x] 4.5 Ensure Steam integration tests pass
    - Run ONLY the 3-4 tests written in 4.1
    - Verify connectivity check works
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 3-4 tests written in 4.1 pass
- Steam platform status fetched successfully
- Graceful handling when API key missing
- TODO documented for CS2 if applicable

---

#### Task Group 5: Epic Games Integration
**Dependencies:** Task Group 1

- [x] 5.0 Complete Epic Games integration
  - [x] 5.1 Write 3-4 focused tests for Epic integration
    - Test public status page API fetch (no auth required)
    - Test component status parsing (game services, login, matchmaking)
    - Test status indicator mapping to internal enum
  - [x] 5.2 Create Epic status fetcher internal action
    - Query Epic Games public status page API endpoint
    - No authentication required
    - Parse Fortnite service components
    - 30-second timeout for HTTP requests
  - [x] 5.3 Implement status parsing logic
    - Parse component statuses from JSON response
    - Map Epic status indicators to internal enum
    - Aggregate component statuses to overall status
  - [x] 5.4 Create mutation to store Epic status results
    - Write to serverStatusRecords table
    - Store component-level details if schema supports
    - Update timestamps appropriately
  - [x] 5.5 Ensure Epic integration tests pass
    - Run ONLY the 3-4 tests written in 5.1
    - Verify status fetching and parsing work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 3-4 tests written in 5.1 pass
- Fortnite status fetched successfully
- Component statuses parsed correctly
- No authentication issues (public endpoint)

---

#### Task Group 6: Mojang/Microsoft Integration
**Dependencies:** Task Group 1

- [x] 6.0 Complete Mojang/Microsoft integration
  - [x] 6.1 Write 3-4 focused tests for Mojang integration
    - Test Mojang Status API fetch (no auth required)
    - Test Xbox Live status API check
    - Test individual service component tracking (session, auth, skins, textures)
  - [x] 6.2 Create Mojang status fetcher internal action
    - Query Mojang Status API (public endpoint)
    - Check Xbox Live status for auth dependencies
    - No API key required
    - 30-second timeout for HTTP requests
  - [x] 6.3 Implement service component parsing
    - Track session, auth, skins, textures components
    - Determine overall Minecraft status from components
    - Include Xbox Live auth status in assessment
  - [x] 6.4 Create mutation to store Mojang status results
    - Write to serverStatusRecords table
    - Store component-level details if schema supports
    - Update timestamps appropriately
  - [x] 6.5 Ensure Mojang integration tests pass
    - Run ONLY the 3-4 tests written in 6.1
    - Verify status fetching and parsing work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 3-4 tests written in 6.1 pass
- Minecraft status fetched successfully
- Service components tracked individually
- Xbox Live dependency checked

---

#### Task Group 7: Square Enix Integration
**Dependencies:** Task Group 1

- [x] 7.0 Complete Square Enix integration
  - [x] 7.1 Write 3-4 focused tests for Square Enix integration
    - Test Lodestone/FFXIV status endpoint fetch
    - Test data center status parsing (NA, EU, JP, OCE)
    - Test maintenance notice parsing
  - [x] 7.2 Create Square Enix status fetcher internal action
    - Query Lodestone API or FFXIV status endpoints
    - Parse status per data center/world
    - 30-second timeout for HTTP requests
  - [x] 7.3 Add TODO comments if API undocumented
    - Document if official API requires authentication
    - Note any undocumented endpoint limitations
    - Describe alternative approaches if needed
  - [x] 7.4 Implement maintenance notice parsing
    - Parse scheduled maintenance from official sources
    - Set status to "maintenance" when notices active
    - Track maintenance windows if available
  - [x] 7.5 Create mutation to store Square Enix status results
    - Write to serverStatusRecords table
    - Store region/data center specific status
    - Update timestamps appropriately
  - [x] 7.6 Ensure Square Enix integration tests pass
    - Run ONLY the 3-4 tests written in 7.1
    - Verify status fetching and parsing work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 3-4 tests written in 7.1 pass
- FFXIV status fetched successfully
- Regional/data center status tracked
- TODO documented if API limitations exist

---

### Testing

#### Task Group 8: Integration Testing and Gap Analysis
**Dependencies:** Task Groups 1-7

- [x] 8.0 Review existing tests and fill critical gaps
  - [x] 8.1 Review tests from Task Groups 1-7
    - Review 4-6 tests from scheduler/retry (Task 1.1)
    - Review 4-6 tests from Blizzard integration (Task 2.1)
    - Review 4-6 tests from Riot integration (Task 3.1)
    - Review 3-4 tests from Steam integration (Task 4.1)
    - Review 3-4 tests from Epic integration (Task 5.1)
    - Review 3-4 tests from Mojang integration (Task 6.1)
    - Review 3-4 tests from Square Enix integration (Task 7.1)
    - Total existing tests: approximately 25-34 tests
  - [x] 8.2 Analyze test coverage gaps for this feature only
    - Identify critical end-to-end workflows lacking coverage
    - Focus on cross-publisher coordination scenarios
    - Check error recovery and graceful degradation paths
    - Prioritize integration points over unit test gaps
  - [x] 8.3 Write up to 10 additional strategic tests maximum
    - Test full polling cycle with multiple publishers
    - Test mixed success/failure scenarios across publishers
    - Test database writes with correct schema compliance
    - Test credential missing scenarios for multiple publishers
    - Test retry exhaustion behavior
    - Focus on integration points not covered by individual publisher tests
  - [x] 8.4 Run feature-specific tests only
    - Run ONLY tests related to this spec (tests from 1.1-7.1 and 8.3)
    - Expected total: approximately 35-44 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 35-44 tests total)
- Full polling cycle works end-to-end
- Cross-publisher error handling verified
- No more than 10 additional tests added
- Testing focused exclusively on this spec's requirements

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Scheduler and Retry Framework** - Core infrastructure required by all integrations
2. **Task Groups 2-7: Publisher Integrations** (can be implemented in parallel after Group 1)
   - Task Group 2: Blizzard API Integration
   - Task Group 3: Riot Games API Integration
   - Task Group 4: Steam/Valve API Integration
   - Task Group 5: Epic Games Integration
   - Task Group 6: Mojang/Microsoft Integration
   - Task Group 7: Square Enix Integration
3. **Task Group 8: Integration Testing and Gap Analysis** - Final verification

## Notes

- **No UI Layer:** This is a backend-only service; no frontend components required
- **No Exposed API:** The service writes directly to the database; no external API endpoints needed
- **Database Dependency:** Requires 001-data-models-schema to be implemented before starting
- **Environment Variables:** All API credentials stored in Convex environment variables
- **Regional Mapping:** Use standardized codes (NA, EU, ASIA, OCE, SA) across all publishers
- **Status Enum:** Use values from schema: "online", "offline", "degraded", "maintenance", "unknown"
