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
- The frontend stores user state in localStorage (`gamestatus_auth` key)
- Backend functions derive userId from `ctx.auth.getUserIdentity()` - never accept from client
- See Issue #16 fix below for the proper pattern

## Subscription Mutations

- `subscriptions:upsertSubscription` - userId derived from auth (not from client)
- `subscriptions:getGameSubscription` - userId derived from auth
- `subscriptions:getGameSubscribedRegions` - userId derived from auth

## Security - IDOR Prevention in Subscriptions (Issue #16)

- CRITICAL: Never accept `userId` from client input for mutations/queries that access user data
- Pattern: Always derive userId from `ctx.auth.getUserIdentity()` on the server
- The subscription functions no longer accept `userId` parameter - removed to prevent IDOR attacks
- Previous vulnerability: User A could pass User B's userId to manipulate their subscriptions
- Fix applied to:
  - `upsertSubscription` - removed userId from args, now uses auth identity
  - `getGameSubscription` - removed userId from args, now uses auth identity
  - `getGameSubscribedRegions` - removed userId from args, now uses auth identity
- Frontend changes in `SubscriptionToggle.tsx`:
  - Removed userId from useQuery calls
  - Removed userId from useMutation calls
  - Removed unused Id import and user from useAuth destructuring
- Server-side pattern:
  ```typescript
  // CORRECT: Derive userId from auth
  const identity = await ctx.auth.getUserIdentity();
  const user = await ctx.db.query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email))
    .first();
  const userId = user._id;

  // WRONG: Accept userId from client (vulnerable to IDOR)
  const userId = providedUserId || await getUserFromAuth(ctx);
  ```
- Test files:
  - `convex/__tests__/subscriptions.idor.test.ts` - unit tests for IDOR prevention
  - `e2e/subscription-idor.spec.ts` - E2E integration tests

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

## Security - IDOR Prevention (Issue #11)

- `getUserById` query in `auth.ts` requires authentication and only allows users to query their own data
- Pattern for secure queries: Always validate `currentUser._id === args.userId` to prevent IDOR attacks
- Return limited public fields only - exclude internal fields like `_creationTime`, `updatedAt`, `providerId`
- Error message consistency prevents user enumeration: "Not authorized" for both non-existent and unauthorized users
- Test file: `convex/__tests__/auth.getUserById.test.ts` - covers auth required, IDOR prevention, field filtering

## Security - updateDisplayName Authorization (Issue #10)

- CRITICAL: Never accept `userId` from client in mutations that modify user data
- Pattern: Always derive userId from `ctx.auth.getUserIdentity()` email, then query the users table
- The `updateDisplayName` mutation no longer accepts `userId` - it only takes `displayName`
- Server looks up user by authenticated identity's email: `ctx.db.query("users").withIndex("by_email", ...)`
- This prevents IDOR attacks where User A could modify User B's display name
- Frontend in AuthContext now only passes `displayName` to the mutation (no userId)
- Test file: `convex/__tests__/auth.updateDisplayName.test.ts` - covers auth required, IDOR prevention
- E2E tests: `e2e/auth-security.spec.ts` - "Display Name Update Authorization" section

## Security - Cryptographically Secure Token Generation (Issue #9)

- CRITICAL: Never use `Math.random()` for security tokens - it's predictable and NOT cryptographically secure
- Pattern: Use `crypto.getRandomValues()` for all security-sensitive token generation
- The shared `generateSecureToken()` in `convex/lib/authUtils.ts` provides proper CSPRNG-based tokens
- Unsubscribe tokens in `subscriptions.ts` now use `generateSecureToken(32)` (256 bits of entropy)
- Key benefits:
  - 256-bit tokens are computationally infeasible to brute force (2^256 combinations)
  - Tokens are unpredictable - knowledge of previous tokens doesn't help predict future ones
  - Hex-encoded output is URL-safe without additional encoding
- Test file: `convex/__tests__/secureToken.test.ts` - covers entropy, uniqueness, Math.random exclusion
- E2E tests: `e2e/subscription-security.spec.ts` - integration tests for secure subscription flows

## Security - Bcrypt Password Hashing (Issue #8)

- CRITICAL: Never use SHA-256 with static salt for password hashing - it's fast and vulnerable to brute-force
- Pattern: Use bcrypt with cost factor 12 for password hashing
- The `hashPassword()` and `verifyPassword()` functions in `auth.ts` now use `bcryptjs` package
- Key security improvements:
  - Unique salt per password (embedded in bcrypt hash format)
  - Cost factor 12 provides ~250ms hash time, resistant to GPU cracking
  - bcrypt.compare() uses constant-time comparison (prevents timing attacks)
  - Hash format: `$2a$12$<22-char-salt><31-char-hash>` (60 chars total)
- Bcrypt configuration:
  - `npm install bcryptjs @types/bcryptjs` - pure JavaScript implementation works in Convex runtime
  - Cost factor stored as constant `BCRYPT_COST_FACTOR = 12` in auth.ts
  - Salt generation: `bcrypt.genSalt(BCRYPT_COST_FACTOR)` per password
- Migration notes:
  - Existing SHA-256 hashes are incompatible with bcrypt
  - Users with old hashes must reset their passwords
  - Consider adding migration logic or password reset prompt for existing users
- Test file: `convex/__tests__/passwordHashing.test.ts` - covers bcrypt format, timing attacks, salt uniqueness
- E2E tests: `e2e/password-security.spec.ts` - integration tests for signup/login flows with bcrypt

