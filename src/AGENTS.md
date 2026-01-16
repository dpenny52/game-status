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
- `api.auth.requestMagicLink` - Passwordless magic link request
- `api.auth.requestPasswordReset` - Password reset link request

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

### Dynamic useQuery Mocking
When a component uses `useQuery` with different return values (like token validation), you need to set up dynamic mocking:

```typescript
const mockUseQuery = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => mockUseMutation(),
}));

// In test:
mockUseQuery.mockReturnValue({ valid: true }); // For valid token
mockUseQuery.mockReturnValue({ valid: false, error: "..." }); // For invalid token
```

## ResetPassword Page

### Convex Integration
- Uses `useQuery(api.auth.validatePasswordResetToken, { token })` for token validation
- Uses `useMutation(api.auth.resetPassword)` for password reset
- Supports "skip" parameter when token is null

### Test IDs
- `reset-password-validating` - Loading state during token validation
- `reset-password-error` - Error state for invalid/missing token
- `reset-password-page` - Main form when token is valid
- `reset-password-success` - Success state after password reset
- `new-password-input` / `confirm-password-input` - Password fields
- `reset-password-submit` - Submit button
- `back-to-login` - Link to return after success

## VerifyMagicLink Page

### Convex Integration
- Uses `useMutation(api.auth.verifyMagicLink)` for token verification
- Auto-verifies on page load when token is present
- Sets user in AuthContext via `setUser()` on success
- Redirects to dashboard after 2 seconds on success

### Test IDs
- `verify-magic-link-loading` - Initial loading state
- `verify-magic-link-verifying` - Verifying token state (with spinner)
- `verify-magic-link-error` - Error state for invalid/missing/expired token
- `verify-magic-link-success` - Success state with redirect message

## ForgotPasswordModal Component

### Purpose
Modal for requesting password reset links via email. Always shows success message regardless of whether email exists (prevents email enumeration attacks).

### Convex Integration
- Uses `AuthContext.requestPasswordReset` which calls `api.auth.requestPasswordReset`
- Returns `{ success: boolean; message: string }` from Convex

### Test IDs
- `forgot-password-email-input` - Email input field
- `forgot-password-submit` - Submit button
- `forgot-password-error` - Error message container
- `forgot-password-success` - Success state container
- `forgot-password-back-link` - Back to login link in form state
- `back-to-login-button` - Back to login button in success state

### Testing Notes
- Use `fireEvent.submit(form)` instead of clicking submit button for reliable tests
- The modal uses conditional rendering for error state (only shows when error !== null)
- Backend validation errors containing "Invalid email" are shown to user
- All other errors (network, etc.) show success to prevent enumeration

## Routing

### React Router Setup
- App uses `react-router-dom` with `BrowserRouter`
- Routes defined in `src/App.tsx`
- Available routes:
  - `/` - Dashboard
  - `/settings` - Settings page
  - `/reset-password` - Password reset (requires ?token= param)
  - `/verify-magic-link` - Magic link verification (requires ?token= param)
