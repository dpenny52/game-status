# Convex Backend Integration Plan

## Overview

Ensure the Convex backend is working and all pages pull data from it. The backend is fully implemented; the main work is connecting frontend components to use Convex instead of mock implementations.

## Current State

| Component | Convex Status | Issue |
|-----------|--------------|-------|
| Dashboard | Connected | Uses `getAllGamesWithStatus` query |
| EmailAlertsSection | Connected | Uses subscription queries/mutations |
| AuthContext | **Connected** | login, signup, updateDisplayName use Convex mutations |
| ResetPassword | **MOCK** | Token validation and password reset use mock |
| LoginModal | Connected | Receives props from AuthContext (now Convex-powered) |
| SignupModal | Connected | Receives props from AuthContext (now Convex-powered) |

---

## Phase 0: Backend Verification

### Task 0.1: Verify Convex Backend Running

- [x] Verify `.env.local` has `VITE_CONVEX_URL` set
- [x] Run `npx convex dev` to start backend
- [x] Check Convex dashboard for games/status data
- [x] Verify Dashboard displays real game data (not "Demo Mode")
- [x] Run existing E2E test: `npx playwright test e2e/dashboard.spec.ts`

**Files**: None (verification only)

**Status**: COMPLETED - Backend verified working, Convex generated files present

---

## Phase 1: AuthContext Convex Integration

### Task 1.1: Connect AuthContext Login to Convex

- [x] Import `useMutation` from `convex/react` in AuthContext.tsx
- [x] Import `api` from `../convex/_generated/api`
- [x] Replace mock login (lines 142-158) with Convex mutation call
- [x] Handle error responses from Convex
- [x] Create unit test file: `src/context/AuthContext.test.tsx`
- [x] Write unit test: mutation called with email/password
- [x] Write unit test: user state set from response
- [x] Write unit test: error handling for invalid credentials
- [x] Add E2E test to `e2e/auth.spec.ts`: login with valid credentials
- [x] Add E2E test: login with invalid credentials shows error
- [x] All tests pass

**Files to Modify**:
- `src/context/AuthContext.tsx`

**Files to Create**:
- `src/context/AuthContext.test.tsx`
- `e2e/auth.spec.ts`

**Status**: COMPLETED - Login connected to Convex, unit tests and E2E tests created

---

### Task 1.2: Connect AuthContext Signup to Convex

- [x] Use `useMutation(api.auth.signUp)` in AuthContext.tsx
- [x] Call mutation with `{ email, password, displayName }`
- [x] After signup, call login mutation to get user data
- [x] Handle duplicate email error from Convex
- [x] Write unit test: signUp mutation called with correct args
- [x] Write unit test: login called after successful signup
- [x] Write unit test: error handling for existing email
- [x] Add E2E test: signup creates account and logs in
- [x] Add E2E test: signup with existing email shows error
- [x] All tests pass

**Files to Modify**:
- `src/context/AuthContext.tsx`

**Dependencies**: Task 1.1

**Status**: COMPLETED - Signup connected to Convex with proper flow

---

### Task 1.3: Connect AuthContext updateDisplayName to Convex

- [x] Use `useMutation(api.auth.updateDisplayName)` in AuthContext.tsx
- [x] Call mutation with `{ userId: user._id, displayName }`
- [x] Update local user state from response
- [x] Write unit test: mutation called with userId and displayName
- [x] Write unit test: local state updated on success
- [x] Write unit test: error handling
- [x] Create E2E test file: `e2e/settings.spec.ts`
- [x] Add E2E test: change display name in settings
- [x] Add E2E test: name persists after page refresh
- [x] All tests pass

**Files to Modify**:
- `src/context/AuthContext.tsx`

**Files to Create**:
- `e2e/settings.spec.ts`

**Dependencies**: Task 1.1

**Status**: COMPLETED - Backend integration done, unit tests pass, E2E settings tests created

---

## Phase 2: ResetPassword Page Integration

### Task 2.1: Add validatePasswordResetToken Query to Backend

- [ ] Add `validatePasswordResetToken` query to `convex/auth.ts`
- [ ] Query finds token by `by_token` index
- [ ] Return `{ valid: false, error }` for invalid/used tokens
- [ ] Return `{ valid: false, error }` for expired tokens
- [ ] Return `{ valid: true }` for valid tokens
- [ ] Create unit test file: `convex/__tests__/auth.test.ts`
- [ ] Write unit test: valid token returns `{ valid: true }`
- [ ] Write unit test: invalid token returns error
- [ ] Write unit test: expired token returns error
- [ ] Write unit test: used token returns error
- [ ] All tests pass

**Files to Modify**:
- `convex/auth.ts`

**Files to Create**:
- `convex/__tests__/auth.test.ts`

