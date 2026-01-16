# Convex Agent Notes

## Adding New Games to the Database

- Games must exist in the `games` table before status fetchers can update their status
- Use `seedGames.ts` mutations to add games. Run with: `npx convex run seedGames:seedBlizzardGames`
- The seed mutation is idempotent - it checks for existing games by slug before inserting
- Game slugs must match what the publisher fetchers expect (e.g., `world-of-warcraft`, `diablo-iv`, `overwatch-2`)

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
