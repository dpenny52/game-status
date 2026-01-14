# Specification: Auto-Refresh and Real-Time Updates

## Goal

Enable automatic dashboard updates and real-time status synchronization using Convex's built-in subscription system, eliminating the need for manual refresh while providing visual feedback for status changes, connection health, and data freshness.

## User Stories

- As a gamer monitoring server status, I want the dashboard to update automatically when server status changes so that I always see current information without refreshing the page
- As a user with an unstable connection, I want to see a connection health indicator so that I know whether the displayed data is being updated in real-time

## Specific Requirements

**Convex Reactivity Integration**
- Utilize Convex's useQuery hook which automatically subscribes to database changes
- Ensure dashboard queries are structured to trigger re-renders when serverStatusRecords table updates
- No additional client-side polling or WebSocket setup required; leverage Convex's built-in real-time sync
- Verify existing dashboard queries from spec 003 are compatible with reactive updates

**Status Change Animation**
- Implement a brief color pulse animation when a game card's status value changes
- Animation should draw attention without being distracting (subtle glow or border flash)
- Duration should be approximately 500-800ms for visibility without interruption
- Track previous status value in component state to detect changes between renders
- Apply animation only to the specific game card(s) whose status changed, not entire dashboard

**Relative Time Display Component**
- Create a reusable RelativeTime component that displays human-readable timestamps
- Format recent times as relative strings: "just now", "1 minute ago", "5 minutes ago"
- Update displayed time automatically using a client-side interval (every 30-60 seconds)
- Switch to absolute format for timestamps older than 24 hours (e.g., "Jan 14, 2:30 PM")
- Accept timestamp prop and handle null/undefined gracefully with fallback text

**Connection Health Indicator**
- Display a small indicator showing Convex connection status (connected/disconnected/reconnecting)
- Position indicator in a consistent, non-intrusive location (header or footer area)
- Use Convex's built-in connection state APIs or ConvexReactClient status
- Show green dot/icon when connected, yellow when reconnecting, red when disconnected
- Include accessible text label or tooltip describing connection state

**Stale Data Indicator**
- Compare current time against lastCheckedAt timestamp from serverStatusRecords
- Display visual warning when any game's data exceeds 10-minute staleness threshold
- Apply subtle visual treatment to stale game cards (e.g., muted colors, warning badge)
- Show timestamp of last successful update to inform users of data age
- Clear stale indicator automatically when fresh data arrives via subscription

**No Manual Refresh Button**
- Explicitly omit manual refresh functionality from the UI
- Rely entirely on Convex's automatic real-time subscriptions for data freshness
- Remove any existing refresh button code if present in spec 003 implementation

## Existing Code to Leverage

**Convex useQuery from 003-status-dashboard-ui**
- Dashboard already uses useQuery hook for fetching games and status data
- Extend existing query integration to ensure reactive behavior is preserved
- Query structure fetching from games and serverStatusRecords tables is already defined
- Reactive updates should work automatically once Convex mutations update records

**GameCard Component from 003-status-dashboard-ui**
- Add status change animation as CSS class applied conditionally on status change
- Integrate stale data styling as additional conditional class or wrapper
- Preserve existing status indicator, timestamp, and regional display functionality
- Component already receives lastCheckedAt and status props for comparison logic

**Timestamp Formatting from 003-status-dashboard-ui**
- Spec 003 already defines relative time formatting requirements ("2 minutes ago" style)
- Extract and enhance into standalone RelativeTime component with auto-ticking
- Reuse formatting logic for consistency across last checked and status changed displays

**Backend Polling Cadence from 002-server-status-fetching**
- Backend polls at 1-minute intervals; frontend reflects this cadence naturally
- Stale threshold of 10 minutes accounts for potential missed polling cycles
- lastCheckedAt field updated on every poll provides freshness baseline

**Schema Fields from 001-data-models-schema**
- serverStatusRecords.lastCheckedAt: timestamp for stale data calculation
- serverStatusRecords.status: enum value for change detection animation
- Convex reactive queries automatically detect changes to these fields

## Out of Scope

- Push notifications or browser notifications for status changes
- Sound alerts or audio feedback when status changes
- Manual refresh button or pull-to-refresh gesture
- Additional client-side polling beyond Convex subscriptions
- Custom WebSocket implementation (using Convex's built-in transport)
- Offline caching or service worker integration
- User preferences for animation enable/disable
- Configurable stale data threshold (hardcoded to 10 minutes)
- Historical status change log or timeline in the UI
- Toast notifications or popup alerts for status changes
