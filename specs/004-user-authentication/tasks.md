# Task Breakdown: User Authentication

## Overview
Total Tasks: 7 Task Groups

## Task List

### Setup & Configuration

#### Task Group 1: Convex Auth Setup
**Dependencies:** 001-data-models-schema (Users table)

- [ ] 1.0 Complete Convex Auth configuration
  - [ ] 1.1 Write 2-4 focused tests for auth configuration
    - Test that auth providers are properly configured
    - Test session duration configuration (90-day default)
    - Test auth utility functions return expected types
  - [ ] 1.2 Install and configure Convex Auth package
    - Add @convex-dev/auth dependency
    - Initialize auth configuration in convex/auth.config.ts
  - [ ] 1.3 Configure session management settings
    - Set 90-day default session duration
    - Configure session token storage
    - Set up session expiration handling
  - [ ] 1.4 Create auth utility functions
    - Implement getCurrentUser query using auth.getUserIdentity()
    - Create isAuthenticated helper function
    - Set up auth context provider for React
  - [ ] 1.5 Ensure auth configuration tests pass
    - Run ONLY the 2-4 tests written in 1.1
    - Verify Convex Auth initializes correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 1.1 pass
- Convex Auth package is installed and configured
- Session duration is set to 90 days
- Auth utility functions are available for use in queries/mutations

---

### Backend Authentication Methods

#### Task Group 2: Email/Password Authentication
**Dependencies:** Task Group 1

- [ ] 2.0 Complete email/password authentication backend
  - [ ] 2.1 Write 4-6 focused tests for email/password auth
    - Test successful user signup with valid credentials
    - Test password validation (min 8 chars, 1 number, 1 letter)
    - Test duplicate email prevention
    - Test successful login with correct credentials
    - Test login failure with incorrect password
  - [ ] 2.2 Configure Email/Password provider in Convex Auth
    - Enable password provider in auth config
    - Configure password hashing (use Convex Auth defaults)
  - [ ] 2.3 Implement signup mutation
    - Accept email, displayName, password
    - Validate password requirements
    - Check for existing email in Users table
    - Create user record with hashed password
    - Return authenticated session
  - [ ] 2.4 Implement login mutation
    - Accept email and password
    - Validate credentials against stored hash
    - Create session on successful authentication
    - Return user data and session token
  - [ ] 2.5 Implement password validation utility
    - Minimum 8 characters validation
    - At least 1 letter requirement
    - At least 1 number requirement
    - Return specific validation error messages
  - [ ] 2.6 Ensure email/password auth tests pass
    - Run ONLY the 4-6 tests written in 2.1
    - Verify signup and login flows work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 2.1 pass
- Users can sign up with email/password
- Password validation enforces all requirements
- Duplicate emails are prevented
- Login authenticates and creates session

---

#### Task Group 3: OAuth Providers (Discord & Twitch)
**Dependencies:** Task Group 1

- [ ] 3.0 Complete OAuth authentication backend
  - [ ] 3.1 Write 4-6 focused tests for OAuth authentication
    - Test Discord OAuth callback creates/authenticates user
    - Test Twitch OAuth callback creates/authenticates user
    - Test OAuth user data extraction (email, displayName)
    - Test providerType and providerId are stored correctly
  - [ ] 3.2 Configure Discord OAuth provider
    - Add Discord provider to Convex Auth config
    - Set up client ID and secret (environment variables)
    - Configure OAuth callback URL
    - Define profile data extraction (email, username)
  - [ ] 3.3 Configure Twitch OAuth provider
    - Add Twitch provider to Convex Auth config
    - Set up client ID and secret (environment variables)
    - Configure OAuth callback URL
    - Define profile data extraction (email, display_name)
  - [ ] 3.4 Implement OAuth callback handler
    - Handle successful OAuth authentication
    - Extract user profile data from provider
    - Create new user record if first login
    - Update providerType and providerId in Users table
    - Create authenticated session
  - [ ] 3.5 Implement OAuth error handling
    - Catch and log OAuth failures
    - Return user-friendly error messages
    - Handle denied permissions gracefully
  - [ ] 3.6 Ensure OAuth tests pass
    - Run ONLY the 4-6 tests written in 3.1
    - Verify OAuth flows work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 3.1 pass
- Discord OAuth authenticates and creates users
- Twitch OAuth authenticates and creates users
- Provider data is stored in Users table
- OAuth errors are handled gracefully

