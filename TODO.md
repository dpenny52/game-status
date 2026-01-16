# Future Improvements

## Critical Feature: Real-Time Push Notifications

### Problem
Currently, users must manually refresh or keep the page open to see status changes. There's no way to notify users when a game's status changes if they're not actively viewing the dashboard.

### Proposed Solution
Implement browser push notifications for subscribed games:

1. **Service Worker Registration**: Register a service worker for handling background push events
2. **Push Subscription**: Allow users to enable browser push notifications from Settings page
3. **Backend Integration**: Connect Convex real-time subscriptions to a push notification service (e.g., Web Push API)
4. **Notification Preferences**: Let users configure:
   - Which status changes trigger notifications (outage only, degraded, all)
   - Quiet hours (no notifications during sleep)
   - Per-game notification settings

### Why Critical
- Email alerts have delay (polling-based)
- Users miss critical outages when not on the page
- Push notifications are instant and work even when browser is closed
- Improves user engagement and app value proposition

### Implementation Estimate
- Service Worker setup: 1 task
- Push subscription UI in Settings: 1 task
- Backend notification service: 2-3 tasks
- Preference management: 1 task

### Dependencies
- Requires HTTPS in production
- May need a push notification service (Firebase Cloud Messaging, or self-hosted)
- User authentication already complete (Phase 1)
