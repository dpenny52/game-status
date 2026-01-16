/**
 * Dashboard Page
 *
 * The main entry point of the application that displays all supported games
 * with their current server status organized by platform. Supports favorites
 * sorting for authenticated users and real-time updates via Convex subscriptions.
 *
 * @module Dashboard
 */
import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import {
  PlatformSection,
  type Platform,
  type GameWithStatus,
} from "../../components/PlatformSection";
import { SkeletonCard } from "../../components/SkeletonCard";
import { EmptyState } from "../../components/EmptyState";
import { ConnectionHealthIndicator } from "../../components/ConnectionHealthIndicator";
import "./Dashboard.css";

/**
 * Platform display order for the dashboard.
 */
const PLATFORM_ORDER: Platform[] = [
  "blizzard",
  "riot",
  "steam",
  "epic",
  "mojang",
  "squareenix",
];

/**
 * Groups games by their platform.
 */
function groupByPlatform(
  games: GameWithStatus[]
): Map<Platform, GameWithStatus[]> {
  const grouped = new Map<Platform, GameWithStatus[]>();

  for (const platform of PLATFORM_ORDER) {
    grouped.set(platform, []);
  }

  for (const game of games) {
    const platform = game.game.platform as Platform;
    const existing = grouped.get(platform);
    if (existing) {
      existing.push(game);
    }
  }

  return grouped;
}

/**
 * Demo data for when Convex is not available.
 */
const DEMO_GAMES: GameWithStatus[] = [
  {
    game: {
      _id: "demo_1",
      displayName: "World of Warcraft",
      platform: "blizzard",
      slug: "wow",
      iconUrl: "",
      sortOrder: 1,
      isActive: true,
    },
    statusRecords: [
      {
        _id: "status_1",
        region: "NA",
        status: "online",
        lastCheckedAt: Date.now(),
        statusChangedAt: Date.now(),
      },
    ],
    isFavorited: false,
  },
  {
    game: {
      _id: "demo_2",
      displayName: "League of Legends",
      platform: "riot",
      slug: "lol",
      iconUrl: "",
      sortOrder: 1,
      isActive: true,
    },
    statusRecords: [
      {
        _id: "status_2",
        region: "NA",
        status: "online",
        lastCheckedAt: Date.now(),
        statusChangedAt: Date.now(),
      },
    ],
    isFavorited: false,
  },
  {
    game: {
      _id: "demo_3",
      displayName: "Counter-Strike 2",
      platform: "steam",
      slug: "cs2",
      iconUrl: "",
      sortOrder: 1,
      isActive: true,
    },
    statusRecords: [
      {
        _id: "status_3",
        region: "NA",
        status: "degraded",
        lastCheckedAt: Date.now(),
        statusChangedAt: Date.now(),
      },
    ],
    isFavorited: false,
  },
];

/**
 * Dashboard that uses Convex for data fetching.
 * Must be wrapped in a ConvexProvider.
 */
function DashboardWithConvex(): JSX.Element {
  // Get auth state to determine which query to use
  const { isAuthenticated } = useAuth();

  // Fetch games with status - Convex useQuery provides automatic reactivity
  // Data automatically updates when serverStatusRecords table changes
  const gamesWithStatusAndFavorites = useQuery(
    api.queries.getAllGamesWithStatusAndFavorites
  );
  const gamesWithStatusBasic = useQuery(api.queries.getAllGamesWithStatus);

  // Use the appropriate data based on auth state
  const gamesWithStatus = isAuthenticated
    ? gamesWithStatusAndFavorites
    : gamesWithStatusBasic;

  return <DashboardContent gamesWithStatus={gamesWithStatus as unknown as GameWithStatus[] | undefined} />;
}

/**
 * Dashboard that uses demo data (no Convex required).
 */
function DashboardDemo(): JSX.Element {
  return <DashboardContent gamesWithStatus={DEMO_GAMES} />;
}

/**
 * The actual dashboard content, receives game data as props.
 */
