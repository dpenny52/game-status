# Source Directory - Agent Notes

## ESLint Configuration

### Unused Variables
The eslint config allows underscore-prefixed variables to be unused:
- `_err`, `_error` - For catch clauses where error isn't used
- `_region`, `_param` - For destructured props not needed

```typescript
// OK - underscore prefix allows unused
catch (_err) { ... }

// Error - will be flagged
catch (err) { ... }
```

### Key Rules
- `@typescript-eslint/no-unused-vars` - Requires underscore prefix for unused vars/args
- `@typescript-eslint/no-explicit-any` - Warning for `any` type
- No useless catch clauses - Remove try/catch that just re-throws

## AuthContext Notes

### Convex Mutations Used
- `api.auth.login` - Email/password login
- `api.auth.signUp` - New account creation
- `api.auth.updateDisplayName` - Profile updates

### Local Storage
- Key: `gamestatus_auth`
- Persists user object for session continuity

## Component Test Patterns

### Mocking Convex
```typescript
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));
```

### Testing Library Imports
- Import from `@testing-library/react` for render/screen/cleanup
- Use `vi` from vitest for mocking
