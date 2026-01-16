# VerifyMagicLink Page - Agent Notes

## Component Overview
Handles magic link verification and automatic user authentication.

## Key Patterns

### Token Flow
1. Extract token from URL `?token=` param on mount
2. Auto-trigger verification when token is available
3. Call `verifyMagicLink` mutation with token
4. On success: set user in AuthContext, redirect to `/` after 2s
5. On error: show error state with return link

### State Management
Uses local state for verification flow:
- `token` - Extracted from URL
- `isVerifying` - Mutation in progress
- `isSuccess` - Verification succeeded
- `error` - Error message string

### CSS Class Naming
Follows pattern: `verify-magic-link-{element}`
- Consistent with ResetPassword page styling
- Uses CSS custom properties for theming

## Testing

### Unit Tests
Mock `window.location.search` before render:
```typescript
function mockWindowLocation(search: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { ...originalLocation, search, href: "" },
  });
}
```

### Test IDs
- `verify-magic-link-loading`
- `verify-magic-link-verifying`
- `verify-magic-link-error`
- `verify-magic-link-success`
