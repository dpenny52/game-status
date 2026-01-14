# Spec Requirements: Email Alert Subscriptions

## Initial Description

Enable users to subscribe to email notifications for specific games, storing their alert preferences in the database. This feature allows gamers to be notified when their favorite games' servers come back online, so they can do other things instead of constantly refreshing status pages.

## Requirements Discussion

### First Round Questions

**Q1:** Where should users be able to subscribe to alerts - only from game cards on the dashboard, or also from a dedicated settings/alerts page?
**Answer:** Only bell icon on game cards (no separate settings page for adding)

**Q2:** When clicking to subscribe, should users select specific regions (NA, EU, Asia, etc.) or subscribe to all regions for that game?
**Answer:** Dropdown/popover when clicking bell, users can subscribe to multiple regions at once

**Q3:** How should the UI indicate that a user is already subscribed to a game's alerts?
**Answer:** Filled bell icon on game card when subscribed (similar to gold star for favorites)

**Q4:** Should the subscription indicator show the number of regions subscribed to, or just a generic "subscribed" state?
**Answer:** Just generic "Subscribed" indicator (not showing region count)

**Q5:** For the settings page that manages existing subscriptions, should there be an "Add New" button that lets users add subscriptions from there, or only manage existing ones?
**Answer:** No "Add New" button in settings - only add from game cards. Settings page just lists/manages existing subscriptions

**Q6:** When displaying subscriptions in a list, should paused subscriptions appear in a separate section or be grayed out inline?
**Answer:** Appear grayed out in the list (not separate section)

**Q7:** Should there be a confirmation dialog or toast when subscribing/unsubscribing?
**Answer:** Brief toast notification when subscribing

**Q8:** Is there anything you want to explicitly exclude from this feature's scope?
**Answer:** Nothing to exclude

### Existing Code to Reference

**Similar Features Identified:**
- Spec: 001-data-models-schema - Path: `agent-os/specs/001-data-models-schema/` - alertSubscriptions table with userId, gameId, region, isActive
- Spec: 004-user-authentication - Path: `agent-os/specs/004-user-authentication/` - user accounts system
- Spec: 005-favorites-system - Path: `agent-os/specs/005-favorites-system/` - star icon pattern to reference for bell icon implementation
- Spec: 007-alert-notification-service - Path: `agent-os/specs/007-alert-notification-service/` - backend notification service that this spec feeds into

**Components to potentially reuse:**
- Favorites star icon toggle pattern (from 005-favorites-system) for the bell icon subscription toggle
- User authentication context and hooks (from 004-user-authentication)

**Backend logic to reference:**
- alertSubscriptions table schema including userId, gameId, region, isActive fields (from 001-data-models-schema)
- Alert notification service integration points (from 007-alert-notification-service)

### Follow-up Questions

No follow-up questions were needed - all requirements were clearly specified in the initial answers.

## Visual Assets

### Files Provided:
No visual files found in the planning/visuals/ directory.

### Visual Insights:
No visual assets provided. The implementation should follow the existing UI patterns from the favorites system (005-favorites-system) for the bell icon toggle behavior.

## Requirements Summary

### Functional Requirements

**Subscription Entry Point:**
- Bell icon on each game card in the dashboard
- Clicking bell opens a dropdown/popover for region selection
- Users can select multiple regions at once
- No subscription functionality on settings page (view/manage only)

**Region Selection:**
- Dropdown or popover UI when clicking the bell icon
- Support for multiple region selection in a single interaction
- Regions to be determined by game (common: NA, EU, Asia, OCE, etc.)

**Visual Feedback:**
- Unfilled/outline bell icon = not subscribed
- Filled bell icon = subscribed (any region)
- Follows same pattern as gold star for favorites
- Generic "Subscribed" state (no region count displayed on card)

**Subscription Management (Settings Page):**
- List all existing subscriptions
- Allow editing region selections for existing subscriptions
- Allow pausing/unpausing subscriptions
- Allow deleting subscriptions
- Paused subscriptions appear grayed out inline (not separate section)
- No "Add New" functionality - must add from game cards

**User Notifications:**
- Brief toast notification on successful subscription
- Toast should confirm the action without being intrusive

### Reusability Opportunities

- Star icon toggle component from favorites system (adapt for bell icon)
- User authentication hooks and context
- Existing alertSubscriptions table schema (already defined)
- Toast notification system (if exists) or create reusable component
- Game card component (add bell icon slot)

### Scope Boundaries

**In Scope:**
- Bell icon on game cards for subscription entry
- Region selection dropdown/popover UI
- Filled/unfilled bell icon states
- Toast notification on subscription
- Settings page for listing and managing existing subscriptions
- Pause/unpause subscription functionality with grayed-out visual
- Delete subscription functionality
- Convex mutations for CRUD operations on alertSubscriptions

**Out of Scope:**
- Adding subscriptions from settings page
- Separate section for paused subscriptions
- Region count display on game cards
- Push notifications (email only via 007-alert-notification-service)
- Frequency/throttling settings for alerts
- Subscription confirmation emails

### Technical Considerations

**Tech Stack:**
- TypeScript across frontend and backend
- React + Vite for frontend UI components
- Convex for database and real-time subscriptions

**Integration Points:**
- alertSubscriptions table (defined in 001-data-models-schema)
- User authentication system (004-user-authentication)
- Alert notification service (007-alert-notification-service) - this spec creates the subscription data that service will use

**Data Model (from 001-data-models-schema):**
- alertSubscriptions table with: userId, gameId, region, isActive

**UI Patterns to Follow:**
- Favorites star icon pattern for bell icon toggle (from 005-favorites-system)
- Existing game card component structure
- Existing settings page patterns (if applicable)
