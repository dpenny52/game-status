# Context Directory - Agent Notes

## AuthContext Convex Integration

### Key Patterns
- Use `useMutation` hook from `convex/react` to call Convex mutations
- Import API from `../../convex/_generated/api`
- Import `Id` type from `../../convex/_generated/dataModel` for typed user IDs
- Cast frontend string IDs to Convex `Id<"users">` type when calling mutations

### API Available
- `api.auth.login` - Login with email/password, returns `{ user: {...} }`
- `api.auth.signUp` - Create account, returns `{ userId: string }`
- `api.auth.updateDisplayName` - Update user display name

### Testing Notes
- Mock `convex/react` and API imports for unit tests
- Use `localStorageMock` pattern with `Object.defineProperty(window, "localStorage", ...)`
- Always call `cleanup()` from testing-library in `afterEach`
- Install `@testing-library/user-event` for user interaction simulation

### Common Issues
- localStorage not a function: Need to mock localStorage with proper clear/getItem/setItem methods
- Multiple elements found: Cleanup not being called between tests
- Type errors with Convex IDs: Cast with `as Id<"users">`
