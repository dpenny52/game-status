# Specification: Alert Notification Service

## Goal

Build a backend service that detects when games transition from offline to online status and sends email notifications via Resend to users subscribed to specific game+region combinations, with rate limiting, retry logic, and a UI for managing notification preferences.

## User Stories

- As a subscribed user, I want to receive an email notification when a game I follow comes back online so that I can start playing immediately without constantly checking the dashboard
- As a user receiving alerts, I want to easily unsubscribe from notifications with one click so that I can stop receiving emails I no longer want

## Specific Requirements

**Schema Modification for Region Support**
- Add required `region` field to alertSubscriptions table to support region-specific subscriptions
- Create compound index on (userId, gameId, region) for uniqueness enforcement
- Add `lastAlertSentAt` field if not present to track rate limiting per subscription
- Add `unsubscribeToken` field to store secure token for one-click unsubscribe
- Ensure existing alertSubscriptions indexes are updated to include region field

**Status Transition Detection**
- Integrate with status polling service from 002-server-status-fetching to detect transitions
- Compare previous status with new status after each poll cycle
- Trigger alert processing only when status changes from "offline" to "online"
- Ignore transitions involving "degraded", "maintenance", or "unknown" statuses
- Process transitions per game+region combination independently

**Alert Processing Pipeline**
- Create Convex internal action triggered when offline-to-online transition detected
- Query alertSubscriptions table for all active subscriptions matching game+region
- Filter out subscriptions that have received an alert within the 30-minute cooldown window
- Batch eligible recipients and dispatch email sending for each
- Update lastAlertSentAt timestamp after successful send attempt initiated

**Rate Limiting Implementation**
- Enforce 30-minute cooldown between alerts per user+game+region combination
- Calculate cooldown based on lastAlertSentAt field in alertSubscriptions table
- Skip alert for subscriptions within cooldown window without error
- Allow immediate alert if lastAlertSentAt is null (first alert)
- Do not reset cooldown on failed send attempts

**Email Sending with Resend**
- Configure Resend API key in Convex environment variables
- Create email template including: game name, new status (online), timestamp, dashboard link
- Generate unique unsubscribe link with secure token for each email
- Use Convex internal action for Resend API calls
- Format timestamp in recipient's timezone if available, otherwise UTC

**Exponential Backoff Retry Logic**
- Implement retry delays: 1 second, then 2 seconds, then 4 seconds between attempts
- Maximum of 3 total attempts per email send operation
- Use Convex scheduler.runAfter for delayed retry scheduling
- Track retry attempt count in scheduled function arguments
- Log final failure after max attempts exhausted without blocking other sends

**Unsubscribe Handling**
- Generate cryptographically secure unsubscribe tokens using Convex random utilities
- Store token in alertSubscriptions table linked to specific subscription
- Create HTTP endpoint at /api/unsubscribe that accepts token parameter
- Validate token and set subscription isActive to false on valid request
- Display confirmation page after successful unsubscribe
- Return generic message for invalid tokens without revealing subscription existence

**Notification Preferences UI**
- Create settings section accessible from user profile/settings page
- Display list of user's current alert subscriptions with game name, region, and status
- Provide toggle to enable/disable each subscription without deleting
- Include "Add subscription" flow to subscribe to new game+region combinations
- Show confirmation when subscription is added or removed
- Integrate with existing settings page patterns from 004-user-authentication

**Email Content Structure**
- Subject line format: "[GameName] is back online - [Region]"
- Body includes: game display name, status confirmation, timestamp of change
- Include direct link to game's status on dashboard
- Include one-click unsubscribe link prominently at bottom
- Keep email content minimal and scannable

**Error Handling and Logging**
- Log all email send attempts with subscription ID, status, and timestamp
- Log Resend API errors with response details for debugging
- Handle Resend rate limits gracefully by scheduling retry
- Continue processing remaining recipients if one email fails
- Do not expose internal errors in unsubscribe endpoint responses

## Existing Code to Leverage

**alertSubscriptions Table from 001-data-models-schema**
- Extend existing table with region field and unsubscribeToken field
- Reuse userId and gameId foreign key relationships already defined
- Leverage isActive boolean for pause/resume functionality
- Follow established indexing patterns for query performance

**Status Polling Architecture from 002-server-status-fetching**
- Hook into status update mutations to detect transition events
- Follow same exponential backoff pattern (delays and max attempts)
- Reuse publisher-independent retry pattern where one failure does not block others
- Reference serverStatusRecords table for current vs previous status comparison

**User Authentication from 004-user-authentication**
- Access user email addresses via auth.getUserIdentity() and Users table
- Reuse settings page component structure for notification preferences UI
- Follow established modal patterns if adding subscription from dashboard

**Convex Standards for Actions and Mutations**
- Use internalAction for Resend API calls and external HTTP requests
- Use internalMutation for database writes (updating lastAlertSentAt, isActive)
- Use ctx.scheduler.runAfter for retry scheduling with exponential delays
- Store Resend API key in Convex environment variables

**Global Error Handling Standards**
- Follow exponential backoff pattern from global/error-handling.md
- Implement graceful degradation when email service temporarily unavailable
- Provide user-friendly messages in unsubscribe flow without technical details

## Out of Scope

- SMS notifications
- Push notifications (browser or mobile)
- Discord webhook integrations
- Slack webhook integrations
- Status transitions other than offline-to-online (maintenance, degraded)
- Batched or digest email sending
- Duration information in emails (how long game was down)
- Historical outage information in emails
- Custom alert frequency preferences beyond 30-minute cooldown
- Email template customization by users
