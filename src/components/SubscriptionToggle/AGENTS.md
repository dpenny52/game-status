# SubscriptionToggle Agent Notes

## Component Architecture

- `SubscriptionToggle.tsx` - Main bell icon button component
- `RegionSelectionPopover.tsx` - Floating region selection dialog

## Portal-Based Popover (Issue #5 Fix)

- The popover uses `createPortal` to render at document body level
- This prevents clipping by parent containers with overflow restrictions
- Position is calculated using `getBoundingClientRect()` of the anchor button
- Position updates on scroll/resize events

## Custom Auth Integration (Issue #5 Fix)

- The component extracts `user._id` from AuthContext for Convex mutations
- `userId` must be passed to all subscription queries/mutations
- Pattern: `isAuthenticated && userId ? { gameId, userId } : "skip"`
- This works with the custom localStorage-based auth system

## CSS Notes

- `.region-popover--portal` class indicates portal-based rendering
- `position: fixed` is set via inline styles based on calculated position
- `z-index: 9999` ensures popover appears above all other content

## Testing

- Unit tests mock both `convex/react` and `AuthContext`
- Auth mock must include `user._id` for subscription tests to work
- E2e tests require Convex backend data - they skip gracefully when unavailable
