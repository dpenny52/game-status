# Product Roadmap

1. [ ] Data Models and Schema — Define Convex schema for games, server status records, user accounts, favorites, and alert subscriptions `S`

2. [ ] Server Status Fetching Service — Build backend service that polls official status APIs/endpoints for all supported games (Blizzard, Riot, Steam, Epic, Mojang, Square Enix) and stores results in Convex `L`

3. [ ] Status Dashboard UI — Create the main React dashboard displaying all games with their current server status, including visual indicators (online/offline/degraded) and last-updated timestamps `M`

4. [ ] User Authentication — Implement user registration and login system to enable personalized features like favorites and alerts `M`

5. [ ] Favorites System — Allow authenticated users to mark games as favorites, persist selections to their account, and display favorites pinned at the top of the dashboard `S`

6. [x] Email Alert Subscriptions — Enable users to subscribe to email notifications for specific games, storing their alert preferences in the database `S`

7. [ ] Alert Notification Service — Build backend service that detects when a game transitions from offline to online and sends email notifications to subscribed users `M`

8. [x] Auto-Refresh and Real-Time Updates — Implement automatic dashboard refresh and real-time status updates using Convex subscriptions so users see changes without manual refresh `S`

9. [ ] Mobile-Responsive Design — Ensure the dashboard is fully responsive and usable on mobile devices for checking status on the go `S`

> Notes
> - Order items by technical dependencies and product architecture
> - Each item should represent an end-to-end (frontend + backend) functional and testable feature
> - Effort scale: XS (1 day), S (2-3 days), M (1 week), L (2 weeks), XL (3+ weeks)