---

### Task 2.2: Connect ResetPassword Token Validation to Convex

- [ ] Import `useQuery` from `convex/react` in ResetPassword.tsx
- [ ] Replace mock validation (lines 57-77) with Convex query
- [ ] Use `useQuery(api.auth.validatePasswordResetToken, { token })`
- [ ] Handle loading state while query runs
- [ ] Use `tokenValidation?.valid` for determining state
- [ ] Create unit test file: `src/pages/ResetPassword/ResetPassword.test.tsx`
- [ ] Write unit test: form shown when token valid
- [ ] Write unit test: error shown when token invalid
- [ ] Write unit test: error shown when token expired
- [ ] Create E2E test file: `e2e/reset-password.spec.ts`
- [ ] Add E2E test: invalid token shows error state
- [ ] Add E2E test: valid token shows password form
- [ ] All tests pass

**Files to Modify**:
- `src/pages/ResetPassword/ResetPassword.tsx`

**Files to Create**:
- `src/pages/ResetPassword/ResetPassword.test.tsx`
- `e2e/reset-password.spec.ts`

**Dependencies**: Task 2.1

---

### Task 2.3: Connect ResetPassword Form to Convex

- [ ] Import `useMutation` from `convex/react` in ResetPassword.tsx
- [ ] Replace mock submission (lines 107-121) with Convex mutation
- [ ] Call `resetPasswordMutation({ token, newPassword: password })`
- [ ] Handle Convex errors (invalid token, weak password)
- [ ] Write unit test: mutation called with token and newPassword
- [ ] Write unit test: success state shown on success
- [ ] Write unit test: error displayed on failure
- [ ] Add E2E test: submit new password shows success
- [ ] Add E2E test: weak password shows validation error
- [ ] All tests pass

**Files to Modify**:
- `src/pages/ResetPassword/ResetPassword.tsx`

**Dependencies**: Task 2.2

---

## Phase 3: Magic Link Flow

### Task 3.1: Add requestMagicLink to AuthContext

- [ ] Add `requestMagicLink: (email: string) => Promise<void>` to AuthContextType
- [ ] Implement using `useMutation(api.auth.requestMagicLink)`
- [ ] Return success/error state to caller
- [ ] Write unit test: mutation called with email
- [ ] Write unit test: success message returned
- [ ] Add E2E test: click magic link option, enter email, see confirmation
- [ ] All tests pass

**Files to Modify**:
- `src/context/AuthContext.tsx`

**Dependencies**: Task 1.1

---

### Task 3.2: Create VerifyMagicLink Page

- [ ] Create `src/pages/VerifyMagicLink/VerifyMagicLink.tsx`
- [ ] Create `src/pages/VerifyMagicLink/VerifyMagicLink.css`
- [ ] Extract token from URL params
- [ ] Call `useMutation(api.auth.verifyMagicLink)`
- [ ] On success, set user in AuthContext via `setUser()`
- [ ] Redirect to dashboard on success
- [ ] Show error state for invalid/expired tokens
- [ ] Create unit test file: `src/pages/VerifyMagicLink/VerifyMagicLink.test.tsx`
- [ ] Write unit test: valid token logs user in
- [ ] Write unit test: invalid token shows error
- [ ] Write unit test: expired token shows error
- [ ] Add E2E test: navigate with valid token, redirects to dashboard
- [ ] All tests pass

**Files to Create**:
- `src/pages/VerifyMagicLink/VerifyMagicLink.tsx`
- `src/pages/VerifyMagicLink/VerifyMagicLink.css`
- `src/pages/VerifyMagicLink/VerifyMagicLink.test.tsx`

**Dependencies**: Task 3.1

---

## Phase 4: Forgot Password Flow

### Task 4.1: Create ForgotPassword Component

- [ ] Create `src/components/auth/ForgotPasswordModal.tsx`
- [ ] Create email input form with validation
- [ ] Call `useMutation(api.auth.requestPasswordReset)`
- [ ] Always show success message (prevent email enumeration)
- [ ] Create unit test file: `src/components/auth/ForgotPasswordModal.test.tsx`
- [ ] Write unit test: mutation called with email
- [ ] Write unit test: success message shown regardless of email existence
- [ ] Add E2E test: enter email, see confirmation message
- [ ] All tests pass

**Files to Create**:
- `src/components/auth/ForgotPasswordModal.tsx`
- `src/components/auth/ForgotPasswordModal.test.tsx`

---

### Task 4.2: Wire ForgotPassword into LoginModal

