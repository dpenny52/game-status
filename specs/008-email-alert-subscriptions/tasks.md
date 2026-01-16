# Task Breakdown: Email Alert Subscriptions

## Overview
Total Tasks: 4 Task Groups, 29 Sub-tasks

This spec enables users to subscribe to email notifications for specific game+region combinations via a bell icon on game cards, with subscription management available in the settings page.

## Task List

### Backend Layer

#### Task Group 1: Convex Mutations and Queries
**Dependencies:** 001-data-models-schema (alertSubscriptions table exists)

- [x] 1.0 Complete Convex backend layer for subscriptions
  - [x] 1.1 Write 2-8 focused tests for subscription mutations and queries
    - Test upsertSubscription creates new subscription correctly
    - Test upsertSubscription updates existing subscription regions
    - Test upsertSubscription deletes unselected regions
    - Test getUserSubscriptions returns subscriptions for authenticated user
    - Test getUserSubscriptions returns empty array for unauthenticated user
    - Test getGameSubscription returns subscription status for specific game
  - [x] 1.2 Create `upsertSubscription` mutation
    - Accept gameId (v.id("games")) and regions array (v.array(v.string()))
    - Use auth.getUserIdentity() to get current userId
    - Return error if user is not authenticated
    - For each selected region: create subscription if not exists, set isActive to true if paused
    - For each unselected region: delete existing subscription record
    - Enforce uniqueness on (userId, gameId, region) combination
    - Return success status and updated subscription count for toast feedback
  - [x] 1.3 Create `toggleSubscriptionActive` mutation
    - Accept subscriptionId and isActive boolean
    - Verify ownership via auth.getUserIdentity()
    - Update isActive field for pause/resume functionality
    - Return updated subscription
  - [x] 1.4 Create `deleteSubscription` mutation
    - Accept subscriptionId
    - Verify ownership via auth.getUserIdentity()
    - Delete the subscription record entirely
    - Return success status
  - [x] 1.5 Create `getUserSubscriptions` query
    - Return all subscriptions for current user
    - Include game details (displayName, iconUrl) via join for settings page display
    - Filter by userId using auth context
    - Group results by gameId for efficient rendering
    - Return empty array for unauthenticated users without error
  - [x] 1.6 Create `getGameSubscription` query
    - Accept gameId parameter
    - Return subscription status and regions for specific game
    - Used by SubscriptionToggle to determine bell icon state
    - Return null/empty for unauthenticated users
  - [x] 1.7 Ensure backend layer tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify all mutations enforce authentication
    - Verify queries return correct data structure
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 1.1 pass
- upsertSubscription correctly handles create/update/delete of regions
- Queries return properly formatted subscription data with game details
- All mutations verify user ownership before modifying data
- Unauthenticated users receive empty arrays (not errors)

---

### Frontend Components

#### Task Group 2: SubscriptionToggle and Region Popover Components
**Dependencies:** Task Group 1