---

#### Task Group 4: Magic Link & Password Reset
**Dependencies:** Task Group 1, Task Group 2

- [ ] 4.0 Complete Magic Link and Password Reset backend
  - [ ] 4.1 Write 4-6 focused tests for Magic Link and Password Reset
    - Test Magic Link token generation (15-min expiration)
    - Test Magic Link authentication with valid token
    - Test Magic Link failure with expired token
    - Test password reset token generation (1-hour expiration)
    - Test password update with valid reset token
  - [ ] 4.2 Implement Magic Link token generation
    - Generate secure single-use token
    - Set 15-minute expiration
    - Store token with associated email
    - Configure email template with branded styling
  - [ ] 4.3 Implement Magic Link verification
    - Validate token exists and is not expired
    - Validate token is single-use (invalidate after use)
    - Create or authenticate user on valid token
    - Return authenticated session
  - [ ] 4.4 Implement password reset token generation
    - Generate secure reset token
    - Set 1-hour expiration
    - Store token associated with user email
    - Send password reset email with link
  - [ ] 4.5 Implement password reset mutation
    - Validate reset token is valid and not expired
    - Validate new password meets requirements
    - Update user password with new hash
    - Invalidate reset token after use
    - Return success confirmation
  - [ ] 4.6 Ensure Magic Link and Password Reset tests pass
    - Run ONLY the 4-6 tests written in 4.1
    - Verify token generation and validation work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 4.1 pass
- Magic Link tokens are generated with 15-min expiration
- Magic Link authentication works with valid tokens
- Password reset tokens are generated with 1-hour expiration
- Password can be updated via reset flow

---

### Frontend Components

#### Task Group 5: Auth Modal Components
**Dependencies:** Task Groups 2, 3, 4

- [ ] 5.0 Complete authentication modal components
  - [ ] 5.1 Write 4-6 focused tests for modal components
    - Test Login modal renders with all auth options
    - Test Signup modal form validation displays errors
    - Test modal close on successful authentication
    - Test switch between Login and Signup modals
    - Test password strength indicator updates
  - [ ] 5.2 Create base Modal component
    - Implement modal overlay with semi-transparent backdrop
    - Add click-outside-to-close functionality
    - Prevent body scroll when modal is open
    - Handle ESC key to close modal
    - Manage focus trap within modal (accessibility)
  - [ ] 5.3 Create Login modal component
    - Email/password form with validation
    - OAuth buttons (Discord, Twitch) prominently displayed
    - Magic Link option section
    - "Forgot password?" link to reset flow
    - "Create account" link to switch to Signup modal
    - Loading state during authentication
    - Error message display area
  - [ ] 5.4 Create Signup modal component
    - Form fields: email, displayName, password, confirm password
    - Real-time password strength indicator
    - Inline validation errors for each field
    - OAuth signup options (Discord, Twitch)
    - "Already have an account?" link to Login modal
    - Loading state during registration
    - Auto-login after successful signup
  - [ ] 5.5 Implement password strength indicator component
    - Visual strength meter (weak/medium/strong)
    - Real-time updates as user types
    - Color coding (red/yellow/green)
    - Requirements checklist display
  - [ ] 5.6 Implement form validation utilities
    - Email format validation
    - Password requirements validation
    - Display name length validation
    - Confirm password match validation
  - [ ] 5.7 Style modal components
    - Consistent styling between Login and Signup modals
    - Follow existing application design patterns
    - Mobile-responsive modal sizing
    - OAuth button styling with provider branding
  - [ ] 5.8 Ensure modal component tests pass
    - Run ONLY the 4-6 tests written in 5.1
    - Verify modal interactions work correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 5.1 pass
- Login modal displays all authentication options
- Signup modal validates all fields inline
- Password strength indicator updates in real-time
- Modals switch between each other correctly
- Modals close on successful authentication

---

#### Task Group 6: Auth Pages & Profile
**Dependencies:** Task Groups 2, 4, 5

