# Spec Requirements: Alert Notification Service

## Initial Description
Backend service that detects when a game transitions from offline to online and sends email notifications to subscribed users.

## Requirements Discussion

### First Round Questions

**Q1:** What status transitions should trigger alerts?
**Answer:** Only offline to online transitions. Maintenance and degraded status changes should not trigger alerts.

**Q2:** Which email service provider should be used?
**Answer:** Resend

**Q3:** Should there be rate limiting to prevent alert spam?
**Answer:** Yes, 30 minute cooldown between alerts for the same user+game+region combination.

**Q4:** Should alerts be region-specific or global?
**Answer:** Region-specific only. The alertSubscriptions table needs a region field added to support this.

**Q5:** What content should be included in alert emails?
**Answer:** Game name, status, timestamp, and dashboard link. Do not include duration or history information.

**Q6:** Should alerts be sent immediately or batched?
**Answer:** Immediate sending, no batching.

**Q7:** What retry logic should be used for failed sends?
**Answer:** Exponential backoff with a maximum of 3 attempts before giving up.

**Q8:** How should users unsubscribe?
**Answer:** One-click unsubscribe link included in each email.

**Q9:** What notification channels are in scope?
**Answer:** Email only. SMS, push notifications, and Discord/Slack integrations are out of scope.

**Q10:** Should notification preferences UI be included?
**Answer:** Yes, notification preferences UI is in scope.

### Existing Code to Reference

**Dependencies Identified:**
- Feature: Data Models Schema - Spec: `001-data-models-schema` (alertSubscriptions table - requires region field addition)
- Feature: Server Status Fetching - Spec: `002-server-status-fetching` (status polling service for detecting transitions)
- Feature: User Authentication - Spec: `004-user-authentication` (user accounts with email addresses)

### Follow-up Questions

No follow-up questions were required. All requirements were provided upfront.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements
- Detect offline to online status transitions for games
- Send email notifications to users subscribed to specific game+region combinations
- Enforce 30 minute cooldown between alerts per user+game+region
- Include game name, status, timestamp, and dashboard link in emails
- Provide one-click unsubscribe functionality in each email
- Implement exponential backoff retry logic (max 3 attempts)
- Send alerts immediately upon transition detection
- Provide UI for managing notification preferences

### Technical Stack
- TypeScript
- Node.js
- Convex (database and serverless functions)
- Resend (email service provider)

### Reusability Opportunities
- alertSubscriptions table from 001-data-models-schema (needs region field addition)
- Status polling logic from 002-server-status-fetching
- User authentication and email retrieval from 004-user-authentication

### Scope Boundaries
**In Scope:**
- Email notifications for offline to online transitions
- Region-specific alert subscriptions
- Rate limiting (30 min cooldown per user+game+region)
- Exponential backoff retry logic (3 attempts max)
- One-click unsubscribe links
- Notification preferences UI

**Out of Scope:**
- SMS notifications
- Push notifications
- Discord integrations
- Slack integrations
- Other status transition types (maintenance, degraded)
- Batched sending
- Duration or history information in emails

### Technical Considerations
- Schema modification required: Add region field to alertSubscriptions table
- Integration with status polling service to detect transitions
- Integration with user authentication for email addresses
- Rate limiting state must be tracked per user+game+region combination
- Retry state must be persisted for exponential backoff
- Unsubscribe tokens must be generated and validated securely