- [x] 2.0 Complete SubscriptionToggle component and region selection popover
  - [x] 2.1 Write 2-8 focused tests for SubscriptionToggle and popover
    - Test SubscriptionToggle renders outline bell when not subscribed
    - Test SubscriptionToggle renders filled bell when subscribed
    - Test clicking bell opens region selection popover
    - Test popover displays all 5 regions with checkboxes
    - Test popover pre-checks existing subscribed regions
    - Test clicking outside popover closes it
    - Test Escape key closes popover
    - Test Subscribe button triggers mutation
  - [x] 2.2 Create SubscriptionToggle component
    - Follow FavoriteToggle pattern from 005-favorites-system
    - Render clickable bell icon (outline or filled based on subscription state)
    - Position in top-right corner of game card (star is top-left)
    - Use onClick handler to open region selection popover
    - Prevent event propagation to avoid triggering parent card interactions
    - Include ARIA attributes: aria-haspopup, aria-expanded, aria-label
    - Only render for authenticated users (use useConvexAuth hook)
    - Show loading indicator during mutation
  - [x] 2.3 Create RegionSelectionPopover component
    - Anchor popover to bell icon position
    - List all regions as checkboxes: NA, EU, Asia, OCE, Global
    - Map internal values ("na", "eu", "asia", "oce", "global") to display labels
    - Allow multiple region selection
    - Include "Subscribe" button (or "Save" when editing existing)
    - Pre-check regions user is already subscribed to
    - Position popover to avoid viewport overflow (flip to above if near bottom)
  - [x] 2.4 Implement popover close behaviors
    - Close on outside click (use click-outside detection)
    - Close on Escape key press
    - Close on successful subscription submission
    - Manage focus appropriately for accessibility
  - [x] 2.5 Implement optimistic UI updates
    - Update bell icon state immediately on subscription save
    - Revert to previous state if mutation fails
    - Show subtle error indicator via toast if operation fails
    - Maintain responsive feel with immediate visual feedback
  - [x] 2.6 Apply visual states and transitions
    - CSS transition between filled and outline bell states
    - Loading spinner overlay on bell icon during mutation
    - Hover and focus states for accessibility
  - [x] 2.7 Integrate SubscriptionToggle into GameCard
    - Extend existing GameCard component to accept subscription props
    - Add slot for SubscriptionToggle in top-right corner
    - Maintain existing card layout and status display functionality
    - Reference 003-status-dashboard-ui for GameCard structure
  - [x] 2.8 Ensure component tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify bell icon states render correctly
    - Verify popover interactions work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 2.1 pass
- Bell icon displays correct state (outline/filled) based on subscription
- Popover allows multi-region selection and submission
- Component only renders for authenticated users
- Optimistic updates provide immediate feedback
- All ARIA attributes present for accessibility

---

#### Task Group 3: Settings Page and Toast Notifications
**Dependencies:** Task Group 1, Task Group 2

- [x] 3.0 Complete settings page subscription management and toast system
  - [x] 3.1 Write 2-8 focused tests for settings page and toasts
    - Test Email Alerts section renders in settings page
    - Test subscriptions list displays grouped by game
    - Test pause/resume toggle updates subscription isActive
    - Test delete button shows confirmation dialog
    - Test delete confirmation removes subscription
    - Test toast appears on successful subscription
    - Test toast auto-dismisses after 3 seconds
  - [x] 3.2 Create EmailAlertsSection component for settings page
    - Add "Email Alerts" section to existing settings page from 004-user-authentication
    - Query getUserSubscriptions for current user's subscriptions
    - Display empty state message if no subscriptions
    - Group subscriptions by game for display
  - [x] 3.3 Create SubscriptionListItem component
    - Display game icon and game name
    - Show list of subscribed regions as tags/badges
    - Include active status indicator
    - Apply grayed-out/muted styling for paused subscriptions (isActive = false)
  - [x] 3.4 Implement pause/resume toggle
    - Inline toggle to set isActive boolean
    - Call toggleSubscriptionActive mutation
    - Update visual state immediately (optimistic update)
    - Paused items remain in place but visually muted
  - [x] 3.5 Implement edit regions functionality
    - Edit button opens RegionSelectionPopover (reuse from Task Group 2)
    - Pre-populate with current subscribed regions
    - Call upsertSubscription mutation on save
    - Update list immediately on success
  - [x] 3.6 Implement delete with confirmation
    - Delete button triggers confirmation dialog
    - Confirmation message: "Remove alerts for [Game Name]?"
    - Call deleteSubscription mutation on confirm
    - Remove item from list on success
  - [x] 3.7 Create Toast notification component
    - Bottom-right positioned toast container
    - Message format: "Subscribed to [Game Name] alerts"
    - Auto-dismiss after 3 seconds
    - Support stacking multiple toasts
    - Subtle entrance and exit animations
    - Use or create toast context/provider for global access
  - [x] 3.8 Integrate toast notifications
    - Show success toast on subscription creation
    - Show error toast on mutation failure
    - Trigger toasts from SubscriptionToggle and settings page actions
  - [x] 3.9 Ensure settings page and toast tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify settings page displays subscriptions correctly
    - Verify management actions work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 3.1 pass
