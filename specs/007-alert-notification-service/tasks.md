# Task Breakdown: Alert Notification Service

## Overview
Total Tasks: 6 Task Groups

This task breakdown organizes the Alert Notification Service implementation into logical phases: schema modifications first, then core backend detection and email sending functionality, followed by the unsubscribe flow, and finally the notification preferences UI.

## Task List

### Database Layer

#### Task Group 1: Schema Modifications for Alert Subscriptions
**Dependencies:** 001-data-models-schema (existing alertSubscriptions table)

- [ ] 1.0 Complete schema modifications for region-specific subscriptions
  - [ ] 1.1 Write 4-6 focused tests for schema modifications
    - Test region field validation (required, non-empty string)
    - Test compound index uniqueness on (userId, gameId, region)
    - Test lastAlertSentAt field accepts timestamps and null
    - Test unsubscribeToken field stores secure tokens
    - Test existing subscription queries still function with new fields
  - [ ] 1.2 Add region field to alertSubscriptions table
    - Field type: string (required)
    - Add validation for non-empty region values
    - Reference region patterns from serverStatusRecords table
  - [ ] 1.3 Add lastAlertSentAt field to alertSubscriptions table
    - Field type: number (timestamp) or null
    - Default: null (allows immediate first alert)
    - Used for 30-minute cooldown calculation
  - [ ] 1.4 Add unsubscribeToken field to alertSubscriptions table
    - Field type: string
    - Generated using Convex crypto utilities
    - Must be unique per subscription
  - [ ] 1.5 Create compound index on (userId, gameId, region)
    - Enforce uniqueness for user subscriptions
    - Optimize queries for subscription lookups
  - [ ] 1.6 Create index on unsubscribeToken for fast lookups
    - Used by unsubscribe endpoint for token validation
  - [ ] 1.7 Update existing alertSubscriptions indexes to include region
    - Review by_userId index
    - Review by_gameId index if present
  - [ ] 1.8 Ensure schema modification tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify migrations apply cleanly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 1.1 pass
- alertSubscriptions table has region, lastAlertSentAt, and unsubscribeToken fields
- Compound index enforces uniqueness on (userId, gameId, region)
- Token lookup index enables fast unsubscribe validation
- Existing functionality not broken by schema changes

---

### Backend Core Services

#### Task Group 2: Status Transition Detection
**Dependencies:** Task Group 1, 002-server-status-fetching (status polling service)

- [ ] 2.0 Complete status transition detection system
  - [ ] 2.1 Write 4-6 focused tests for transition detection
    - Test offline-to-online transition triggers alert processing
    - Test online-to-offline transition does NOT trigger alerts
    - Test degraded/maintenance transitions are ignored
    - Test transitions processed per game+region independently
    - Test unknown status transitions are ignored
  - [ ] 2.2 Create internal function to compare previous vs new status
    - Accept gameId, region, previousStatus, newStatus parameters
    - Return boolean indicating if alert should be triggered
    - Only return true for offline -> online transitions
  - [ ] 2.3 Integrate with status polling service mutation
    - Hook into existing status update flow from 002-server-status-fetching
    - Capture previous status before update
    - Call transition detection after status update completes
  - [ ] 2.4 Trigger alert processing pipeline on valid transitions
    - Call alert processing internal action when offline->online detected
    - Pass gameId and region to alert processor
    - Log transition events for debugging
  - [ ] 2.5 Ensure transition detection tests pass
    - Run ONLY the 4-6 tests written in 2.1
    - Verify integration with status polling service
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 2.1 pass
- Only offline-to-online transitions trigger alert processing
- Degraded, maintenance, and unknown transitions are ignored
- Transitions processed independently per game+region
- Integration with status polling service works correctly

---

#### Task Group 3: Alert Processing Pipeline and Email Sending
**Dependencies:** Task Group 2

