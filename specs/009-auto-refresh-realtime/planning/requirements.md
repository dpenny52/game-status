# Spec Requirements: Auto-Refresh and Real-Time Updates

## Initial Description

Implement automatic dashboard refresh and real-time status updates using Convex subscriptions so users see changes without manual refresh. This is roadmap item #8 for the GameStatus server monitoring dashboard.

## Requirements Discussion

### First Round Questions

**Q1:** What is the core real-time mechanism?
**Answer:** Leverage Convex's built-in useQuery reactivity. No additional client-side polling needed.

**Q2:** Should there be visual feedback when status changes?
**Answer:** Yes, a brief color pulse animation when a game's status changes.

**Q3:** Should we display a "last updated" timestamp?
**Answer:** Yes, an auto-updating relative time display ("2 minutes ago") that ticks in real-time.

**Q4:** Should there be a manual refresh button?
**Answer:** No refresh button needed. Rely entirely on Convex's real-time subscriptions.

**Q5:** Should we show connection status?
**Answer:** Yes, show an indicator when connection to Convex is healthy.

**Q6:** Should we visually indicate stale data?
**Answer:** Yes, visually indicate when data is stale with a 10+ minute threshold.

**Q7:** What features should be excluded?
**Answer:** No push notifications, no sound alerts.

### Existing Code to Reference

**Similar Features Identified:**
- Spec: 002-server-status-fetching - Path: Backend polling service (1-minute intervals)
- Spec: 003-status-dashboard-ui - Path: Dashboard with game cards (UI components)
- Spec: 001-data-models-schema - Path: serverStatusRecords table (data model)

### Follow-up Questions

No follow-up questions needed. Requirements were provided comprehensively.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - No visuals to analyze.

## Requirements Summary

### Functional Requirements

- Leverage Convex's built-in useQuery reactivity for real-time status updates
- Display brief color pulse animation when a game's server status changes
- Show auto-updating relative timestamps ("2 minutes ago") that tick in real-time
- Display connection health indicator showing Convex connection status
- Visually indicate stale data when last update exceeds 10 minutes
- No manual refresh button (rely on automatic real-time updates)

### Reusability Opportunities

- Game card components from 003-status-dashboard-ui spec
- serverStatusRecords table schema from 001-data-models-schema spec
- Backend polling patterns from 002-server-status-fetching spec
- Convex useQuery patterns likely already established in dashboard

### Scope Boundaries

**In Scope:**
- Convex useQuery reactivity integration for real-time updates
- Status change animation (color pulse effect)
- Auto-updating relative time display component
- Connection health indicator component
- Stale data visual indicator (10+ minute threshold)

**Out of Scope:**
- Push notifications
- Sound alerts
- Manual refresh button
- Additional client-side polling mechanisms
- WebSocket implementation (using Convex's built-in subscriptions instead)

### Technical Considerations

- Integration with existing Convex setup and useQuery hooks
- Must work with serverStatusRecords table structure from spec 001
- Should integrate seamlessly with existing game card components from spec 003
- Backend already polls at 1-minute intervals per spec 002; frontend reflects this cadence
- Relative time display requires client-side timer for real-time ticking
- Connection status may use Convex's built-in connection state APIs
- Stale data detection compares current time against last update timestamp
