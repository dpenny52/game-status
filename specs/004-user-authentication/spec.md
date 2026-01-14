# Specification: User Authentication

## Goal

Implement a complete user authentication system with email/password, OAuth (Discord, Twitch), and Magic Link passwordless login using Convex Auth, including modal-based login/signup flows, password reset, and profile management.

## User Stories

- As a new visitor, I want to create an account using my email or social login so that I can access personalized features like favorites and alerts
- As a returning user, I want to log in quickly using my preferred method (password, social, or magic link) so that I can access my saved preferences without friction

## Specific Requirements

**Email/Password Authentication**
- Implement signup flow collecting email, display name, and password
- Validate password meets requirements: minimum 8 characters, at least 1 number, at least 1 letter
- Display real-time password strength indicator during signup
- Hash passwords securely using Convex Auth built-in mechanisms
- Prevent duplicate account creation with existing email addresses
- Show specific validation errors inline for each form field

**Discord OAuth Integration**
- Configure Discord OAuth provider in Convex Auth
- Implement "Sign in with Discord" button on login/signup modals
- Handle OAuth callback to create or authenticate user
- Extract email and username from Discord profile for account creation
- Store providerType as "discord" and providerId with Discord user ID in Users table
- Handle OAuth errors gracefully with user-friendly messages

**Twitch OAuth Integration**
- Configure Twitch OAuth provider in Convex Auth
- Implement "Sign in with Twitch" button on login/signup modals
- Handle OAuth callback to create or authenticate user
- Extract email and display name from Twitch profile for account creation
- Store providerType as "twitch" and providerId with Twitch user ID in Users table
- Handle OAuth errors gracefully with user-friendly messages

**Magic Link Authentication**
- Implement passwordless email login option on login modal
- Generate secure, single-use token with 15-minute expiration
- Send magic link email with branded template and clear call-to-action
- Validate token on link click and create authenticated session
- Show confirmation message after magic link email is sent
- Handle expired or invalid tokens with clear error messaging

**Password Reset Flow**
- Create dedicated password reset page at /reset-password route
- Implement "Forgot password" link on login modal
- Generate time-limited reset token (1 hour expiration)
- Send password reset email with secure link
- Validate token before allowing password change
- Require new password to meet same validation requirements as signup
- Invalidate reset token after successful password change

**Session Management**
- Configure Convex Auth for 90-day default session duration
- Implement "Remember me" checkbox that extends session
- Store session tokens securely using Convex Auth defaults
- Provide logout functionality that clears session completely
- Handle expired sessions by redirecting to login modal

**Login Modal Component**
- Create modal overlay with semi-transparent backdrop
- Include email/password form with validation
- Display OAuth provider buttons (Discord, Twitch) prominently
- Include Magic Link option as alternative to password
- Add "Forgot password?" link leading to reset flow
- Include link to switch to signup modal for new users
- Close modal on successful authentication
- Prevent body scroll when modal is open

**Sign-up Modal Component**
- Create modal with consistent styling to login modal
- Include form fields: email, display name, password, confirm password
- Display OAuth options for quick signup via Discord or Twitch
- Show inline validation errors as user completes each field
- Include link to switch to login modal for existing users
- Create user record in Users table on successful signup
- Auto-login user after successful registration

**Profile/Settings Page**
- Create dedicated page at /settings route
- Display current user email and display name
- Allow editing of display name with save functionality
- Show email verification status (verified/unverified badge)
- Display connected OAuth provider if user signed up via social login
- Include logout button with confirmation
- Show account creation date for user reference

## Existing Code to Leverage

**Users Table Schema from 001-data-models-schema**
- Use existing email, displayName, isEmailVerified fields for core user data
- Populate providerType and providerId fields when user authenticates via OAuth
- Leverage created/updated timestamps for audit trail and profile display
- Follow established indexing patterns for email-based lookups

**Convex Auth Library Patterns**
- Use Convex Auth's built-in providers for Email/Password, OAuth, and Magic Link
- Follow Convex Auth session management for token handling and expiration
- Leverage auth.getUserIdentity() for accessing current user in queries and mutations
- Use Convex Auth's password hashing and validation utilities

**Frontend Component Standards**
- Follow frontend/components.md: single responsibility for each auth component
- Apply frontend/accessibility.md: proper form labels, focus management in modals, keyboard navigation
- Use consistent modal patterns established in the application (if any)
- Follow validation.md: client-side validation with server-side enforcement

**Dashboard UI Patterns from 003-status-dashboard-ui**
- Reuse loading state patterns for form submission states
- Follow established error handling UI patterns for auth failures
- Maintain visual consistency with existing application styling

## Out of Scope

- Admin user management interface for viewing/editing other users
- Two-factor authentication (2FA) via authenticator apps or SMS
- Account merging to link multiple auth methods to one account
- Email verification enforcement (tracked but not required for access)
- Additional OAuth providers beyond Discord and Twitch
- Social features like user profiles visible to others
- Account deletion or data export functionality
- Biometric authentication (fingerprint, face recognition)
- Session management across multiple devices (single session only)
- Rate limiting for login attempts (rely on Convex defaults)
