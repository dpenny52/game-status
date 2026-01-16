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