- Email Alerts section appears in settings page
- Subscriptions display with game info and region badges
- Pause/resume toggle works with immediate visual feedback
- Edit popover allows region modification
- Delete shows confirmation before removing
- Toast notifications appear and auto-dismiss correctly

---

### Testing

#### Task Group 4: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-3

- [x] 4.0 Review existing tests and fill critical gaps only
  - [x] 4.1 Review tests from Task Groups 1-3
    - Review the 2-8 tests written by backend developer (Task 1.1)
    - Review the 2-8 tests written for components (Task 2.1)
    - Review the 2-8 tests written for settings/toasts (Task 3.1)
    - Total existing tests: approximately 18-24 tests
  - [x] 4.2 Analyze test coverage gaps for subscription feature only
    - Identify critical user workflows lacking test coverage
    - Focus ONLY on gaps related to email alert subscriptions
    - Do NOT assess entire application test coverage
    - Prioritize end-to-end workflows over unit test gaps
  - [x] 4.3 Write up to 10 additional strategic tests maximum
    - Focus on integration between components
    - Test complete subscription workflow: click bell -> select regions -> subscribe -> verify toast -> check settings
    - Test complete unsubscribe workflow: settings page -> delete -> confirm -> verify removed
    - Test authentication boundary: verify unauthenticated users see no bell icons
    - Test optimistic update revert on mutation failure
    - Do NOT write comprehensive coverage for all edge cases
  - [x] 4.4 Run feature-specific tests only
    - Run ONLY tests related to email alert subscriptions (tests from 1.1, 2.1, 3.1, and 4.3)
    - Expected total: approximately 28-34 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 28-34 tests total)
- Critical user workflows for subscription feature are covered
- No more than 10 additional tests added when filling in testing gaps
- Testing focused exclusively on email alert subscriptions requirements

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Convex Mutations and Queries** (Backend)
   - Foundation for all frontend features
   - No dependencies on frontend code

2. **Task Group 2: SubscriptionToggle and Region Popover** (Frontend Components)
   - Depends on backend queries/mutations from Group 1
   - Core subscription entry point for users

3. **Task Group 3: Settings Page and Toast Notifications** (Frontend Integration)
   - Depends on both backend (Group 1) and reuses RegionSelectionPopover (Group 2)
   - Completes the subscription management experience

4. **Task Group 4: Test Review and Gap Analysis** (Quality Assurance)
   - Depends on all previous groups being complete
   - Validates end-to-end functionality

---

## Key Files to Create/Modify

### New Files
- `convex/subscriptions.ts` - Mutations and queries for subscriptions
- `src/components/SubscriptionToggle.tsx` - Bell icon toggle component
- `src/components/RegionSelectionPopover.tsx` - Region checkbox popover
- `src/components/SubscriptionListItem.tsx` - Settings page list item
- `src/components/EmailAlertsSection.tsx` - Settings page section
- `src/components/Toast.tsx` - Toast notification component
- `src/contexts/ToastContext.tsx` - Toast provider for global access

### Files to Modify
- `src/components/GameCard.tsx` - Add SubscriptionToggle slot
- `src/pages/Settings.tsx` - Add Email Alerts section

### Test Files
- `convex/subscriptions.test.ts` - Backend tests
- `src/components/SubscriptionToggle.test.tsx` - Component tests
- `src/components/RegionSelectionPopover.test.tsx` - Popover tests
- `src/components/EmailAlertsSection.test.tsx` - Settings section tests
- `src/components/Toast.test.tsx` - Toast tests

---

## Reference Patterns

- **FavoriteToggle** (005-favorites-system): Component structure, positioning, auth check, optimistic updates
- **alertSubscriptions table** (001-data-models-schema): Data model with userId, gameId, region, isActive
- **User authentication** (004-user-authentication): auth.getUserIdentity(), useConvexAuth hook, settings page structure
- **GameCard** (003-status-dashboard-ui): Component to extend with SubscriptionToggle slot
