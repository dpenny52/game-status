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

- [x] Add `validatePasswordResetToken` query to `convex/auth.ts`
- [x] Query finds token by `by_token` index
- [x] Return `{ valid: false, error }` for invalid/used tokens
- [x] Return `{ valid: false, error }` for expired tokens
- [x] Return `{ valid: true }` for valid tokens
- [x] Create unit test file: `convex/__tests__/auth.test.ts`
- [x] Write unit test: valid token returns `{ valid: true }`
- [x] Write unit test: invalid token returns error
- [x] Write unit test: expired token returns error
- [x] Write unit test: used token returns error
- [x] All tests pass

**Files to Modify**:
- `convex/auth.ts`

**Files to Create**:
- `convex/__tests__/auth.test.ts`

**Status**: COMPLETED - Query implemented with full validation logic, all unit tests pass

---

### Task 2.2: Connect ResetPassword Token Validation to Convex

- [x] Import `useQuery` from `convex/react` in ResetPassword.tsx
- [x] Replace mock validation (lines 57-77) with Convex query
- [x] Use `useQuery(api.auth.validatePasswordResetToken, { token })`
- [x] Handle loading state while query runs
- [x] Use `tokenValidation?.valid` for determining state
- [x] Create unit test file: `src/pages/ResetPassword/ResetPassword.test.tsx` (tests in AuthPages.test.tsx)
- [x] Write unit test: form shown when token valid
- [x] Write unit test: error shown when token invalid
- [x] Write unit test: error shown when token expired
- [x] Create E2E test file: `e2e/reset-password.spec.ts`
- [x] Add E2E test: invalid token shows error state
- [x] Add E2E test: valid token shows password form
- [x] All tests pass

**Files to Modify**:
- `src/pages/ResetPassword/ResetPassword.tsx`

**Files to Create**:
- `src/pages/ResetPassword/ResetPassword.test.tsx` (tests added to src/pages/AuthPages.test.tsx)
- `e2e/reset-password.spec.ts`

**Dependencies**: Task 2.1

**Status**: COMPLETED - ResetPassword uses Convex query for token validation, unit tests updated, E2E tests created

---

### Task 2.3: Connect ResetPassword Form to Convex

- [x] Import `useMutation` from `convex/react` in ResetPassword.tsx
- [x] Replace mock submission (lines 107-121) with Convex mutation
- [x] Call `resetPasswordMutation({ token, newPassword: password })`
- [x] Handle Convex errors (invalid token, weak password)
- [x] Write unit test: mutation called with token and newPassword
- [x] Write unit test: success state shown on success
- [x] Write unit test: error displayed on failure
- [x] Add E2E test: submit new password shows success
- [x] Add E2E test: weak password shows validation error
- [x] All tests pass

**Files to Modify**:
- `src/pages/ResetPassword/ResetPassword.tsx`

**Dependencies**: Task 2.2

**Status**: COMPLETED - ResetPassword form connected to Convex resetPassword mutation, tests pass

---

## Phase 3: Magic Link Flow

### Task 3.1: Add requestMagicLink to AuthContext

- [x] Add `requestMagicLink: (email: string) => Promise<void>` to AuthContextType
- [x] Implement using `useMutation(api.auth.requestMagicLink)`
- [x] Return success/error state to caller
- [x] Write unit test: mutation called with email
- [x] Write unit test: success message returned
- [x] Write unit test: error handling for invalid email
- [x] Add E2E test: click magic link option, enter email, see confirmation
- [x] All tests pass

**Files Modified**:
- `src/context/AuthContext.tsx`
- `src/context/AuthContext.test.tsx`
- `e2e/auth.spec.ts`

**Dependencies**: Task 1.1

**Status**: COMPLETED - requestMagicLink wired to Convex mutation, unit tests and E2E tests added

---

### Task 3.2: Create VerifyMagicLink Page

- [x] Create `src/pages/VerifyMagicLink/VerifyMagicLink.tsx`
- [x] Create `src/pages/VerifyMagicLink/VerifyMagicLink.css`
- [x] Extract token from URL params
- [x] Call `useMutation(api.auth.verifyMagicLink)`
- [x] On success, set user in AuthContext via `setUser()`
- [x] Redirect to dashboard on success
- [x] Show error state for invalid/expired tokens
- [x] Create unit test file: `src/pages/VerifyMagicLink/VerifyMagicLink.test.tsx`
- [x] Write unit test: valid token logs user in
- [x] Write unit test: invalid token shows error
- [x] Write unit test: expired token shows error
- [x] Add E2E test: navigate with valid token, redirects to dashboard
- [x] All tests pass

**Files Created**:
- `src/pages/VerifyMagicLink/VerifyMagicLink.tsx`
- `src/pages/VerifyMagicLink/VerifyMagicLink.css`
- `src/pages/VerifyMagicLink/index.ts`
- `src/pages/VerifyMagicLink/VerifyMagicLink.test.tsx`
- `e2e/verify-magic-link.spec.ts`

**Files Modified**:
- `src/App.tsx` - Added react-router-dom routing for all pages

**Dependencies**: Task 3.1

**Status**: COMPLETED - VerifyMagicLink page created with full Convex integration, unit tests (8 tests), and E2E tests (7 tests)

---

## Phase 4: Forgot Password Flow

### Task 4.1: Create ForgotPassword Component

