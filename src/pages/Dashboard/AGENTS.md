# Dashboard Agent Notes

## Header Actions Pattern
The Dashboard header has 3 render paths (loading, empty, main content) that each need the same header-actions UI. When modifying header elements, update all 3 locations.

## User Info Display
- `useAuth()` provides `user` object with `displayName`
- Username displays to the left of `ConnectionHealthIndicator` (the green dot)
- CSS class: `.dashboard-username` with text-overflow ellipsis for long names
