# E2E Tests Directory - Agent Notes

## Authentication Tests

### Test Patterns
- App runs on `http://localhost:5173` (Vite default)
- Wait for `.dashboard` selector to confirm React has rendered
- Use flexible selectors - UI elements may have different names/testids
- Screenshots go to `e2e/screenshots/` directory

### Auth UI Notes
- Login button may be "Sign In" text or `[data-testid="login-button"]`
- Modals may use `[data-testid="login-modal"]` or class-based selectors
- Use `.first()` when multiple matching elements possible

### Error Handling
- Use `.catch(() => false)` pattern for checking if elements exist
- Log info messages when expected elements not found
- Make tests resilient - pass if core functionality works

### Magic Link Tests (Test 7-9)
- `magic-link-option` - Button to switch to magic link form in login modal
- `magic-link-email-input` - Email input for magic link
- `magic-link-submit` - Submit button for magic link request
- `magic-link-sent` - Confirmation message after successful request

### Running E2E Tests
```bash
# Make sure dev server is running first
npm run dev

# Then in another terminal
npx playwright test e2e/auth.spec.ts
```

## Settings Tests

### Key Test IDs
- `settings-unauthenticated` - Login prompt for unauthenticated users
- `settings-login-button` - Login button on settings page
- `settings-page` - Main authenticated settings page
- `settings-email` - User email display
- `settings-displayname` - Display name value (non-edit mode)
- `settings-edit-button` - Triggers edit mode for display name
- `settings-displayname-input` - Input field in edit mode
- `settings-save-button` / `settings-cancel-button` - Edit mode actions
- `settings-success` / `settings-error` - Feedback messages
- `settings-logout-button` - Logout trigger
- `settings-confirm-logout` / `settings-cancel-logout` - Logout confirmation

### Test Patterns
- Use `loginTestUser()` helper to authenticate before settings tests
- Check for `settings-page` visibility to confirm authenticated state
- Use `page.reload()` to test state persistence
- Logout flow requires clicking button then confirming

## Reset Password Tests

### Key Test IDs
- `reset-password-validating` - Loading state during Convex token validation
- `reset-password-error` - Error state (no token, invalid token, expired token)
- `reset-password-page` - Main password reset form
- `reset-password-success` - Success state after reset
- `new-password-input` - New password field
- `confirm-password-input` - Confirm password field
- `reset-password-submit` - Submit button
- `back-to-login` - Return link after success

### Test Patterns
- Navigate to `/reset-password?token=xxx` with token in URL
- Without real Convex token, tests will hit error state (expected)
- E2E tests verify error UI renders correctly for invalid tokens
- Form validation tests (weak password, mismatch) require valid token
- Use `waitUntil: "networkidle"` for pages with Convex queries

### Important Notes
- Token validation happens via Convex query, so E2E tests without real tokens will show error
- Tests are designed to be resilient - many tests document current behavior
- Screenshot tests captured at `e2e/screenshots/reset-password-*.png`