- [x] Create `src/components/auth/ForgotPasswordModal.tsx`
- [x] Create email input form with validation
- [x] Call `useMutation(api.auth.requestPasswordReset)` (via AuthContext.requestPasswordReset)
- [x] Always show success message (prevent email enumeration)
- [x] Create unit test file: `src/components/auth/ForgotPasswordModal.test.tsx`
- [x] Write unit test: mutation called with email
- [x] Write unit test: success message shown regardless of email existence
- [x] Add requestPasswordReset method to AuthContext with unit tests
- [x] Add E2E test: enter email, see confirmation message (covered in e2e/auth.spec.ts "submitting forgot password shows success message")
- [x] All unit tests pass

**Files Created**:
- `src/components/auth/ForgotPasswordModal.tsx`
- `src/components/auth/ForgotPasswordModal.test.tsx`

**Files Modified**:
- `src/context/AuthContext.tsx` - Added requestPasswordReset method
- `src/context/AuthContext.test.tsx` - Added unit tests for requestPasswordReset
- `src/components/auth/index.ts` - Added ForgotPasswordModal export

**Status**: COMPLETED - Component created with 14 unit tests, AuthContext integration done with 3 additional unit tests

---

### Task 4.2: Wire ForgotPassword into LoginModal

- [x] Add state for forgot password view in LoginModal.tsx (already had onForgotPassword prop)
- [x] Add "Forgot password?" link below login form (already present)
- [x] Render ForgotPasswordModal when forgot password active (via AuthModals component)
- [x] Add back button to return to login view
- [x] Update existing test: `src/components/auth/AuthModals.test.tsx`
- [x] Write unit test: click forgot password link shows form
- [x] Write unit test: can navigate back to login
- [x] Add E2E test: full forgot password flow from login modal
- [x] All tests pass (503 unit tests, 13 E2E tests)

**Files Created**:
- `src/components/auth/AuthModals.tsx` - Central component for rendering auth modals based on AuthContext state

**Files Modified**:
- `src/context/AuthContext.tsx` - Added forgotPassword modal state, openForgotPasswordModal, forgotPasswordEmail state
- `src/components/auth/index.ts` - Added AuthModals export
- `src/components/auth/AuthModals.test.tsx` - Added 9 tests for ForgotPasswordModal, 2 tests for LoginModal forgot password link
- `src/App.tsx` - Renders AuthModals component at root level
- `e2e/auth.spec.ts` - Added 4 E2E tests for forgot password flow

**Dependencies**: Task 4.1

**Status**: COMPLETED - Full forgot password flow wired into LoginModal, AuthModals component created for central modal rendering

---

## Phase 5: Comprehensive E2E Test Suites

### Task 5.1: Complete Auth E2E Test Suite

- [x] Ensure `e2e/auth.spec.ts` covers all auth flows
- [x] Test: Sign up with email/password
- [x] Test: Login with email/password
- [x] Test: Invalid credentials error message
- [x] Test: Logout flow clears user state
- [x] Test: Magic link request shows confirmation
- [x] Test: Forgot password request shows confirmation
- [x] All tests pass

**Files Modified**:
- `e2e/auth.spec.ts` - Rewrote with 15 comprehensive E2E tests covering all auth flows

**Dependencies**: All Phase 1, 3, 4 tasks

**Status**: COMPLETED - Auth E2E test suite covers login, signup, magic link, forgot password, logout, and dashboard access flows (15 tests total)

---

### Task 5.2: Complete Settings E2E Test Suite

- [x] Ensure `e2e/settings.spec.ts` covers settings page
- [x] Test: Unauthenticated user sees login prompt
- [x] Test: Authenticated user sees profile info
- [x] Test: Display name update saves and persists
- [x] Test: Email alerts section shows subscriptions
- [x] Test: Logout from settings works
- [x] All tests pass (15 tests)

**Files Modified**:
- `e2e/settings.spec.ts` - Rewritten with robust assertions (15 tests)
- `playwright.config.ts` - Added PLAYWRIGHT_TEST_BASE_URL support for flexible port configuration
- `e2e/auth.spec.ts`, `e2e/dashboard.spec.ts`, `e2e/reset-password.spec.ts`, `e2e/verify-magic-link.spec.ts` - Updated to use relative URLs

**Dependencies**: Task 1.3

**Status**: COMPLETED - Settings E2E test suite with 15 comprehensive tests covering:
- Unauthenticated user flows (2 tests)
- Authenticated user profile info (6 tests)
- Email alerts section (2 tests)
- Logout flow (4 tests)
- Unverified user badge (1 test)

---

### Task 5.3: Complete Reset Password E2E Test Suite

- [x] Ensure `e2e/reset-password.spec.ts` covers reset flow
- [x] Test: No token parameter shows error
- [x] Test: Invalid token shows error state
- [x] Test: Expired token shows error state
- [x] Test: Valid token shows password form
- [x] Test: Successful password reset shows success
- [x] Test: Weak password shows validation error
- [x] Test: Passwords must match validation
- [x] All tests pass

**Files to Modify/Verify**:
- `e2e/reset-password.spec.ts`

**Dependencies**: Tasks 2.2, 2.3

**Status**: COMPLETED - E2E test suite created with 8 tests covering all reset password scenarios

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
- [x] Complete user journey: signup → login → settings → logout
- [x] Password reset flow: request → email → reset → login
- [x] Dashboard shows real Convex data (not demo mode)
- [x] All unit tests pass: `npm test` - 503 tests passing
- [x] All E2E tests pass: `npx playwright test` - 52 tests passing

## ✅ PLAN COMPLETE

All phases and tasks have been successfully completed. The Convex backend integration is fully functional with comprehensive test coverage.
