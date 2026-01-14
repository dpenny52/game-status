# Specification: Status Dashboard UI

## Goal

Build the main React dashboard that displays all supported games with their current server status, providing gamers a unified view with visual status indicators, regional breakdowns, and last-updated timestamps organized by platform/publisher.

## User Stories

- As a casual gamer, I want to see all game server statuses on one page so that I can quickly check if my games are playable before starting a session
- As a dedicated gamer, I want to see regional server status and when the status was last checked so that I know if the information is current and relevant to my region

## Specific Requirements

**Dashboard Page Layout**
- Create a single-page dashboard as the main entry point of the application
- Display a header with the "GameStatus" brand name and tagline
- Organize game cards in a responsive grid layout that adapts to viewport width
- Group games visually by platform/publisher with clear section headers
- Include a footer with last global refresh timestamp and data attribution

**Game Card Component**
- Display game icon (from iconUrl in games table), display name, and platform badge
- Show primary status indicator prominently with color-coded visual treatment
- Display "Last checked: X minutes ago" using lastCheckedAt timestamp with relative time formatting
- Show "Down since: X hours ago" when status is offline/maintenance using statusChangedAt
- Include optional status message from provider when available
- Maintain consistent card dimensions across all games for visual harmony

**Status Indicator Component**
- Create a reusable status indicator with five visual states matching the status enum
- Online: Green color with checkmark or filled circle icon
- Offline: Red color with X or empty circle icon
- Degraded: Yellow/amber color with warning triangle icon
- Maintenance: Blue color with wrench or clock icon
- Unknown: Gray color with question mark icon
- Include text label alongside icon for accessibility (do not rely on color alone)

**Regional Status Display**
- Show expandable regional breakdown for games with multi-region status data
- Display region codes (NA, EU, ASIA, OCE) with individual status indicators per region
- Use "Global" label for games without regional server separation
- Default to collapsed state to reduce visual clutter; expand on user interaction
- Highlight user's likely region based on browser locale when possible

**Platform/Publisher Grouping**
- Create collapsible sections for each platform: Blizzard, Riot, Steam, Epic, Mojang, Square Enix
- Display platform logo or icon in section header alongside platform name
- Show aggregate status summary per platform (e.g., "3/4 online") in collapsed header
- Allow users to expand/collapse individual platform sections
- Respect sortOrder field from games table within each platform group

**Convex Query Integration**
- Create a query function to fetch all active games with their current status records
- Join games table with serverStatusRecords to get status data in a single query
- Filter to only isActive games to exclude disabled games from display
- Sort results by platform first, then by sortOrder within platform
- Prepare for real-time subscriptions by using useQuery hook (actual real-time updates in spec 008)

**Loading and Empty States**
- Display skeleton loading cards while initial data is being fetched
- Show appropriate messaging if no games are configured in the system
- Handle error states gracefully with retry option and user-friendly error message
- Indicate visually when data is stale (lastCheckedAt older than 5 minutes)

**Timestamp Formatting**
- Use relative time formatting for recent updates (e.g., "2 minutes ago", "just now")
- Switch to absolute time for updates older than 24 hours (e.g., "Jan 14, 2:30 PM")
- Display timezone context for absolute timestamps to avoid confusion
- Update relative timestamps periodically without full page refresh

## Existing Code to Leverage

**Convex Schema from 001-data-models-schema**
- Query games table for slug, displayName, platform, iconUrl, sortOrder, isActive fields
- Query serverStatusRecords table joined by gameId for status, region, lastCheckedAt, statusChangedAt, statusMessage
- Use status enum values (online, offline, degraded, maintenance, unknown) for visual mapping
- Use region enum values (na, eu, asia, oce, global) for regional display

**Convex Query Patterns**
- Use useQuery hook from "convex/react" for reactive data fetching in React components
- Follow pattern of defining query functions in convex/queries.ts with proper argument validation
- Use db.query().withIndex() for efficient indexed lookups on platform and gameId fields

**Frontend Component Standards**
- Follow frontend/components.md: single responsibility, reusability, composability principles
- Follow frontend/accessibility.md: semantic HTML, keyboard navigation, color contrast, ARIA attributes
- Follow frontend/css.md: consistent methodology, design tokens for status colors and spacing

**React + Vite Patterns**
- Use functional components with hooks for state management
- Leverage Vite's fast HMR during development for rapid iteration
- Structure components in src/components directory with co-located styles

## Out of Scope

- Favorites pinning functionality and personalized ordering (spec 005-favorites-system)
- User authentication, login, or account-related UI elements (spec 004-user-authentication)
- Email alert subscription UI and settings (separate spec)
- Mobile-specific responsive breakpoints and touch interactions (spec 010-mobile-responsive)
- Historical status charts or outage timeline display (spec 009-status-history)
- Real-time auto-refresh via Convex subscriptions (spec 008-auto-refresh-real-time)
- Search or text filtering of games
- Dark mode or theme switching
- Notification badges or browser notifications
- Game-specific detail pages or deep linking
