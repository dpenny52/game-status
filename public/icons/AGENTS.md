# Game Icons - Agent Notes

## Adding New Game Icons

1. Source images from RAWG API: `https://api.rawg.io/api/games/{game-slug}`
2. Download the `background_image` URL using curl
3. Save as `{game-slug}.jpg` in this directory
4. Update `convex/seedGames.ts` with the new icon path: `/icons/{game-slug}.jpg`
5. Run `npx convex run seedGames:updateBlizzardGameIcons` to update existing records

## Why Local Images

- External CDN URLs (Blizzard's akamaized.net, Wikipedia, etc.) are unreliable
- They may return 403/422 errors or require specific headers
- Local static files ensure consistent loading and no CORS issues

## Current Icons

- `world-of-warcraft.jpg` - Source: RAWG API
- `overwatch-2.jpg` - Source: RAWG API
- `diablo-iv.jpg` - Source: RAWG API

## Testing

- Unit tests: `src/components/GameCard/GameCard.test.tsx` (Game Icon Display tests)
- E2E tests: `e2e/dashboard.spec.ts` (tests 8-10 verify icon loading)