- [ ] 6.0 Complete authentication pages and profile
  - [ ] 6.1 Write 4-6 focused tests for auth pages
    - Test Password Reset page renders at /reset-password
    - Test Settings page renders user data at /settings
    - Test displayName edit and save functionality
    - Test logout button clears session
  - [ ] 6.2 Create Password Reset page
    - Route at /reset-password
    - Token validation from URL parameter
    - New password form with validation
    - Confirm password field
    - Success/error message display
    - Link back to login on success
  - [ ] 6.3 Create Profile/Settings page
    - Route at /settings
    - Protected route (redirect if not authenticated)
    - Display current email (read-only)
    - Editable displayName with save button
    - Email verification status badge
    - Connected OAuth provider display (if applicable)
    - Account creation date display
    - Logout button with confirmation
  - [ ] 6.4 Implement displayName update mutation
    - Validate displayName is not empty
    - Update Users table record
    - Return updated user data
  - [ ] 6.5 Implement logout functionality
    - Clear session token
    - Redirect to home page
    - Show confirmation toast/message
  - [ ] 6.6 Implement auth state management
    - Global auth context for React
    - Persist auth state across page navigation
    - Handle session expiration (redirect to login)
    - Provide useAuth hook for components
  - [ ] 6.7 Style auth pages
    - Consistent styling with application design
    - Mobile-responsive layouts
    - Form styling matching modal components
    - Status badges and button styles
  - [ ] 6.8 Ensure auth page tests pass
    - Run ONLY the 4-6 tests written in 6.1
    - Verify page functionality works correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 6.1 pass
- Password Reset page validates tokens and updates passwords
- Settings page displays and allows editing user data
- Logout clears session and redirects
- Auth state is managed globally

---

### Testing

#### Task Group 7: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-6

- [ ] 7.0 Review existing tests and fill critical gaps only
  - [ ] 7.1 Review tests from Task Groups 1-6
    - Review the 2-4 tests from Convex Auth setup (Task 1.1)
    - Review the 4-6 tests from Email/Password auth (Task 2.1)
    - Review the 4-6 tests from OAuth providers (Task 3.1)
    - Review the 4-6 tests from Magic Link/Password Reset (Task 4.1)
    - Review the 4-6 tests from Modal components (Task 5.1)
    - Review the 4-6 tests from Auth pages (Task 6.1)
    - Total existing tests: approximately 22-34 tests
  - [ ] 7.2 Analyze test coverage gaps for authentication feature only
    - Identify critical authentication workflows lacking coverage
    - Focus ONLY on gaps related to this spec's requirements
    - Do NOT assess entire application test coverage
    - Prioritize end-to-end auth flows over unit test gaps
  - [ ] 7.3 Write up to 10 additional strategic tests maximum
    - Add maximum of 10 new tests to fill identified critical gaps
    - Focus on integration points between auth methods
    - Test end-to-end flows: signup -> login -> logout
    - Test OAuth to email account scenarios
    - Test session expiration and refresh flows
    - Do NOT write comprehensive coverage for all edge cases
  - [ ] 7.4 Run authentication feature tests only
    - Run ONLY tests related to this spec's feature
    - Expected total: approximately 32-44 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical auth workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 32-44 tests total)
- Critical authentication workflows are covered
- No more than 10 additional tests added
- Testing focused exclusively on authentication feature requirements

---

## Execution Order

Recommended implementation sequence:

```
Task Group 1: Convex Auth Setup
      |
      v
+-----+-----+
|           |
v           v
Task Group 2    Task Group 3
(Email/Password)  (OAuth Providers)
|           |
+-----+-----+
      |
      v
Task Group 4: Magic Link & Password Reset
      |
      v
Task Group 5: Auth Modal Components
      |
      v
Task Group 6: Auth Pages & Profile
      |
      v
Task Group 7: Test Review & Gap Analysis
```

**Notes:**
- Task Groups 2 and 3 can be worked on in parallel after Task Group 1 is complete
- Task Group 4 depends on Task Group 2 for password reset (reuses password validation)
- Task Groups 5 and 6 require all backend auth methods to be complete
- Task Group 7 should only begin after all other groups are complete

## Technical References

**Existing Code Dependencies:**
- Users table schema from 001-data-models-schema
- Dashboard UI patterns from 003-status-dashboard-ui

**Key Files to Create/Modify:**
- `convex/auth.config.ts` - Auth configuration
- `convex/auth.ts` - Auth mutations and queries
- `src/components/auth/LoginModal.tsx`
- `src/components/auth/SignupModal.tsx`
- `src/components/auth/PasswordStrengthIndicator.tsx`
- `src/pages/ResetPassword.tsx`
- `src/pages/Settings.tsx`
- `src/hooks/useAuth.ts`
- `src/context/AuthContext.tsx`

**Environment Variables Required:**
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
