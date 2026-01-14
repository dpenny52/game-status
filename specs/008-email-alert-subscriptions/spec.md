# Specification: Email Alert Subscriptions

## Goal

Enable users to subscribe to email notifications for specific game+region combinations via a bell icon on game cards, with subscription management available through the settings page.

## User Stories

- As a gamer, I want to subscribe to alerts for specific games and regions so that I receive an email when my preferred servers come back online
- As a subscribed user, I want to manage my existing subscriptions from the settings page so that I can pause, edit regions, or delete alerts I no longer need

## Specific Requirements

**Bell Icon Component**
- Create a reusable SubscriptionToggle component that renders a clickable bell icon
- Position the bell icon in the top-right corner of the game card (star is top-left)
- Implement two visual states: outline bell (not subscribed) and filled bell (subscribed to any region)
- Use onClick handler to open the region selection popover
- Include ARIA attributes for accessibility (aria-haspopup, aria-expanded, aria-label)
- Prevent event propagation to avoid triggering parent card interactions
- Only render for authenticated users (hide entirely when logged out)

**Region Selection Popover**
- Display a dropdown/popover anchored to the bell icon when clicked
- List all available regions as checkboxes: NA, EU, Asia, OCE, Global
- Allow multiple region selection within a single interaction
- Include a "Subscribe" or "Save" button to confirm selections
- Pre-check regions the user is already subscribed to when editing
- Close popover on outside click, Escape key, or successful submission
- Position popover to avoid viewport overflow (flip to above if near bottom)

**Visual State Management**
- Query user's existing subscriptions for each game to determine bell state
- Filled bell icon indicates at least one active subscription for that game
- Outline bell icon indicates no subscriptions exist for that game
- Do not display region count or subscription details on the game card itself
- Apply smooth CSS transition between filled and outline states
- Show loading indicator on bell icon during mutation

**Convex Mutations for Subscription CRUD**
- Create upsertSubscription mutation accepting gameId and array of selected regions
- For each selected region: create subscription if not exists, set isActive to true if paused
- For each unselected region: delete existing subscription record
- Use auth.getUserIdentity() to get current user ID
- Enforce uniqueness on (userId, gameId, region) combination
- Return success status and updated subscription count for toast feedback

**Convex Query for User Subscriptions**
- Create getUserSubscriptions query returning all subscriptions for current user
- Include game details (displayName, iconUrl) via join for settings page display
- Filter by userId using auth context
- Support filtering by isActive status for settings page views
- Return empty array for unauthenticated users without error

**Settings Page Subscription Management**
- Add "Email Alerts" section to existing settings page from 004-user-authentication
- Display list of all user subscriptions grouped by game
- For each subscription show: game icon, game name, subscribed regions, active status
- Provide inline toggle to pause/resume each subscription (sets isActive boolean)
- Display paused subscriptions with grayed-out/muted styling inline (not separate section)
- Include edit button to modify region selections via popover
- Include delete button with confirmation to remove subscription entirely

**Toast Notification System**
- Display brief toast notification on successful subscription creation
- Toast message format: "Subscribed to [Game Name] alerts"
- Auto-dismiss toast after 3 seconds
- Position toast in bottom-right corner of viewport
- Support stacking multiple toasts if rapid actions occur
- Use subtle animation for toast entrance and exit

**Optimistic UI Updates**
- Update bell icon state immediately on subscription save before server response
- Revert to previous state if mutation fails
- Show subtle error indicator via toast if operation fails
- Maintain responsive feel with immediate visual feedback

## Existing Code to Leverage

**FavoriteToggle Component from 005-favorites-system**
- Follow identical pattern for SubscriptionToggle component structure
- Reuse positioning approach (corner of game card) with mirrored placement
- Apply same onClick handler and event propagation prevention patterns
- Follow same conditional rendering logic for authenticated users only
- Reference optimistic UI update and error handling patterns

**alertSubscriptions Table from 001-data-models-schema**
- Use existing table with userId, gameId, region, isActive fields
- Leverage compound index on (userId, gameId, region) for uniqueness and queries
- Follow established foreign key patterns using v.id("users") and v.id("games")
- Use isActive boolean for pause/resume functionality as designed

**Authentication Context from 004-user-authentication**
- Use auth.getUserIdentity() in Convex mutations and queries for user identification
- Leverage useConvexAuth hook for client-side auth state checking
- Follow pattern of hiding protected features from unauthenticated users
- Integrate subscription management into existing settings page structure

**Game Card Component from 003-status-dashboard-ui**
- Extend existing GameCard component to accept subscription-related props
- Add slot for SubscriptionToggle in top-right corner alongside existing structure
- Maintain existing card layout and status display functionality

**Region Enum from 001-data-models-schema**
- Use defined region values: "na", "eu", "asia", "oce", "global"
- Display user-friendly labels in popover: NA, EU, Asia, OCE, Global
- Follow same enum pattern used in serverStatusRecords table

## Out of Scope

- Adding new subscriptions from the settings page (must use game cards)
- Separate section or page for paused subscriptions
- Displaying region count or subscription details on game cards
- Push notifications (browser or mobile)
- SMS notifications
- Frequency or throttling settings for individual subscriptions
- Subscription confirmation emails
- Bulk subscribe/unsubscribe operations
- Subscription import/export functionality
- Sharing subscriptions with other users