- [ ] Add state for forgot password view in LoginModal.tsx
- [ ] Add "Forgot password?" link below login form
- [ ] Render ForgotPasswordModal when forgot password active
- [ ] Add back button to return to login view
- [ ] Update existing test: `src/components/auth/AuthModals.test.tsx`
- [ ] Write unit test: click forgot password link shows form
- [ ] Write unit test: can navigate back to login
- [ ] Add E2E test: full forgot password flow from login modal
- [ ] All tests pass

**Files to Modify**:
- `src/components/auth/LoginModal.tsx`
- `src/components/auth/AuthModals.test.tsx`

**Dependencies**: Task 4.1

---

## Phase 5: Comprehensive E2E Test Suites

### Task 5.1: Complete Auth E2E Test Suite

- [ ] Ensure `e2e/auth.spec.ts` covers all auth flows
- [ ] Test: Sign up with email/password
- [ ] Test: Login with email/password
- [ ] Test: Invalid credentials error message
- [ ] Test: Logout flow clears user state
- [ ] Test: Magic link request shows confirmation
- [ ] Test: Forgot password request shows confirmation
- [ ] All tests pass

**Files to Modify/Verify**:
- `e2e/auth.spec.ts`

**Dependencies**: All Phase 1, 3, 4 tasks

---

### Task 5.2: Complete Settings E2E Test Suite

- [ ] Ensure `e2e/settings.spec.ts` covers settings page
- [ ] Test: Unauthenticated user sees login prompt
- [ ] Test: Authenticated user sees profile info
- [ ] Test: Display name update saves and persists
- [ ] Test: Email alerts section shows subscriptions
- [ ] Test: Logout from settings works
- [ ] All tests pass

**Files to Modify/Verify**:
- `e2e/settings.spec.ts`

**Dependencies**: Task 1.3

---

### Task 5.3: Complete Reset Password E2E Test Suite

- [ ] Ensure `e2e/reset-password.spec.ts` covers reset flow
- [ ] Test: No token parameter shows error
- [ ] Test: Invalid token shows error state
- [ ] Test: Expired token shows error state
- [ ] Test: Valid token shows password form
- [ ] Test: Successful password reset shows success
- [ ] Test: Weak password shows validation error
- [ ] Test: Passwords must match validation
- [ ] All tests pass

**Files to Modify/Verify**:
- `e2e/reset-password.spec.ts`

**Dependencies**: Tasks 2.2, 2.3

---

## Task Execution Order

Execute tasks in this order for minimal dependencies:

```
0.1  Verify Backend
 │
 ├── 1.1  AuthContext Login
 │    │
 │    ├── 1.2  AuthContext Signup
 │    │
 │    ├── 1.3  AuthContext updateDisplayName
 │    │    │
 │    │    └── 5.2  Settings E2E Suite
 │    │
 │    ├── 3.1  Magic Link Request
 │    │    │
 │    │    └── 3.2  VerifyMagicLink Page
 │    │
 │    └── 4.1  ForgotPassword Component
 │         │
 │         └── 4.2  Wire into LoginModal
 │              │
 │              └── 5.1  Auth E2E Suite
 │
 └── 2.1  validatePasswordResetToken Query
      │
      └── 2.2  ResetPassword Token Validation
           │
           └── 2.3  ResetPassword Form Submission
                │
                └── 5.3  Reset Password E2E Suite
```

---

## Critical Files Reference

**Frontend (to modify)**:
- `src/context/AuthContext.tsx` - Main auth integration point
- `src/pages/ResetPassword/ResetPassword.tsx` - Password reset page
- `src/components/auth/LoginModal.tsx` - Add forgot password link

**Backend (to modify)**:
- `convex/auth.ts` - Add `validatePasswordResetToken` query

**New Files to Create**:
- `src/context/AuthContext.test.tsx`
- `src/pages/ResetPassword/ResetPassword.test.tsx`
- `src/pages/VerifyMagicLink/VerifyMagicLink.tsx`
- `src/pages/VerifyMagicLink/VerifyMagicLink.css`
- `src/pages/VerifyMagicLink/VerifyMagicLink.test.tsx`
- `src/components/auth/ForgotPasswordModal.tsx`
- `src/components/auth/ForgotPasswordModal.test.tsx`
- `convex/__tests__/auth.test.ts`
- `e2e/auth.spec.ts`
- `e2e/settings.spec.ts`
- `e2e/reset-password.spec.ts`

---

## Verification Strategy

After each task, verify:

1. **Unit Tests**: Run `npm test` - all tests pass
2. **E2E Tests**: Run `npx playwright test` - all tests pass
3. **Manual Check**: Feature works in browser

Final verification:
- [ ] Complete user journey: signup → login → settings → logout
- [ ] Password reset flow: request → email → reset → login
- [ ] Dashboard shows real Convex data (not demo mode)
- [ ] All unit tests pass: `npm test`
- [ ] All E2E tests pass: `npx playwright test`
