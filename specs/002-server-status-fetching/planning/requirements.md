# Spec Requirements: Server Status Fetching Service

## Initial Description

Build a backend service that polls official status APIs/endpoints for all supported games (Blizzard, Riot, Steam, Epic, Mojang, Square Enix) and stores results in Convex. This is the second item on the product roadmap and depends on the Data Models and Schema spec (001) being implemented first.

## Requirements Discussion

### First Round Questions

**Q1:** What polling frequency should we use for checking server status?
**Answer:** Use Convex's scheduled functions with an interval of 1 minute.

**Q2:** Should we batch API calls for games from the same publisher?
**Answer:** Yes, fetch all games from the same publisher in a single API call if possible.

**Q3:** How should the service handle missing API credentials during deployment?
**Answer:** Skip gracefully (don't block deployment). The service should continue operating for games with valid credentials.

**Q4:** Should we implement scraping as a fallback when official APIs are unavailable?
**Answer:** Start with documented APIs, leave TODO notes if no API available. Implement scraping fallback immediately for World of Warcraft if needed, but not for other games.

**Q5:** Should we track regional server status where available?
**Answer:** Yes, track regional server status where available (e.g., NA, EU, Asia regions).

**Q6:** How should the service handle API failures and errors?
**Answer:** Retry with exponential backoff, and log the error.

**Q7:** Should the service store status history for trend analysis?
**Answer:** No need to store status history (handled by separate feature - see roadmap item 9: Status History Display).

**Q8:** Are there any technical dependencies on other specs?
**Answer:** Schema implementation should happen first (this spec depends on 001-data-models-schema being implemented).

**Q9:** Is there anything that should be explicitly excluded from this spec?
**Answer:** Nothing explicit.

### Existing Code to Reference

No similar existing features identified for reference. This is a greenfield implementation for the GameStatus product.

### Follow-up Questions

None required - all requirements were provided comprehensively.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

N/A - This is a backend service spec without UI components.

## Requirements Summary

### Functional Requirements

- Poll official status APIs for all supported games at 1-minute intervals using Convex scheduled functions
- Batch API requests by publisher where possible to minimize API calls
- Store fetched status results in Convex database (schema defined in 001-data-models-schema)
- Track regional server status (NA, EU, Asia, etc.) where APIs provide this data
- Handle API failures with exponential backoff retry logic
- Log all errors for debugging and monitoring
- Skip games with missing credentials gracefully without blocking other games

### Supported Games and Publishers

**Blizzard (Battle.net):**
- World of Warcraft
- Diablo IV
- Overwatch 2
- Hearthstone

**Riot Games:**
- League of Legends
- Valorant
- Teamfight Tactics

**Valve:**
- Steam Platform (store and community status)

**Epic Games:**
- Fortnite

**Mojang/Microsoft:**
- Minecraft

**Square Enix:**
- Final Fantasy XIV

### API Integration Approach

| Publisher | Approach |
|-----------|----------|
| Blizzard | Official API first; scraping fallback for WoW only if needed |
| Riot Games | Official Riot API |
| Steam | Steam Web API |
| Epic Games | Official status endpoint |
| Mojang/Microsoft | Xbox/Mojang Status API |
| Square Enix | Lodestone API |

### Reusability Opportunities

- None identified - this is the first backend service being built for the product
- Future specs (Alert Notification Service, Status History Display) may reuse patterns established here

### Scope Boundaries

**In Scope:**
- Convex scheduled function for polling (1-minute interval)
- API integrations for all supported publishers
- Batched requests per publisher where supported
- Regional server status tracking
- Error handling with exponential backoff
- Error logging
- Graceful handling of missing credentials
- Scraping fallback for World of Warcraft only (if official API insufficient)
- TODO comments for games without documented APIs

**Out of Scope:**
- Status history storage (handled by roadmap item 9)
- User notifications (handled by roadmap item 7: Alert Notification Service)
- UI components (handled by roadmap item 3: Status Dashboard UI)
- Scraping fallback for games other than WoW
- Real-time push updates (handled by roadmap item 8: Auto-Refresh and Real-Time Updates)

### Technical Considerations

- **Database Dependency:** Requires schema from 001-data-models-schema to be implemented first
- **Convex Scheduled Functions:** Use Convex's built-in scheduling for the 1-minute polling interval
- **API Rate Limits:** Batching by publisher helps stay within rate limits
- **Credentials Management:** Store API keys/secrets in Convex environment variables
- **Exponential Backoff:** Implement standard backoff pattern (e.g., 1s, 2s, 4s, 8s) for retries
- **Regional Data:** APIs vary in regional granularity - capture what's available per publisher
- **TypeScript:** All code should be written in TypeScript consistent with the tech stack
