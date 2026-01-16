# Game Icons - Agent Notes

## Adding New Game Icons

1. Source images from RAWG API: `https://api.rawg.io/api/games/{game-slug}`
2. Download the `background_image` URL using curl
3. Save as `{game-slug}.jpg` or `.svg` in this directory
4. Update `convex/seedGames.ts` with the new icon path: `/icons/{game-slug}.{ext}`
5. Run `npx convex run seedGames:updateAllGameIcons` to update existing records

## Why Local Images

- External CDN URLs (Blizzard's akamaized.net, Wikipedia, etc.) are unreliable
- They may return 403/422 errors or require specific headers
- Local static files ensure consistent loading and no CORS issues

## SVG Placeholder Icons

When external image sources are unavailable (403, blocked, etc.), use SVG placeholder icons:
- SVGs are lightweight and render well at any size
- Can be created programmatically without external dependencies
- Current placeholders: hearthstone, league-of-legends, valorant, teamfight-tactics, steam, fortnite, minecraft, final-fantasy-xiv

## Current Icons

**JPG (from RAWG API):**
- `world-of-warcraft.jpg`
- `overwatch-2.jpg`
- `diablo-iv.jpg`

**SVG (placeholders - Issue #6):**
- `hearthstone.svg`
- `league-of-legends.svg`
- `valorant.svg`
- `teamfight-tactics.svg`
- `steam.svg`
- `fortnite.svg`
- `minecraft.svg`
- `final-fantasy-xiv.svg`

## Testing

- Unit tests: `src/components/GameCard/GameCard.test.tsx` (Game Icon Display tests)
- E2E tests: `e2e/dashboard.spec.ts` (tests 8-10 verify icon loading, tests 11-15 verify all games)

## Agent Notes (Issue #6)

- RAWG API requires API key for programmatic access
- Wikipedia/Wikimedia images often return 403 when fetched via curl
- Blizzard CDN URLs require specific headers/authentication
- SVG placeholders work well as fallback until proper images are sourced
