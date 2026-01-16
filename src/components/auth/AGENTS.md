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
