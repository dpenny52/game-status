# Task Breakdown: Favorites System

## Overview
Total Tasks: 4 Task Groups (approximately 28 sub-tasks)

## Dependencies Map
- **Spec 001-data-models-schema**: Favorites table schema with userId, gameId, createdAt fields and compound index
- **Spec 003-status-dashboard-ui**: GameCard component and dashboard query patterns
- **Spec 004-user-authentication**: Auth context, getUserIdentity(), useConvexAuth hook

## Task List

### Backend Layer

#### Task Group 1: Convex Mutations and Queries
**Dependencies:** 001-data-models-schema (Favorites table must exist)

- [ ] 1.0 Complete Convex backend for favorites functionality
  - [ ] 1.1 Write 2-6 focused tests for Convex functions
    - Test toggleFavorite mutation creates favorite record for authenticated user
    - Test toggleFavorite mutation removes existing favorite record (toggle off)
    - Test getUserFavorites query returns correct gameIds for user
    - Test getUserFavorites returns empty array for unauthenticated users
    - Test toggleFavorite returns correct boolean state after operation
  - [ ] 1.2 Create toggleFavorite mutation
    - File: `convex/favorites.ts`
    - Accept gameId as argument (v.id("games"))
    - Use `ctx.auth.getUserIdentity()` to get current user
    - Return 401-equivalent error if not authenticated
    - Query existing favorite using compound index on (userId, gameId)
    - If exists: delete record and return `false`
    - If not exists: insert new record with userId, gameId, createdAt and return `true`
    - Implement as atomic operation
  - [ ] 1.3 Create getUserFavorites query
    - File: `convex/favorites.ts`
    - Use `ctx.auth.getUserIdentity()` to get current user
    - Return empty array `[]` if not authenticated (no error)
    - Query favorites table filtered by userId using index
    - Return array of gameId values
    - Support real-time subscription via useQuery
  - [ ] 1.4 Modify dashboard games query for favorites-first sorting
    - Extend existing dashboard query to accept optional userId parameter
    - Fetch user's favorites when userId is provided
    - Create Set of favorited gameIds for O(1) lookup
    - Sort results: favorites first (alphabetically by displayName), then non-favorites (existing sortOrder)
    - Return combined single list with isFavorited boolean on each game
  - [ ] 1.5 Ensure Convex function tests pass
    - Run ONLY the tests written in 1.1
    - Verify mutation creates/deletes records correctly
    - Verify query returns expected data
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-6 tests written in 1.1 pass
- toggleFavorite correctly creates and removes favorite records
- getUserFavorites returns correct gameIds for authenticated users
- Dashboard query sorts favorites to top alphabetically
- Unauthenticated users receive empty arrays (no errors)

---

### Frontend Components

#### Task Group 2: FavoriteToggle Component
**Dependencies:** Task Group 1 (Convex functions must exist)

- [ ] 2.0 Complete FavoriteToggle component
  - [ ] 2.1 Write 2-6 focused tests for FavoriteToggle component
    - Test component renders star icon in correct state (filled vs outline)
    - Test onClick triggers toggle mutation
    - Test loading state displays during mutation
    - Test event propagation is stopped (does not trigger parent)
    - Test ARIA attributes are correctly set (aria-pressed, aria-label)
  - [ ] 2.2 Create FavoriteToggle component structure
    - File: `src/components/FavoriteToggle.tsx`
    - Props: `gameId: Id<"games">`, `isFavorited: boolean`, `onToggle?: () => void`
    - Use button element as wrapper for accessibility
    - Render star icon (filled when favorited, outline when not)
    - Add `aria-pressed={isFavorited}` attribute
    - Add `aria-label="Add to favorites"` or `"Remove from favorites"` based on state
  - [ ] 2.3 Implement toggle functionality with optimistic updates
    - Use Convex useMutation hook for toggleFavorite
    - Track local optimistic state with useState
    - Update UI immediately on click (sub-100ms feedback)
    - Call mutation and await result
    - Revert local state if mutation fails
    - Call onToggle callback after successful mutation
  - [ ] 2.4 Add loading and error states
    - Track isLoading state during mutation
    - Disable button and show loading indicator when isLoading
    - Prevent double-clicks during loading
    - Display subtle error feedback on failure (brief color flash or icon shake)
    - Log errors to console for debugging
  - [ ] 2.5 Implement event propagation handling
    - Call `e.stopPropagation()` in onClick handler
    - Prevent triggering parent card click handlers
    - Ensure keyboard events (Enter, Space) also stop propagation
  - [ ] 2.6 Ensure FavoriteToggle tests pass
    - Run ONLY the tests written in 2.1
    - Verify component renders correctly in both states
    - Verify interaction handlers work as expected
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-6 tests written in 2.1 pass
- Star icon displays correct visual state
- Toggle mutation fires on click
- Optimistic UI provides immediate feedback
- Loading state prevents double-clicks
- ARIA attributes support screen readers

---

#### Task Group 3: Visual Styling and GameCard Integration
**Dependencies:** Task Group 2 (FavoriteToggle must exist), 003-status-dashboard-ui (GameCard)

