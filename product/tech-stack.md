# Tech Stack

## Language

- **TypeScript** — Used across both frontend and backend for type safety and consistent developer experience

## Frontend

- **React** — Component-based UI library for building the interactive dashboard
- **Vite** — Build tool and development server for fast HMR and optimized production builds

## Backend

- **Node.js** — JavaScript runtime for server-side logic
- **Vite** — Used as the backend build tool and dev server

## Database and Backend Services

- **Convex** — Real-time backend platform providing:
  - Database storage for games, users, favorites, and alert subscriptions
  - Real-time subscriptions for live status updates on the dashboard
  - Serverless functions for status fetching and alert processing
  - Built-in scheduling for periodic status polling jobs

## External Integrations

- **Blizzard API / Battle.net Status** — Server status for World of Warcraft, Diablo, Overwatch, and other Blizzard titles
- **Riot Games API** — Server status for League of Legends, Valorant, and other Riot titles
- **Steam Web API** — Steam platform and community server status
- **Epic Games Status** — Fortnite server status
- **Mojang/Xbox Status API** — Minecraft server status
- **Square Enix Lodestone API** — Final Fantasy XIV server status

## Email Service

- **Email Provider (TBD)** — Service for sending alert notifications (options: SendGrid, Resend, AWS SES, or Convex-compatible email action)

## Development Tools

- **ESLint** — Code linting for consistent code quality
- **Prettier** — Code formatting
- **Git** — Version control
