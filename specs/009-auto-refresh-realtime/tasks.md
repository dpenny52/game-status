# Task Breakdown: Auto-Refresh and Real-Time Updates

## Overview
Total Tasks: 5 Task Groups

This spec implements automatic dashboard updates using Convex's built-in subscription system with visual feedback for status changes, connection health, and data freshness. The approach builds reusable components first, then integrates them into the existing dashboard from spec 003.

## Task List

### Reusable Components

#### Task Group 1: RelativeTime Component
**Dependencies:** None

- [ ] 1.0 Complete RelativeTime component
  - [ ] 1.1 Write 2-6 focused tests for RelativeTime functionality
    - Test "just now" display for timestamps under 1 minute old
    - Test relative format ("1 minute ago", "5 minutes ago") for recent timestamps
    - Test absolute format for timestamps older than 24 hours
    - Test graceful handling of null/undefined timestamps
    - Test auto-update behavior via interval (mock timers)
  - [ ] 1.2 Create RelativeTime component with timestamp formatting
    - Accept timestamp prop (number or null/undefined)
    - Format "just now" for < 1 minute
    - Format "X minutes ago" for 1-59 minutes
    - Format "X hours ago" for 1-23 hours
    - Format absolute date ("Jan 14, 2:30 PM") for > 24 hours
    - Return fallback text for null/undefined values
  - [ ] 1.3 Implement client-side auto-update interval
    - Set up useEffect with setInterval (30-60 seconds)
    - Force re-render to update displayed time
    - Clean up interval on component unmount
    - Avoid memory leaks with proper cleanup
  - [ ] 1.4 Ensure RelativeTime tests pass
    - Run ONLY the 2-6 tests written in 1.1
    - Verify all time formatting cases work correctly

**Acceptance Criteria:**
- The 2-6 tests written in 1.1 pass
- Component displays human-readable relative timestamps
- Auto-updates every 30-60 seconds without page refresh
- Handles null/undefined gracefully with fallback text
- Switches to absolute format for timestamps > 24 hours old

---

#### Task Group 2: ConnectionHealthIndicator Component
**Dependencies:** None (can be built in parallel with Task Group 1)

- [ ] 2.0 Complete ConnectionHealthIndicator component
  - [ ] 2.1 Write 2-5 focused tests for ConnectionHealthIndicator
    - Test green dot/connected state display
    - Test yellow dot/reconnecting state display
    - Test red dot/disconnected state display
    - Test accessible label/tooltip presence
  - [ ] 2.2 Create ConnectionHealthIndicator component
    - Use Convex connection state APIs (ConvexReactClient status)
    - Display small visual indicator (dot or icon)
    - Green = connected, Yellow = reconnecting, Red = disconnected
    - Position for header or footer placement (flexible via props)
  - [ ] 2.3 Add accessible text label or tooltip
    - Include screen reader accessible description
    - Tooltip showing connection state on hover
    - ARIA attributes for accessibility compliance
  - [ ] 2.4 Style the indicator
    - Small, non-intrusive visual size
    - Smooth color transitions between states
    - Consistent with existing dashboard design system
  - [ ] 2.5 Ensure ConnectionHealthIndicator tests pass
    - Run ONLY the 2-5 tests written in 2.1
    - Verify all connection states display correctly

**Acceptance Criteria:**
- The 2-5 tests written in 2.1 pass
- Component accurately reflects Convex connection status
- Visual states clearly distinguish connected/reconnecting/disconnected
- Accessible to screen readers with proper labels

---

#### Task Group 3: Status Change Animation and Stale Data Styles
**Dependencies:** None (can be built in parallel with Task Groups 1-2)