- [ ] 3.0 Complete alert processing and email sending system
  - [ ] 3.1 Write 6-8 focused tests for alert processing and email sending
    - Test querying active subscriptions for game+region
    - Test 30-minute cooldown filtering (skip within cooldown)
    - Test immediate alert when lastAlertSentAt is null
    - Test lastAlertSentAt updated after send initiated
    - Test email content includes required fields (game name, status, timestamp, links)
    - Test exponential backoff retry scheduling (1s, 2s, 4s delays)
    - Test max 3 retry attempts before final failure logged
  - [ ] 3.2 Create alert processing internal action
    - Accept gameId and region parameters
    - Query alertSubscriptions for active subscriptions matching game+region
    - Filter by isActive === true
  - [ ] 3.3 Implement 30-minute cooldown filtering logic
    - Calculate elapsed time since lastAlertSentAt
    - Skip subscriptions within 30-minute window
    - Allow immediate if lastAlertSentAt is null
    - Do not reset cooldown on failed sends
  - [ ] 3.4 Configure Resend API integration
    - Add RESEND_API_KEY to Convex environment variables
    - Create Resend client initialization in internal action
    - Follow Convex patterns for external API calls
  - [ ] 3.5 Create email template and content builder
    - Subject format: "[GameName] is back online - [Region]"
    - Body includes: game display name, status confirmation, timestamp
    - Include direct link to game dashboard
    - Include one-click unsubscribe link with token
    - Format timestamp in UTC (timezone support out of scope)
  - [ ] 3.6 Implement email sending internal action
    - Accept subscription details and email content
    - Call Resend API to send email
    - Return success/failure status
  - [ ] 3.7 Implement exponential backoff retry logic
    - Retry delays: 1 second, 2 seconds, 4 seconds
    - Use ctx.scheduler.runAfter for delayed retries
    - Track attempt count in scheduled function arguments
    - Maximum 3 total attempts
  - [ ] 3.8 Update lastAlertSentAt after send initiated
    - Create internal mutation to update timestamp
    - Call after email send attempt initiated (not after success)
    - Do not update on retry attempts
  - [ ] 3.9 Implement error handling and logging
    - Log all send attempts with subscription ID and status
    - Log Resend API errors with response details
    - Continue processing other recipients on individual failures
    - Log final failure after max attempts exhausted
  - [ ] 3.10 Ensure alert processing tests pass
    - Run ONLY the 6-8 tests written in 3.1
    - Verify end-to-end alert processing flow
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 6-8 tests written in 3.1 pass
- Active subscriptions queried correctly for game+region
- 30-minute cooldown enforced properly
- Emails sent via Resend with correct content
- Exponential backoff retries work (1s, 2s, 4s)
- Maximum 3 attempts before failure logged
- lastAlertSentAt updated after send initiated

---

#### Task Group 4: Unsubscribe Flow
**Dependencies:** Task Group 1

- [ ] 4.0 Complete unsubscribe handling system
  - [ ] 4.1 Write 4-6 focused tests for unsubscribe flow
    - Test secure token generation creates unique tokens
    - Test valid token sets subscription isActive to false
    - Test invalid token returns generic error (no info leak)
    - Test already-unsubscribed token handled gracefully
    - Test unsubscribe endpoint returns confirmation page
  - [ ] 4.2 Implement secure token generation
    - Use Convex crypto/random utilities
    - Generate cryptographically secure tokens
    - Ensure tokens are unique per subscription
    - Store token in unsubscribeToken field on subscription creation
  - [ ] 4.3 Create HTTP endpoint for unsubscribe
    - Route: /api/unsubscribe
    - Accept token as query parameter
    - Validate token against alertSubscriptions table
  - [ ] 4.4 Implement token validation and subscription deactivation
    - Query subscription by unsubscribeToken index
    - Set isActive to false on valid token
    - Do not delete subscription (allow reactivation via UI)
  - [ ] 4.5 Create confirmation page response
    - Return HTML confirmation page on success
    - Display user-friendly success message
    - Return generic message for invalid tokens
    - Do not reveal subscription existence for invalid tokens
  - [ ] 4.6 Ensure unsubscribe flow tests pass
    - Run ONLY the 4-6 tests written in 4.1
    - Verify end-to-end unsubscribe flow
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 4.1 pass
- Tokens are cryptographically secure and unique
- Valid tokens deactivate subscriptions
- Invalid tokens return generic error without info leakage
- Confirmation page displays on successful unsubscribe

---

### Frontend Layer

#### Task Group 5: Notification Preferences UI
**Dependencies:** Task Group 1, 004-user-authentication (settings page patterns)