function DashboardContent({ gamesWithStatus }: { gamesWithStatus: GameWithStatus[] | undefined }): JSX.Element {
  // Group games by platform
  const gamesByPlatform = useMemo(() => {
    if (!gamesWithStatus) return null;
    return groupByPlatform(gamesWithStatus);
  }, [gamesWithStatus]);

  // Get the most recent lastCheckedAt timestamp for footer
  const lastRefreshTime = useMemo(() => {
    if (!gamesWithStatus || gamesWithStatus.length === 0) return null;

    let mostRecent = 0;
    for (const game of gamesWithStatus) {
      for (const record of game.statusRecords) {
        if (record.lastCheckedAt > mostRecent) {
          mostRecent = record.lastCheckedAt;
        }
      }
    }

    return mostRecent > 0 ? mostRecent : null;
  }, [gamesWithStatus]);

  // Use auto-updating relative time for footer
  const lastRefreshTimeFormatted = useRelativeTime(lastRefreshTime);

  // Render loading state
  if (gamesWithStatus === undefined) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <h1 className="dashboard-brand">GameStatus</h1>
            <p className="dashboard-tagline">
              Real-time game server status monitoring
            </p>
          </div>
          <ConnectionHealthIndicator
            className="dashboard-connection-indicator"
            data-testid="connection-health-indicator"
          />
        </header>
        <main className="dashboard-main">
          <div className="dashboard-loading" role="status" aria-label="Loading">
            <p className="dashboard-loading-text">Loading game status...</p>
            <div className="skeleton-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </main>
        <footer className="dashboard-footer">
          <p className="footer-attribution">
            Data sourced from official game status APIs
          </p>
        </footer>
      </div>
    );
  }

  // Render empty state
  if (gamesWithStatus.length === 0) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <h1 className="dashboard-brand">GameStatus</h1>
            <p className="dashboard-tagline">
              Real-time game server status monitoring
            </p>
          </div>
          <ConnectionHealthIndicator
            className="dashboard-connection-indicator"
            data-testid="connection-health-indicator"
          />
        </header>
        <main className="dashboard-main">
          <EmptyState
            message="No games configured"
            description="Game status tracking hasn't been set up yet. Please check back later."
          />
        </main>
        <footer className="dashboard-footer">
          <p className="footer-attribution">
            Data sourced from official game status APIs
          </p>
        </footer>
      </div>
    );
  }

  // Filter to only platforms with games
  const platformsWithGames = PLATFORM_ORDER.filter((platform) => {
    const games = gamesByPlatform?.get(platform);
    return games && games.length > 0;
  });

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-brand">GameStatus</h1>
          <p className="dashboard-tagline">
            Real-time game server status monitoring
          </p>
        </div>
        <ConnectionHealthIndicator
          className="dashboard-connection-indicator"
          data-testid="connection-health-indicator"
        />
      </header>

      <main className="dashboard-main">
        <div className="platform-sections">
          {platformsWithGames.map((platform) => {
            const games = gamesByPlatform?.get(platform) || [];
            return (
              <PlatformSection
                key={platform}
                platform={platform}
                games={games}
                defaultExpanded
              />
            );
          })}
        </div>
      </main>

      <footer className="dashboard-footer">
        {lastRefreshTime && (
          <p className="footer-timestamp">
            Last updated: {lastRefreshTimeFormatted}
          </p>
        )}
        <p className="footer-attribution">
          Data sourced from official game status APIs
        </p>
      </footer>
    </div>
  );
}

/**
 * Dashboard displays all game server statuses organized by platform.
 *
 * Features:
 * - Real-time updates via Convex subscriptions (no manual refresh needed)
 * - Connection health indicator showing Convex connection status
 * - Auto-updating relative timestamps
 * - Status change animations on individual game cards
 * - Stale data indicators when data exceeds 10-minute threshold
 *
 * For authenticated users:
 * - Uses getAllGamesWithStatusAndFavorites query for favorites sorting
 * - Favorites appear first (alphabetically) within each platform section
 * - Star icon visible on each game card for toggling favorites
 *
 * For anonymous users:
 * - Uses getAllGamesWithStatus query (no favorites)
 * - Standard sortOrder sorting
 * - No star icons displayed
 *
 * In demo mode (no Convex):
 * - Displays sample game data
 *
 * @example
 * ```tsx
 * <ConvexProvider client={convex}>
 *   <Dashboard />
 * </ConvexProvider>
 * ```
 */
export function Dashboard({ useConvex = true }: { useConvex?: boolean }): JSX.Element {
  if (useConvex) {
    return <DashboardWithConvex />;
  }
  return <DashboardDemo />;
}

export default Dashboard;