- [ ] 3.0 Complete visual styling and GameCard integration
  - [ ] 3.1 Write 2-6 focused tests for styling and integration
    - Test GameCard renders FavoriteToggle in top-left corner when authenticated
    - Test GameCard hides FavoriteToggle when not authenticated
    - Test favorited card displays white drop-shadow border
    - Test unfavorited card has no special border styling
    - Test CSS transitions apply on state change
  - [ ] 3.2 Style FavoriteToggle component states
    - File: `src/components/FavoriteToggle.css` or styled-components
    - Unfavorited state: outline star, muted gray color (#9CA3AF or similar)
    - Favorited state: filled star, gold/yellow color (#F59E0B or similar)
    - Add subtle shine/glow effect to favorited star (box-shadow or filter)
    - Ensure sufficient color contrast between states
    - Apply smooth CSS transition: `transition: color 0.2s ease, filter 0.2s ease`
  - [ ] 3.3 Extend GameCard component for favorites
    - Modify existing GameCard from 003-status-dashboard-ui
    - Add `isFavorited: boolean` prop
    - Add `gameId: Id<"games">` prop for toggle mutation
    - Position FavoriteToggle in top-left corner (absolute positioning)
    - Reserve consistent space for star to avoid layout shift
  - [ ] 3.4 Apply favorited card border styling
    - Add conditional className or style when isFavorited is true
    - Favorited border: `box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8)`
    - Apply on dark background cards as specified
    - Smooth transition: `transition: box-shadow 0.2s ease`
  - [ ] 3.5 Implement conditional rendering for anonymous users
    - Use useConvexAuth or auth context from 004-user-authentication
    - Check `isAuthenticated` before rendering FavoriteToggle
    - Hide star icon entirely when not logged in
    - Do not apply favorited card styling for anonymous users
    - Ensure no layout shift (maintain consistent card dimensions)
  - [ ] 3.6 Ensure styling and integration tests pass
    - Run ONLY the tests written in 3.1
    - Verify visual states render correctly
    - Verify conditional rendering based on auth state
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-6 tests written in 3.1 pass
- Star icon positioned in top-left corner of GameCard
- Gold/shiny star for favorited, gray outline for unfavorited
- White drop-shadow border on favorited cards
- Star hidden for anonymous users
- Smooth CSS transitions between states

---

### Integration and Testing

#### Task Group 4: Dashboard Integration and Test Review
**Dependencies:** Task Groups 1-3

- [ ] 4.0 Complete dashboard integration and verify all tests
  - [ ] 4.1 Integrate favorites into dashboard page
    - File: `src/pages/Dashboard.tsx` or equivalent
    - Use getUserFavorites query to fetch user's favorites
    - Use modified dashboard query with userId for sorted results
    - Pass isFavorited prop to each GameCard
    - Pass gameId to each GameCard for toggle functionality
    - Ensure real-time updates via Convex subscriptions
  - [ ] 4.2 Verify sorting behavior
    - Confirm favorites appear at top of list
    - Confirm favorites sorted alphabetically by displayName
    - Confirm non-favorites maintain existing sortOrder
    - Test adding/removing favorites updates sort order in real-time
  - [ ] 4.3 Review tests from Task Groups 1-3
    - Review the 2-6 tests written by Task Group 1 (Convex functions)
    - Review the 2-6 tests written by Task Group 2 (FavoriteToggle)
    - Review the 2-6 tests written by Task Group 3 (Styling/Integration)
    - Total existing tests: approximately 6-18 tests
  - [ ] 4.4 Analyze test coverage gaps for favorites feature only
    - Identify critical user workflows lacking coverage
    - Focus ONLY on gaps related to favorites functionality
    - Prioritize end-to-end workflows: toggle -> sort update -> visual feedback
    - Do NOT assess entire application test coverage
  - [ ] 4.5 Write up to 8 additional strategic tests if needed
    - Add maximum of 8 new tests to fill identified critical gaps
    - Focus on integration points:
      - Full toggle flow from click to database to UI update
      - Dashboard re-sorting after favorite toggle
      - Auth state change handling (login/logout)
      - Error recovery and retry behavior
    - Skip edge cases unless business-critical
  - [ ] 4.6 Run all feature-specific tests
    - Run ONLY tests related to favorites feature (from 1.1, 2.1, 3.1, and 4.5)
    - Expected total: approximately 14-26 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 14-26 tests total)
- Favorites appear at top of dashboard, sorted alphabetically
- Real-time updates work when toggling favorites
- No more than 8 additional tests added when filling gaps
- Testing focused exclusively on favorites feature requirements

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Convex Mutations and Queries** (Backend)
   - Must be completed first as frontend depends on these functions
   - Establishes data layer and API contract

2. **Task Group 2: FavoriteToggle Component** (Frontend Component)
   - Depends on Convex functions from Task Group 1
   - Creates reusable toggle component with optimistic updates

3. **Task Group 3: Visual Styling and GameCard Integration** (Frontend Styling)
   - Depends on FavoriteToggle from Task Group 2
   - Integrates with existing GameCard from 003-status-dashboard-ui
   - Implements all visual requirements

4. **Task Group 4: Dashboard Integration and Test Review** (Integration)
   - Depends on all previous task groups
   - Wires everything together in the dashboard
   - Validates complete feature functionality

---

## Files to Create/Modify

### New Files
- `convex/favorites.ts` - Convex mutations and queries
- `src/components/FavoriteToggle.tsx` - Star toggle component
- `src/components/FavoriteToggle.css` - Component styles (or inline/styled-components)

### Files to Modify
- `convex/games.ts` (or dashboard query file) - Add favorites-first sorting
- `src/components/GameCard.tsx` - Add FavoriteToggle slot and favorited styling
- `src/pages/Dashboard.tsx` - Integrate favorites query and pass props

---

## Key Technical Decisions

1. **Optimistic Updates**: Use local state for immediate UI feedback, revert on failure
2. **Compound Index**: Leverage (userId, gameId) index for efficient lookups and uniqueness
3. **Single Query**: Modify dashboard query to include favorites sorting (not separate queries)
4. **Conditional Rendering**: Check auth state in GameCard to hide star for anonymous users
5. **Event Propagation**: Stop propagation to prevent card click handlers from firing
