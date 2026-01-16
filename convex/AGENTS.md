# Convex Agent Notes

## Adding New Games to the Database

- Games must exist in the `games` table before status fetchers can update their status
- Use `seedGames.ts` mutations to add games:
  - `npx convex run seedGames:seedAllGames` - Seeds ALL games from all platforms
  - `npx convex run seedGames:seedBlizzardGames` - Seeds only Blizzard games
  - Platform-specific: `seedRiotGames`, `seedSteamGames`, `seedEpicGames`, `seedMojangGames`, `seedSquareEnixGames`
- The seed mutation is idempotent - it checks for existing games by slug before inserting
- Game slugs must match what the publisher fetchers expect (e.g., `world-of-warcraft`, `diablo-iv`, `overwatch-2`)
- ALL_GAMES array in seedGames.ts exports all game data for testing/reference

## Publisher Fetcher Pattern

- Each platform has its own fetcher in `convex/publishers/`
- Fetchers are scheduled by `statusFetcher.ts` via cron jobs
- Fetchers call `batchUpsertServerStatus` to update status records
- If a game slug doesn't exist in the database, the status update is skipped with a warning

## Schema Reference

- `games.slug` - URL-friendly unique identifier (indexed)
- `games.platform` - Publisher grouping (blizzard, riot, steam, epic, mojang, squareenix)
- `games.isActive` - Set to false to hide from dashboard without deleting
- `serverStatusRecords` - One record per (gameId, region) combination

## Convex Runtime Notes

- `Buffer` is NOT available in Convex runtime - use `btoa()` for base64 encoding
- When looping through regions in fetchers, use `continue` not `return` to skip failed regions
- `ctx.runMutation()` in actions runs the mutation asynchronously

## Blizzard API

- OAuth2 client credentials flow: `https://{region}.battle.net/oauth/token`
- Requires `BLIZZARD_CLIENT_ID` and `BLIZZARD_CLIENT_SECRET` env vars
- Taiwan (tw) region uses separate auth and may fail with standard credentials
- Real-time status API not available for most games - returns "unknown"

## Custom Auth vs Convex Native Auth

- This app uses a custom localStorage-based auth system, NOT Convex's native auth (Clerk/Auth0)
- `ctx.auth.getUserIdentity()` returns null because there's no JWT-based auth session
- Mutations/queries that need user context must accept an optional `userId` parameter
- Pattern: First check `providedUserId`, then fall back to `ctx.auth.getUserIdentity()` for flexibility
- Frontend passes `userId` from AuthContext's `user._id` to all subscription-related mutations

## Subscription Mutations

- `subscriptions:upsertSubscription` - Accepts optional `userId` for custom auth compatibility
- `subscriptions:getGameSubscription` - Accepts optional `userId` for queries
- `subscriptions:getGameSubscribedRegions` - Accepts optional `userId` for queries

## Game Icons (Issue #4)

- Game icons are stored locally in `public/icons/` as JPG or SVG files
- Icon URLs in the database use relative paths: `/icons/game-slug.{jpg|svg}`
- External CDN URLs (e.g., Blizzard's akamaized.net) are unreliable - they return 422 errors
- To update existing game icon URLs: `npx convex run seedGames:updateAllGameIcons`
- Image source for game artwork: RAWG API (`https://api.rawg.io/api/games/{slug}`) - use `background_image` field

## All Games List (Issue #6)

The following games are seeded in `seedGames.ts` (11 total):

**Blizzard (4):** World of Warcraft, Overwatch 2, Diablo IV, Hearthstone
**Riot (3):** League of Legends, Valorant, Teamfight Tactics
**Steam (1):** Steam
**Epic (1):** Fortnite
**Mojang (1):** Minecraft
**Square Enix (1):** Final Fantasy XIV

- Unit tests: `convex/__tests__/seedGames.test.ts` validates all games are correctly structured
- E2E tests: `e2e/dashboard.spec.ts` tests 11-15 verify all games display on dashboard
