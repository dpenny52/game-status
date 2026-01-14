# Spec Requirements: User Authentication

## Initial Description
Implement a complete user authentication system supporting multiple authentication methods including email/password, OAuth providers (Discord, Twitch), and Magic Link passwordless login.

## Requirements Discussion

### First Round Questions

**Q1:** What authentication methods should be supported?
**Answer:** Email/password, Discord OAuth, Twitch OAuth, and Magic Link (passwordless email login)

**Q2:** Which authentication provider/library should be used?
**Answer:** Convex Auth

**Q3:** Is email verification required before users can access features?
**Answer:** Not required - users can access all features without verification

**Q4:** What are the password requirements?
**Answer:** Minimum 8 characters with at least one number and one letter (sufficient)

**Q5:** What should the session duration be?
**Answer:** 90 days with "remember me" option

**Q6:** How should password reset work?
**Answer:** Standard email-based reset flow with time-limited tokens

**Q7:** What UI components are needed?
**Answer:** Login modal, Sign-up modal, Password reset page (separate), Profile/Settings page (separate)

**Q8:** What features should be excluded from this spec?
**Answer:** Admin management, two-factor authentication, account merging

### Existing Code to Reference

**Schema context from 001-data-models-schema:**
- Users table with fields: email, displayName, isEmailVerified, providerType (optional), providerId (optional), timestamps

No other similar existing features identified for reference.

### Follow-up Questions
None required - comprehensive requirements provided upfront.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements
- Email/password authentication with signup and login flows
- Discord OAuth integration for social login
- Twitch OAuth integration for social login
- Magic Link passwordless email authentication
- Password reset via email with time-limited tokens
- Session management with 90-day duration
- "Remember me" functionality for extended sessions
- User profile/settings management

### Technical Stack
- **Framework:** TypeScript, React + Vite (frontend)
- **Backend/Auth:** Convex with Convex Auth
- **Database:** Convex

### UI Components Required
1. **Login Modal** - Modal component for user sign-in
2. **Sign-up Modal** - Modal component for new user registration
3. **Password Reset Page** - Dedicated page for password recovery flow
4. **Profile/Settings Page** - Dedicated page for user account management

### Authentication Specifications
- **Password Requirements:** Minimum 8 characters, at least 1 number, at least 1 letter
- **Session Duration:** 90 days default
- **Remember Me:** Extended session option available
- **Email Verification:** Optional (not blocking)
- **OAuth Providers:** Discord, Twitch

### Data Model Integration
Leverages existing Users table from 001-data-models-schema:
- `email` - User's email address
- `displayName` - User's display name
- `isEmailVerified` - Email verification status (tracked but not enforced)
- `providerType` - OAuth provider type (optional, for social logins)
- `providerId` - OAuth provider user ID (optional, for social logins)
- `timestamps` - Created/updated timestamps

### Scope Boundaries

**In Scope:**
- Email/password registration and login
- Discord OAuth login
- Twitch OAuth login
- Magic Link passwordless login
- Password reset flow with email tokens
- Login modal component
- Sign-up modal component
- Password reset page
- Profile/Settings page
- Session management (90-day duration)
- "Remember me" option

**Out of Scope:**
- Admin user management interface
- Two-factor authentication (2FA)
- Account merging (linking multiple auth methods to one account)
- Email verification enforcement
- Additional OAuth providers beyond Discord and Twitch

### Technical Considerations
- Convex Auth handles authentication primitives and session management
- OAuth callbacks need proper configuration for Discord and Twitch
- Magic Link emails require email sending capability (via Convex or external service)
- Password reset tokens should be time-limited (standard practice: 1 hour)
- Modals should integrate with existing application modal/dialog patterns
- Profile page should allow users to view/edit displayName and see connected providers