- [ ] 3.0 Complete status change animation and stale data styles
  - [ ] 3.1 Write 2-6 focused tests for animation and stale logic
    - Test animation class applied when status changes
    - Test animation not applied on initial render (no previous status)
    - Test animation removed after duration completes
    - Test stale data class applied when lastCheckedAt > 10 minutes old
    - Test stale indicator cleared when fresh data arrives
  - [ ] 3.2 Create useStatusChangeAnimation custom hook
    - Track previous status value in component state (useRef or useState)
    - Detect when status changes between renders
    - Return boolean indicating animation should be active
    - Auto-clear animation state after 500-800ms timeout
  - [ ] 3.3 Implement CSS animation styles
    - Define pulse/glow keyframe animation
    - Duration: 500-800ms
    - Subtle effect (border flash or background glow)
    - Animation class that can be conditionally applied
  - [ ] 3.4 Create useStaleData custom hook
    - Compare current time against lastCheckedAt timestamp
    - Return boolean for stale state (> 10 minutes threshold)
    - Update on interval to detect staleness over time
    - Handle null/undefined lastCheckedAt gracefully
  - [ ] 3.5 Implement stale data visual styles
    - Muted colors or opacity reduction for stale cards
    - Warning badge or icon option
    - CSS class that can be conditionally applied
  - [ ] 3.6 Ensure animation and stale data tests pass
    - Run ONLY the 2-6 tests written in 3.1
    - Verify animation triggers correctly on status change
    - Verify stale detection works with threshold

**Acceptance Criteria:**
- The 2-6 tests written in 3.1 pass
- Status change animation applies only to changed cards
- Animation is subtle but noticeable (500-800ms duration)
- Stale data indicator appears when data exceeds 10-minute threshold
- Both effects clear appropriately (animation after duration, stale when fresh data arrives)

---

### Dashboard Integration

#### Task Group 4: GameCard Integration
**Dependencies:** Task Groups 1, 2, 3

- [ ] 4.0 Complete GameCard integration with real-time features
  - [ ] 4.1 Write 2-6 focused tests for integrated GameCard behavior
    - Test GameCard displays RelativeTime for lastCheckedAt
    - Test GameCard applies animation class on status change
    - Test GameCard applies stale styling when data is old
    - Test GameCard updates when Convex subscription triggers re-render
  - [ ] 4.2 Integrate RelativeTime component into GameCard
    - Replace existing timestamp display with RelativeTime component
    - Pass lastCheckedAt as timestamp prop
    - Ensure consistent placement in card layout
  - [ ] 4.3 Integrate useStatusChangeAnimation into GameCard
    - Apply animation hook with status prop
    - Conditionally add animation CSS class to card element
    - Ensure animation applies only to individual card, not siblings
  - [ ] 4.4 Integrate useStaleData into GameCard
    - Apply stale hook with lastCheckedAt prop
    - Conditionally add stale styling CSS class
    - Display last update timestamp for user awareness
  - [ ] 4.5 Verify Convex useQuery reactivity preserved
    - Confirm existing dashboard queries trigger re-renders on data changes
    - No additional polling or WebSocket setup needed
    - Test that serverStatusRecords updates propagate to UI
  - [ ] 4.6 Remove any manual refresh functionality
    - Remove refresh button if present from spec 003 implementation
    - Ensure no manual refresh UI exists
    - Rely entirely on Convex subscriptions
  - [ ] 4.7 Ensure GameCard integration tests pass
    - Run ONLY the 2-6 tests written in 4.1
    - Verify all real-time features work together

**Acceptance Criteria:**
- The 2-6 tests written in 4.1 pass
- GameCard displays auto-updating relative timestamps
- Status changes trigger subtle animation on affected card only
- Stale data is visually indicated on cards exceeding 10-minute threshold
- Dashboard updates automatically via Convex subscriptions
- No manual refresh button exists in UI

---

#### Task Group 5: Dashboard Layout Integration
**Dependencies:** Task Group 2, Task Group 4

- [ ] 5.0 Complete dashboard layout integration
  - [ ] 5.1 Write 2-4 focused tests for dashboard-level integration
    - Test ConnectionHealthIndicator present in header or footer
    - Test multiple GameCards each respond independently to status changes
    - Test dashboard-wide real-time updates via Convex subscription
  - [ ] 5.2 Add ConnectionHealthIndicator to dashboard layout
    - Position in header or footer area (consistent, non-intrusive)
    - Ensure visibility without blocking content
    - Style to match overall dashboard design
  - [ ] 5.3 Verify end-to-end real-time behavior
    - Confirm Convex subscription updates propagate to all game cards
    - Test that status changes in database trigger UI animations
    - Verify stale indicators appear/clear based on data freshness
    - Test connection indicator responds to Convex connection state
  - [ ] 5.4 Ensure dashboard integration tests pass
    - Run ONLY the 2-4 tests written in 5.1
    - Verify all components work together cohesively

