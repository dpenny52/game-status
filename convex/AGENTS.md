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
