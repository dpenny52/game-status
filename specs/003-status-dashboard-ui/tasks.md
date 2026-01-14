# Task Breakdown: Status Dashboard UI

## Overview
Total Tasks: 34

This task breakdown covers the implementation of the main React dashboard that displays all supported games with their current server status, including visual status indicators, regional breakdowns, and timestamp formatting organized by platform/publisher.

## Task List

### Data Layer

#### Task Group 1: Convex Query Functions
**Dependencies:** Spec 001-data-models-schema (assumed complete)

- [ ] 1.0 Complete Convex query layer for dashboard data
  - [ ] 1.1 Write 2-4 focused tests for query functions
    - Test query returns active games with status records
    - Test query filters out inactive games (isActive: false)
    - Test query sorts by platform then sortOrder
    - Test query joins serverStatusRecords correctly
  - [ ] 1.2 Create getAllGamesWithStatus query function
    - Location: convex/queries.ts
    - Join games table with serverStatusRecords by gameId
    - Filter to only isActive games
    - Sort by platform first, then sortOrder within platform
    - Return combined game and status data
  - [ ] 1.3 Create getGamesByPlatform query function
    - Accept platform parameter for filtered queries
    - Use db.query().withIndex() for efficient platform lookup
    - Return games with status for single platform group
  - [ ] 1.4 Ensure query tests pass
    - Run ONLY the 2-4 tests written in 1.1
    - Verify queries return expected data structure
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 1.1 pass
- Query returns all active games with their current status
- Data is properly sorted by platform and sortOrder
- Query efficiently joins games and serverStatusRecords tables

---

### Core UI Components

#### Task Group 2: Status Indicator Component
**Dependencies:** None (can start in parallel with Task Group 1)

- [ ] 2.0 Complete Status Indicator component
  - [ ] 2.1 Write 2-4 focused tests for StatusIndicator component
    - Test renders correct color and icon for each status type (online, offline, degraded, maintenance, unknown)
    - Test includes accessible text label alongside icon
    - Test applies correct CSS classes for color coding
  - [ ] 2.2 Create StatusIndicator component
    - Location: src/components/StatusIndicator/StatusIndicator.tsx
    - Accept status prop with enum values: online, offline, degraded, maintenance, unknown
    - Render appropriate icon for each status state
    - Apply color-coded visual treatment per status
  - [ ] 2.3 Implement status visual states
    - Online: Green color with checkmark/filled circle icon
    - Offline: Red color with X/empty circle icon
    - Degraded: Yellow/amber color with warning triangle icon
    - Maintenance: Blue color with wrench/clock icon
    - Unknown: Gray color with question mark icon
  - [ ] 2.4 Add accessibility support
    - Include text label alongside icon (not color alone)
    - Add appropriate ARIA attributes
    - Ensure sufficient color contrast ratios
  - [ ] 2.5 Create component styles
    - Location: src/components/StatusIndicator/StatusIndicator.css
    - Use design tokens for status colors
    - Follow frontend/css.md methodology
  - [ ] 2.6 Ensure StatusIndicator tests pass
    - Run ONLY the 2-4 tests written in 2.1
    - Verify all five status states render correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 2.1 pass
- All five status states display with correct colors and icons
- Text labels present for accessibility
- Component is reusable across different contexts

---

#### Task Group 3: Timestamp Formatting Utilities
**Dependencies:** None (can start in parallel with Task Groups 1-2)

- [ ] 3.0 Complete timestamp formatting utilities
  - [ ] 3.1 Write 2-4 focused tests for timestamp formatting
    - Test relative time for recent updates ("2 minutes ago", "just now")
    - Test absolute time for updates older than 24 hours
    - Test timezone context display for absolute timestamps
  - [ ] 3.2 Create timestamp formatting utility functions
    - Location: src/utils/timeFormat.ts
    - formatRelativeTime(): Convert timestamp to relative format
    - formatAbsoluteTime(): Convert to absolute with timezone
    - shouldUseRelative(): Determine which format to use (threshold: 24 hours)
  - [ ] 3.3 Create useRelativeTime hook
    - Location: src/hooks/useRelativeTime.ts
    - Accept timestamp parameter
    - Update relative timestamps periodically without full page refresh
    - Handle cleanup on unmount
  - [ ] 3.4 Ensure timestamp formatting tests pass
    - Run ONLY the 2-4 tests written in 3.1
    - Verify relative and absolute formatting works correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 3.1 pass
