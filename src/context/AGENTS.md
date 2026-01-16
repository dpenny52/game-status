# Context Directory - Agent Notes

## AuthContext Convex Integration

### Key Patterns
- Use `useMutation` hook from `convex/react` to call Convex mutations
- Import API from `../../convex/_generated/api`
- **SECURITY (Issue #10)**: Do NOT pass userId to mutations that modify user data
  - The backend derives userId from authenticated identity to prevent IDOR attacks
  - Only pass the data being changed (e.g., displayName), not the user identifier

### API Available
- `api.auth.login` - Login with email/password, returns `{ user: {...} }`
- `api.auth.signUp` - Create account, returns `{ userId: string }`
- `api.auth.updateDisplayName` - Update user display name (only pass displayName, NOT userId)
- `api.auth.requestMagicLink` - Request magic link for passwordless auth, returns `{ success, message }`
- `api.auth.verifyMagicLink` - Verify magic link token, returns `{ user }`

### Testing Notes
- Mock `convex/react` and API imports for unit tests
- Use `localStorageMock` pattern with `Object.defineProperty(window, "localStorage", ...)`
- Always call `cleanup()` from testing-library in `afterEach`
- Install `@testing-library/user-event` for user interaction simulation

### Common Issues
- localStorage not a function: Need to mock localStorage with proper clear/getItem/setItem methods
- Multiple elements found: Cleanup not being called between tests
- Type errors with Convex IDs: Cast with `as Id<"users">` (only when needed for non-mutation purposes)

### Security Notes (Issue #10)
- The `updateDisplayName` mutation was updated to NOT accept userId from client
- This prevents IDOR attacks where one user could modify another user's display name
- The frontend AuthContext now only sends `{ displayName }` to the mutation
- The backend derives the userId from `ctx.auth.getUserIdentity()` email lookup
