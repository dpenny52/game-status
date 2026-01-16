# Dashboard Agent Notes

## Header Actions Pattern
The Dashboard header has 3 render paths (loading, empty, main content) that each need the same header-actions UI. When modifying header elements, update all 3 locations.

## User Info Display
- `useAuth()` provides `user` object with `displayName`
- Username displays to the left of `ConnectionHealthIndicator` (the green dot)
- CSS class: `.dashboard-username` with text-overflow ellipsis for long names

## Logout Button (Issue #7)
- Added logout button next to username for authenticated users
- Uses `logout` function from `useAuth()` hook
- CSS class: `.dashboard-logout-button` with transparent background, border styling
- Data-testid: `dashboard-logout-button`

## Testing Notes
- When testing Dashboard, must mock BOTH `../../hooks/useAuth` AND `../../context/AuthContext`
- Components like SubscriptionToggle import useAuth from AuthContext directly
- Use mutable `mockAuthState` variable that's returned by both mocks
- Change `mockAuthState` in beforeEach to test authenticated vs unauthenticated scenarios