- Relative time displays for recent updates
- Absolute time displays for updates older than 24 hours
- Timestamps update periodically without page refresh

---

#### Task Group 4: Regional Status Display Component
**Dependencies:** Task Group 2 (StatusIndicator)

- [ ] 4.0 Complete Regional Status Display component
  - [ ] 4.1 Write 2-4 focused tests for RegionalStatus component
    - Test renders regional breakdown with status per region
    - Test default collapsed state and expand on interaction
    - Test "Global" label for games without regional separation
  - [ ] 4.2 Create RegionalStatus component
    - Location: src/components/RegionalStatus/RegionalStatus.tsx
    - Accept regions prop with array of region status data
    - Display region codes: NA, EU, ASIA, OCE
    - Use StatusIndicator for each region's status
  - [ ] 4.3 Implement expand/collapse functionality
    - Default to collapsed state to reduce visual clutter
    - Expand on user click/keyboard interaction
    - Animate expand/collapse transition
  - [ ] 4.4 Add "Global" label support
    - Display "Global" for games without regional separation
    - Handle single-region vs multi-region display logic
  - [ ] 4.5 Implement user region highlighting
    - Detect user's likely region from browser locale
    - Visually highlight user's region when expanded
  - [ ] 4.6 Create component styles
    - Location: src/components/RegionalStatus/RegionalStatus.css
    - Style collapsed and expanded states
    - Add transition animations
  - [ ] 4.7 Ensure RegionalStatus tests pass
    - Run ONLY the 2-4 tests written in 4.1
    - Verify expand/collapse and region display works
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 4.1 pass
- Regional breakdown displays with individual status indicators
- Expand/collapse interaction works correctly
- User's region is highlighted when detectable

---

#### Task Group 5: Game Card Component
**Dependencies:** Task Groups 2, 3, 4 (StatusIndicator, Timestamp Utils, RegionalStatus)

- [ ] 5.0 Complete Game Card component
  - [ ] 5.1 Write 2-4 focused tests for GameCard component
    - Test renders game icon, name, and platform badge
    - Test displays "Last checked: X minutes ago" with relative time
    - Test shows "Down since" when status is offline/maintenance
  - [ ] 5.2 Create GameCard component
    - Location: src/components/GameCard/GameCard.tsx
    - Accept game data prop with iconUrl, displayName, platform, status info
    - Display game icon from iconUrl
    - Show display name and platform badge
  - [ ] 5.3 Implement primary status display
    - Show StatusIndicator prominently on card
    - Display status message from provider when available
    - Color-code card border/accent based on status
  - [ ] 5.4 Implement timestamp displays
    - Show "Last checked: X minutes ago" using lastCheckedAt
    - Show "Down since: X hours ago" when offline/maintenance using statusChangedAt
    - Use useRelativeTime hook for live updates
  - [ ] 5.5 Add stale data indicator
    - Visually indicate when lastCheckedAt is older than 5 minutes
    - Add subtle warning styling for stale data
  - [ ] 5.6 Integrate RegionalStatus component
    - Include expandable regional breakdown
    - Pass region status data to RegionalStatus component
  - [ ] 5.7 Create component styles
    - Location: src/components/GameCard/GameCard.css
    - Maintain consistent card dimensions across all games
    - Follow design system spacing and typography
  - [ ] 5.8 Ensure GameCard tests pass
    - Run ONLY the 2-4 tests written in 5.1
    - Verify card displays all required information
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 5.1 pass
- Card displays game icon, name, platform, and status
- Timestamps display correctly with relative/absolute formatting
- Regional status expands/collapses properly