**Acceptance Criteria:**
- The 2-4 tests written in 5.1 pass
- Connection health indicator visible in dashboard layout
- All game cards update independently based on their data
- Real-time updates flow from Convex to UI without manual intervention
- User experience is seamless with no page refresh required

---

### Quality Assurance

#### Task Group 6: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-5

- [ ] 6.0 Review existing tests and fill critical gaps only
  - [ ] 6.1 Review tests from Task Groups 1-5
    - Review the 2-6 tests from RelativeTime (Task 1.1)
    - Review the 2-5 tests from ConnectionHealthIndicator (Task 2.1)
    - Review the 2-6 tests from Animation/Stale logic (Task 3.1)
    - Review the 2-6 tests from GameCard integration (Task 4.1)
    - Review the 2-4 tests from Dashboard integration (Task 5.1)
    - Total existing tests: approximately 10-27 tests
  - [ ] 6.2 Analyze test coverage gaps for THIS feature only
    - Identify critical user workflows lacking coverage
    - Focus ONLY on gaps related to real-time update requirements
    - Prioritize end-to-end workflows over unit test gaps
    - Do NOT assess entire application test coverage
  - [ ] 6.3 Write up to 8 additional strategic tests maximum
    - Add tests to fill identified critical gaps only
    - Focus on integration points between components
    - Test edge cases: rapid status changes, connection drops during update
    - Test accessibility: screen reader announcements for status changes
    - Do NOT write comprehensive coverage for all scenarios
  - [ ] 6.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's features
    - Expected total: approximately 18-35 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical real-time workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 18-35 tests total)
- Critical user workflows for real-time updates are covered
- No more than 8 additional tests added when filling gaps
- Testing focused exclusively on this spec's feature requirements

---

## Execution Order

Recommended implementation sequence:

```
Phase 1: Build Reusable Components (Parallel)
  |
  |-- Task Group 1: RelativeTime Component
  |-- Task Group 2: ConnectionHealthIndicator Component
  |-- Task Group 3: Status Change Animation & Stale Data Styles
  |
  v
Phase 2: Dashboard Integration (Sequential)
  |
  |-- Task Group 4: GameCard Integration
  |       (depends on Groups 1, 2, 3)
  |
  v
  |-- Task Group 5: Dashboard Layout Integration
  |       (depends on Groups 2, 4)
  |
  v
Phase 3: Quality Assurance
  |
  |-- Task Group 6: Test Review & Gap Analysis
          (depends on Groups 1-5)
```

**Notes:**
- Task Groups 1, 2, and 3 can be developed in parallel by different engineers
- Task Group 4 requires all component groups (1-3) to be complete
- Task Group 5 can begin once Task Group 2 and 4 are complete
- Task Group 6 should be executed last to review all implemented features

## Technical Notes

**Convex Integration:**
- Leverage existing useQuery hooks from spec 003
- No additional polling or WebSocket setup required
- Connection state available via ConvexReactClient status

**Dependencies on Previous Specs:**
- 001-data-models-schema: serverStatusRecords.lastCheckedAt, status fields
- 002-server-status-fetching: 1-minute polling cadence (backend)
- 003-status-dashboard-ui: GameCard component, existing useQuery patterns

**Key Files to Modify/Create:**
- New: `src/components/RelativeTime.tsx`
- New: `src/components/ConnectionHealthIndicator.tsx`
- New: `src/hooks/useStatusChangeAnimation.ts`
- New: `src/hooks/useStaleData.ts`
- New: `src/styles/animations.css` (or add to existing styles)
- Modify: `src/components/GameCard.tsx` (from spec 003)
- Modify: `src/pages/Dashboard.tsx` (from spec 003)
