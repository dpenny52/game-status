# Auth Components - Agent Notes

## Component Structure

All auth components follow this pattern:
```
ComponentName/
├── ComponentName.tsx      # Main component
├── ComponentName.test.tsx # Unit tests
└── index.ts              # Re-export
```

Exception: Modal-based components share `AuthForms.css` for consistent styling.

## Available Components

- **Modal** - Base modal wrapper with accessibility features
- **LoginModal** - Email/password login, OAuth, magic link
- **SignupModal** - Registration form with password strength
- **ForgotPasswordModal** - Password reset request
- **PasswordStrengthIndicator** - Visual password requirements

## ForgotPasswordModal

### Props Interface
```typescript
interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
  onRequestReset: (email: string) => Promise<{ success: boolean; message: string }>;
  initialEmail?: string;
}
```

### Security
- Always shows success message regardless of email existence
- Only shows "Invalid email" errors from backend validation
- Network errors, user-not-found errors all show success

## Testing Patterns

### Form Submission
Use `fireEvent.submit(form)` instead of clicking submit button:
```typescript
const form = emailInput.closest("form");
await act(async () => {
  fireEvent.submit(form!);
});
```

### Mocking AuthContext for Tests
When testing components that use `useAuth()`:
```typescript
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    requestPasswordReset: vi.fn().mockResolvedValue({ success: true }),
    // ... other methods
  }),
}));
```

## CSS Classes (from AuthForms.css)

- `.auth-error` - Red error box
- `.auth-success` - Success state with icon
- `.auth-description` - Descriptive text
- `.auth-button-primary` - Main action button
- `.auth-link-button` - Text link button
- `.form-input` / `.form-input-error` - Input fields

## AuthModals Component

Central component that renders all auth modals based on AuthContext state.

```typescript
// Renders at App.tsx root level
<AuthModals />
```

### Modal State Flow
- `modalState` in AuthContext: `"login" | "signup" | "forgotPassword" | null`
- Forgot password uses `forgotPasswordEmail` state to pre-fill email from login form
- Transitions: login → forgotPassword → login (back)

### Wiring LoginModal to ForgotPasswordModal
```typescript
const handleForgotPassword = (email: string) => {
  setForgotPasswordEmail(email);
  openForgotPasswordModal();
};
```

## Testing Gotchas

- When testing form validation, **use props for initial values** (e.g., `initialEmail`)
- Avoid `fireEvent.change` for pre-filling then immediately submitting - React state may not update in time
- Empty state tests (`""`) are reliable; dynamic value tests may fail due to React async state

## Bug Fix: Signup Flow (Issue #1)

**Problem**: Users weren't being created when completing the signup flow.

**Root Cause**: Prop name mismatch in `AuthModals.tsx` - passing `onSignup` to `SignupModal` but the component expects `onPasswordSignup`.

**Fix**: Changed `onSignup={signup}` to `onPasswordSignup={signup}` in AuthModals.tsx line 89.

## SignupModal Props

```typescript
interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSignupSuccess?: () => void;          // Called after successful signup
  onOAuthSignup?: (provider: "discord" | "twitch") => void;
  onPasswordSignup?: (email: string, password: string, displayName: string) => Promise<void>;
}
```

## Toast Integration for Signup Success

- Success toast after signup is triggered via `onSignupSuccess` callback
- `useToast` hook from `ToastContext` provides `showSuccess` method
- Toast component has `data-testid="toast"` for e2e testing

## E2E Testing

- Added `npm run test:e2e` script for running Playwright tests
- E2E tests use unique emails with timestamps to avoid conflicts: `e2e-signup-${Date.now()}@example.com`
- Playwright config auto-starts dev server via webServer option
