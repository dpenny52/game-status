# Spec Requirements: Favorites System

## Initial Description
A favorites system that allows logged-in users to mark games as favorites, with favorited games sorting to the top of the dashboard list.

## Requirements Discussion

### First Round Questions

**Q1:** How should users add/remove favorites?
**Answer:** Star icon to toggle favorite status, make it gold when favorited.

**Q2:** Where should the visual indicator appear on game cards?
**Answer:** Star in top-LEFT corner of game card, gold and shiny when favorited. Favorited game cards have a border made of white drop-shadow on black background.

**Q3:** How should favorites appear on the dashboard?
**Answer:** Favorites just sort to the top of a single combined list (no separate section).

**Q4:** How should non-logged-in users experience the favorites feature?
**Answer:** Hide favorite functionality entirely for anonymous users.

**Q5:** Should there be a limit on how many games can be favorited?
**Answer:** Unlimited.

**Q6:** How should favorited games be sorted among themselves?
**Answer:** Alphabetically by game name.

**Q7:** What features should be explicitly excluded?
**Answer:** No sharing features, no import/export. Only favorite/unfavorite functionality.

### Existing Code to Reference

**Similar Features Identified:**
- Spec: 001-data-models-schema - Contains the Favorites table schema with userId, gameId, and createdAt timestamp fields, plus compound index on (userId, gameId) for uniqueness
- Spec: 003-status-dashboard-ui - Dashboard where favorites will be displayed
- Spec: 004-user-authentication - User authentication system required for favorites functionality

### Follow-up Questions
None required - all requirements were clearly specified.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - No visual files to analyze.

## Requirements Summary

### Functional Requirements
- Toggle favorite status via star icon on game cards
- Display star icon in top-left corner of game cards
- Visual states: default (unfavorited) and gold/shiny (favorited)
- Favorited game cards display white drop-shadow border on black background
- Favorites sort to top of combined dashboard list (no separate section)
- Favorited games sorted alphabetically by game name among themselves
- Unlimited favorites per user
- Hide all favorite functionality for anonymous/non-logged-in users

### Technical Stack
- TypeScript
- React + Vite (frontend)
- Convex (database)

### Data Model (from 001-data-models-schema)
- Favorites table with fields:
  - userId: Reference to user
  - gameId: Reference to game
  - createdAt: Timestamp
- Compound index on (userId, gameId) for uniqueness enforcement

### Reusability Opportunities
- Leverage existing game card component from 003-status-dashboard-ui
- Use authentication hooks/context from 004-user-authentication
- Follow existing Convex patterns from 001-data-models-schema

### Scope Boundaries
**In Scope:**
- Star icon component for toggling favorites
- Visual styling for favorited state (gold star, drop-shadow border)
- Convex mutation for adding/removing favorites
- Query logic to sort favorites to top of dashboard list
- Conditional rendering to hide feature for anonymous users

**Out of Scope:**
- Sharing favorites with other users
- Import/export favorites functionality
- Favorites categories or folders
- Favorites limit or quota management
- Separate favorites section/page

### Technical Considerations
- Integration with existing dashboard UI (003-status-dashboard-ui)
- Dependency on user authentication (004-user-authentication)
- Convex database operations for CRUD on favorites
- Real-time updates via Convex subscriptions
- Optimistic UI updates for responsive feel when toggling