- [ ] 5.0 Complete notification preferences UI
  - [ ] 5.1 Write 4-6 focused tests for notification preferences UI
    - Test subscription list displays game name, region, and status
    - Test toggle enables/disables subscription (isActive)
    - Test "Add subscription" flow creates new subscription
    - Test confirmation displays on add/remove actions
    - Test UI integrates with existing settings page
  - [ ] 5.2 Create notification preferences section component
    - Add to user profile/settings page
    - Follow existing settings page patterns from 004-user-authentication
    - Display section header "Alert Notifications" or similar
  - [ ] 5.3 Implement subscription list display
    - Query user's alertSubscriptions
    - Display game name, region, and isActive status for each
    - Show empty state when no subscriptions exist
    - Sort by game name or most recent
  - [ ] 5.4 Implement enable/disable toggle for subscriptions
    - Toggle updates isActive field
    - Use internal mutation for database update
    - Show visual feedback on toggle state change
    - Do not delete subscription on disable
  - [ ] 5.5 Create "Add subscription" flow
    - Button to initiate new subscription
    - Game selection (dropdown or search)
    - Region selection based on available regions for game
    - Validate uniqueness before creation
    - Generate unsubscribeToken on creation
  - [ ] 5.6 Implement confirmation feedback
    - Show success message when subscription added
    - Show success message when subscription toggled
    - Show error message if add fails (duplicate, etc.)
    - Use toast notifications or inline messages per existing patterns
  - [ ] 5.7 Apply styling consistent with settings page
    - Follow existing design system
    - Match spacing, typography, and colors from settings page
    - Ensure responsive layout
  - [ ] 5.8 Ensure notification preferences UI tests pass
    - Run ONLY the 4-6 tests written in 5.1
    - Verify UI renders and functions correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 5.1 pass
- Subscription list displays correctly with all fields
- Toggle enables/disables subscriptions without deletion
- Add subscription flow works with game+region selection
- Confirmation messages display on user actions
- UI matches existing settings page patterns

---

### Testing

#### Task Group 6: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-5

- [ ] 6.0 Review existing tests and fill critical gaps only
  - [ ] 6.1 Review tests from Task Groups 1-5
    - Review the 4-6 tests from schema modifications (Task 1.1)
    - Review the 4-6 tests from transition detection (Task 2.1)
    - Review the 6-8 tests from alert processing (Task 3.1)
    - Review the 4-6 tests from unsubscribe flow (Task 4.1)
    - Review the 4-6 tests from notification preferences UI (Task 5.1)
    - Total existing tests: approximately 22-32 tests
  - [ ] 6.2 Analyze test coverage gaps for this feature only
    - Identify critical end-to-end workflows lacking coverage
    - Focus ONLY on gaps related to alert notification service
    - Do NOT assess entire application test coverage
    - Prioritize integration tests over unit test gaps
  - [ ] 6.3 Write up to 8 additional strategic tests maximum
    - End-to-end: status transition triggers email to subscribed user
    - End-to-end: unsubscribe link in email deactivates subscription
    - Integration: cooldown prevents duplicate alerts within 30 minutes
    - Integration: retry logic handles temporary Resend failures
    - Integration: UI add subscription appears in list and receives alerts
    - Edge case: multiple users subscribed receive independent emails
    - Edge case: subscription toggled off does not receive alerts
    - Error handling: Resend API failure after max retries logged correctly
  - [ ] 6.4 Run feature-specific tests only
    - Run ONLY tests related to alert notification service
    - Expected total: approximately 30-40 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 30-40 tests total)
- Critical end-to-end workflows covered
- No more than 8 additional tests added
- Testing focused exclusively on alert notification service

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Schema Modifications** - Foundation for all other work
2. **Task Group 2: Status Transition Detection** - Core detection logic, depends on schema
3. **Task Group 3: Alert Processing and Email Sending** - Main functionality, depends on detection
4. **Task Group 4: Unsubscribe Flow** - Can run in parallel with Task Group 3, depends only on schema
5. **Task Group 5: Notification Preferences UI** - Frontend, depends on schema and benefits from backend being complete
6. **Task Group 6: Test Review and Gap Analysis** - Final validation after all features complete

```
Task Group 1 (Schema)
        |
        v
Task Group 2 (Detection)
        |
        v
Task Group 3 (Email Sending) <---> Task Group 4 (Unsubscribe) [parallel]
        |                                   |
        v                                   v
        +-----------------------------------+
                        |
                        v
              Task Group 5 (UI)
                        |
                        v
              Task Group 6 (Testing)
```

## Technical Notes

### Environment Configuration Required
- `RESEND_API_KEY` must be added to Convex environment variables before Task Group 3

### Key Files to Reference
- 001-data-models-schema: alertSubscriptions table definition
- 002-server-status-fetching: status polling service and serverStatusRecords table
- 004-user-authentication: user settings page patterns and auth utilities

### Convex Patterns to Follow
- Use `internalAction` for Resend API calls
- Use `internalMutation` for database writes
- Use `ctx.scheduler.runAfter` for retry scheduling
- Use `httpRouter` for unsubscribe endpoint