## Security - XSS Prevention in HTML Generation (Issue #12)

- CRITICAL: Always escape user input before inserting into HTML templates
- Pattern: Use `escapeHtml()` function to sanitize all dynamic content in HTML responses
- The `escapeHtml()` function in `http.ts` escapes 5 HTML special characters:
  - `&` → `&amp;` (prevents HTML entity injection)
  - `<` → `&lt;` (prevents tag injection)
  - `>` → `&gt;` (prevents tag closing/injection)
  - `"` → `&quot;` (prevents attribute breakout with double quotes)
  - `'` → `&#039;` (prevents attribute breakout with single quotes)
- The `generateHtmlPage()` function now applies escaping to title and message parameters
- Key security improvements:
  - Prevents reflected XSS through URL parameters
  - Prevents stored XSS through database content
  - Neutralizes event handler injection (onerror, onclick, onload, etc.)
  - Prevents HTML attribute injection and breakout
- Export pattern: Functions are exported for unit testing (`export function escapeHtml`)
- Test file: `convex/__tests__/http.xss.test.ts` - covers escaping, attack vectors, edge cases
- E2E tests: `e2e/http-xss-security.spec.ts` - integration tests for unsubscribe endpoint security

## Security - XSS Prevention in Email Templates (Issue #13)

- CRITICAL: Always escape dynamic content before inserting into email HTML templates
- Pattern: Use `escapeHtml()` from `convex/lib/htmlUtils.ts` to sanitize all dynamic content
- The `escapeHtml()` function escapes 8 HTML special characters:
  - `&` → `&amp;` (prevents HTML entity injection)
  - `<` → `&lt;` (prevents tag injection)
  - `>` → `&gt;` (prevents tag closing)
  - `"` → `&quot;` (prevents attribute breakout with double quotes)
  - `'` → `&#x27;` (prevents attribute breakout with single quotes)
  - `/` → `&#x2F;` (prevents tag closing via `</`)
  - `` ` `` → `&#x60;` (prevents template literal injection)
  - `=` → `&#x3D;` (prevents attribute injection)
- Additional utilities in `htmlUtils.ts`:
  - `escapeHtmlAttribute()` - alias for escapeHtml for clearer intent
  - `isSafeUrl()` - validates URLs against dangerous protocols (javascript:, data:, vbscript:, file:)
  - `sanitizeUrl()` - returns empty string for unsafe URLs, escapes safe URLs
- Usage in `alertNotifications.ts` sendAlertEmail:
  - `gameName` → `escapeHtml(gameName)` before inserting into HTML
  - `region` → `escapeHtml(region.toUpperCase())` before inserting
  - URLs → `sanitizeUrl()` for dashboard link, `escapeHtml()` for unsubscribe URL
  - Token in URL → `encodeURIComponent(unsubscribeToken)` for proper URL encoding
- Key insight: HTML escaping preserves text content (e.g., "onerror" is still visible as text)
  but breaks HTML tag structure (e.g., `<img` becomes `&lt;img`), making payloads non-executable
- Test files:
  - `convex/__tests__/htmlUtils.test.ts` - unit tests for escaping functions
  - `convex/__tests__/alertNotification.xss.test.ts` - email template security tests
  - `e2e/email-template-security.spec.ts` - E2E integration tests

## Security - Token Hashing (Issue #14)

- CRITICAL: Never store security tokens (magic links, password resets, unsubscribe tokens) in plaintext
- Pattern: Hash tokens using SHA-256 before storing, compare by hashing the provided token
- The `hashToken()` function in `convex/lib/authUtils.ts` provides SHA-256 hashing via Web Crypto API
- Why SHA-256 (not bcrypt):
  - Tokens are already high-entropy (32 bytes from CSPRNG) - no need for slow hashing
  - SHA-256 is fast and suitable for token comparison
  - bcrypt is for low-entropy passwords that need slow hashing to resist brute-force
- Schema changes:
  - `magicLinkTokens.token` → `magicLinkTokens.tokenHash` with index `by_tokenHash`
  - `passwordResetTokens.token` → `passwordResetTokens.tokenHash` with index `by_tokenHash`
  - `alertSubscriptions.unsubscribeToken` → `alertSubscriptions.unsubscribeTokenHash` with index `by_unsubscribeTokenHash`
- Token flow pattern:
  1. Generate plaintext token: `const token = generateSecureToken(32)`
  2. Hash for storage: `const tokenHash = await hashToken(token)`
  3. Store hash in DB: `{ tokenHash, ... }`
  4. Send plaintext token to user (in email link)
  5. On verification: hash provided token and lookup by hash
- Alert email token rotation:
  - `regenerateUnsubscribeToken()` mutation generates fresh token before each email
  - Returns plaintext for email while storing only hash
  - Limits exposure window if token is compromised
- Key security improvements:
  - Database breach doesn't expose usable tokens
  - Attacker would need to brute-force 256-bit tokens (computationally infeasible)
  - Hash format is consistent for database indexing (64 hex chars)
- Test files:
  - `convex/__tests__/tokenHashing.test.ts` - unit tests for hashToken, security patterns
  - `e2e/token-security.spec.ts` - E2E integration tests for token verification flows
- Migration note: Existing plaintext tokens will not work after this change. Clear token tables or implement migration.