---

#### Task Group 6: Platform Section Component
**Dependencies:** Task Group 5 (GameCard)

- [ ] 6.0 Complete Platform Section component
  - [ ] 6.1 Write 2-4 focused tests for PlatformSection component
    - Test renders platform header with logo/icon and name
    - Test displays aggregate status summary in header
    - Test expand/collapse functionality
  - [ ] 6.2 Create PlatformSection component
    - Location: src/components/PlatformSection/PlatformSection.tsx
    - Accept platform name and games array props
    - Display platform logo/icon in section header
    - Support platforms: Blizzard, Riot, Steam, Epic, Mojang, Square Enix
  - [ ] 6.3 Implement aggregate status summary
    - Calculate and display summary (e.g., "3/4 online")
    - Show summary in collapsed header view
    - Update summary based on game status data
  - [ ] 6.4 Implement expand/collapse functionality
    - Allow users to expand/collapse individual sections
    - Maintain expand state per section
    - Animate section expansion/collapse
  - [ ] 6.5 Render GameCard grid within section
    - Display GameCard components for each game in platform
    - Respect sortOrder field from games table
    - Apply responsive grid layout within section
  - [ ] 6.6 Create component styles
    - Location: src/components/PlatformSection/PlatformSection.css
    - Style section headers with platform branding
    - Style collapsed and expanded states
  - [ ] 6.7 Ensure PlatformSection tests pass
    - Run ONLY the 2-4 tests written in 6.1
    - Verify platform grouping and summary display
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 6.1 pass
- Platform sections display with proper headers and logos
- Aggregate status summary shows correctly
- Expand/collapse works for each platform section

---

### Dashboard Page

#### Task Group 7: Loading and Empty States
**Dependencies:** Task Groups 5, 6 (GameCard, PlatformSection)

- [ ] 7.0 Complete loading and empty state components
  - [ ] 7.1 Write 2-4 focused tests for loading/empty states
    - Test skeleton loading cards display during data fetch
    - Test empty state message when no games configured
    - Test error state with retry option
  - [ ] 7.2 Create SkeletonCard component
    - Location: src/components/SkeletonCard/SkeletonCard.tsx
    - Match GameCard dimensions for visual consistency
    - Add shimmer/pulse animation for loading indication
  - [ ] 7.3 Create EmptyState component
    - Location: src/components/EmptyState/EmptyState.tsx
    - Display appropriate messaging for no games configured
    - Include helpful context or next steps
  - [ ] 7.4 Create ErrorState component
    - Location: src/components/ErrorState/ErrorState.tsx
    - Display user-friendly error message
    - Include retry button/action
    - Handle graceful error recovery
  - [ ] 7.5 Create component styles
    - Location: src/components/SkeletonCard/SkeletonCard.css
    - Location: src/components/EmptyState/EmptyState.css
    - Location: src/components/ErrorState/ErrorState.css
  - [ ] 7.6 Ensure loading/empty state tests pass
    - Run ONLY the 2-4 tests written in 7.1
    - Verify all states render correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 7.1 pass
- Skeleton cards display during loading
- Empty state displays when no games exist
- Error state displays with retry option

---

#### Task Group 8: Dashboard Page Assembly
**Dependencies:** Task Groups 1, 6, 7 (Queries, PlatformSection, Loading States)

