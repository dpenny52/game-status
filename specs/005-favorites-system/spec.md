# Specification: Favorites System

## Goal

Enable logged-in users to mark games as favorites via a star icon toggle, with favorited games visually distinguished and sorted to the top of the dashboard list for quick access.

## User Stories

- As a registered user, I want to mark games as favorites so that my preferred games appear at the top of the dashboard for quick status checks
- As a returning user, I want my favorites to persist across sessions so that I do not have to re-select them each visit

## Specific Requirements

**Star Icon Component**
- Create a reusable FavoriteToggle component that renders a clickable star icon
- Position the star icon in the top-left corner of the game card
- Implement two visual states: default (unfavorited) and active (favorited)
- Use onClick handler to trigger favorite toggle mutation
- Include appropriate ARIA attributes for accessibility (aria-pressed, aria-label)
- Prevent event propagation to avoid triggering parent card interactions
- Display loading state during mutation to prevent double-clicks

**Favorited Visual Styling**
- Apply gold/yellow color with subtle shine effect to the star when favorited
- Use outline or muted gray star icon for unfavorited default state
- Add white drop-shadow border effect to entire game card when favorited
- Ensure sufficient color contrast between favorited and unfavorited states
- Apply smooth CSS transition for state changes (color and shadow)
- Border styling: white box-shadow on black/dark background cards

**Convex Mutation for Toggle**
- Create toggleFavorite mutation accepting gameId as argument
- Use auth.getUserIdentity() to get current user ID
- Check if favorite record exists for user+game combination
- If exists: delete the favorite record (unfavorite action)
- If not exists: insert new favorite record with userId, gameId, createdAt
- Return the new favorite state (true/false) for optimistic UI confirmation
- Implement as single atomic operation to prevent race conditions

**Convex Query for User Favorites**
- Create getUserFavorites query that returns Set or array of favorited gameIds
- Filter by current user's userId using auth context
- Use compound index on (userId, gameId) for efficient lookups
- Return empty array for unauthenticated users (no error)
- Design for real-time subscription support via useQuery hook

**Dashboard List Sorting Logic**
- Modify existing dashboard query to accept optional userId parameter
- Fetch user's favorites when userId is provided
- Sort games with favorites first, then non-favorites
- Within favorites group: sort alphabetically by game displayName
- Within non-favorites group: maintain existing sortOrder behavior
- Combine into single list (no separate sections or dividers)

**Conditional Rendering for Anonymous Users**
- Check authentication state before rendering FavoriteToggle component
- Hide star icon entirely when user is not logged in
- Do not render favorited card styling for anonymous users
- Use auth context or hook from 004-user-authentication spec
- Avoid layout shift when auth state changes (reserve space or use consistent sizing)

**Optimistic UI Updates**
- Update star icon state immediately on click before server response
- Apply favorited card styling optimistically
- Revert to previous state if mutation fails
- Show subtle error indicator if toggle fails (toast or icon flash)
- Maintain responsive feel with sub-100ms visual feedback

**Error Handling**
- Handle network failures gracefully during toggle
- Display non-intrusive error feedback (do not block UI)
- Allow retry of failed toggle operations
- Log errors for debugging without exposing to user

## Existing Code to Leverage

**Favorites Table Schema from 001-data-models-schema**
- Use existing favorites table with userId, gameId, createdAt fields
- Leverage compound index on (userId, gameId) for uniqueness enforcement and efficient queries
- Follow established foreign key patterns using v.id("users") and v.id("games")
- Use _creationTime from Convex as fallback if createdAt not explicitly set

**Game Card Component from 003-status-dashboard-ui**
- Extend existing GameCard component to accept isFavorited prop
- Add slot or position for FavoriteToggle in top-left corner
- Apply conditional className or style for favorited border effect
- Maintain existing card structure and status display functionality

**Authentication Context from 004-user-authentication**
- Use auth.getUserIdentity() in Convex mutations and queries for user identification
- Leverage useConvexAuth or equivalent hook for client-side auth state
- Follow established pattern for checking isAuthenticated before rendering protected features
- Access userId from auth context to pass to favorites query

**Convex Query Patterns from 003-status-dashboard-ui**
- Follow useQuery hook pattern for reactive data fetching
- Use db.query().withIndex() for indexed lookups on favorites table
- Apply same loading and error state handling patterns
- Maintain consistency with existing query function signatures

## Out of Scope

- Sharing favorites with other users or public favorites lists
- Import/export favorites functionality
- Favorites categories, folders, or custom groupings
- Favorites limit or quota management
- Separate favorites section, page, or dedicated view
- Favorites count display or statistics
- Notification when a favorited game changes status (covered by alert subscriptions)
- Drag-and-drop reordering of favorites
- Favorites sync across multiple accounts
- Bulk favorite/unfavorite operations