- [ ] 8.0 Complete Dashboard page
  - [ ] 8.1 Write 2-4 focused tests for Dashboard page
    - Test page renders header with brand name and tagline
    - Test page displays platform sections with game cards
    - Test page shows footer with last refresh timestamp
  - [ ] 8.2 Create Dashboard page component
    - Location: src/pages/Dashboard/Dashboard.tsx
    - Set up as main entry point of the application
    - Use useQuery hook from "convex/react" for data fetching
  - [ ] 8.3 Implement header section
    - Display "GameStatus" brand name
    - Include tagline describing the service
    - Style header appropriately
  - [ ] 8.4 Implement main content area
    - Organize PlatformSection components for each platform
    - Apply responsive grid layout that adapts to viewport
    - Handle loading, empty, and error states
  - [ ] 8.5 Implement footer section
    - Display last global refresh timestamp
    - Include data attribution information
    - Style footer appropriately
  - [ ] 8.6 Connect to Convex queries
    - Use getAllGamesWithStatus query
    - Group games by platform for PlatformSection rendering
    - Handle query loading and error states
  - [ ] 8.7 Create page styles
    - Location: src/pages/Dashboard/Dashboard.css
    - Responsive grid layout for game cards
    - Consistent spacing and typography
  - [ ] 8.8 Ensure Dashboard page tests pass
    - Run ONLY the 2-4 tests written in 8.1
    - Verify page renders with all sections
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-4 tests written in 8.1 pass
- Dashboard displays header, game sections, and footer
- Platform sections group games correctly
- Loading, empty, and error states handled properly

---

### Testing and Integration

#### Task Group 9: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-8

- [ ] 9.0 Review existing tests and fill critical gaps only
  - [ ] 9.1 Review tests from Task Groups 1-8
    - Review the 2-4 tests written for queries (Task 1.1)
    - Review the 2-4 tests written for StatusIndicator (Task 2.1)
    - Review the 2-4 tests written for timestamp utils (Task 3.1)
    - Review the 2-4 tests written for RegionalStatus (Task 4.1)
    - Review the 2-4 tests written for GameCard (Task 5.1)
    - Review the 2-4 tests written for PlatformSection (Task 6.1)
    - Review the 2-4 tests written for loading/empty states (Task 7.1)
    - Review the 2-4 tests written for Dashboard page (Task 8.1)
    - Total existing tests: approximately 16-32 tests
  - [ ] 9.2 Analyze test coverage gaps for dashboard feature only
    - Identify critical user workflows lacking test coverage
    - Focus ONLY on gaps related to this spec's requirements
    - Do NOT assess entire application test coverage
    - Prioritize end-to-end workflows over unit test gaps
  - [ ] 9.3 Write up to 10 additional strategic tests maximum
    - Focus on integration between components
    - Test complete user flow: page load to viewing game status
    - Test expand/collapse interactions across multiple sections
    - Test timestamp updates without page refresh
    - Test stale data indication workflow
    - Do NOT write exhaustive coverage for all scenarios
  - [ ] 9.4 Run feature-specific tests only
    - Run ONLY tests related to Status Dashboard UI feature
    - Expected total: approximately 26-42 tests maximum
    - Do NOT run the entire application test suite
    - Verify critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 26-42 tests total)
- Critical user workflows for dashboard are covered
- No more than 10 additional tests added for gap coverage
- Testing focused exclusively on this spec's requirements

---

## Execution Order

Recommended implementation sequence:

**Phase 1 - Foundation (Parallel)**
1. Task Group 1: Convex Query Functions
2. Task Group 2: Status Indicator Component
3. Task Group 3: Timestamp Formatting Utilities

**Phase 2 - Core Components (Sequential)**
4. Task Group 4: Regional Status Display (depends on Task Group 2)
5. Task Group 5: Game Card Component (depends on Task Groups 2, 3, 4)
6. Task Group 6: Platform Section Component (depends on Task Group 5)

**Phase 3 - Page Assembly (Sequential)**
7. Task Group 7: Loading and Empty States (depends on Task Groups 5, 6)
8. Task Group 8: Dashboard Page Assembly (depends on Task Groups 1, 6, 7)

**Phase 4 - Validation**
9. Task Group 9: Test Review and Gap Analysis (depends on Task Groups 1-8)

---

## Notes

- This spec prepares for but does not implement real-time auto-refresh (spec 008)
- Mobile-specific responsive design is out of scope (spec 010)
- User authentication and favorites are handled in separate specs (004, 005)
- The useQuery hook sets up the foundation for future real-time subscriptions
