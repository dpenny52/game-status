/**
 * Dashboard Page
 *
 * The main entry point of the application that displays all supported games
 * with their current server status organized by platform. Supports favorites
 * sorting for authenticated users.
 *
 * @module Dashboard
 */
import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import {
  PlatformSection,
  type Platform,
  type GameWithStatus,
} from "../../components/PlatformSection";
import { SkeletonCard } from "../../components/SkeletonCard";
import { EmptyState } from "../../components/EmptyState";
import { formatTime } from "../../utils/timeFormat";
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
 * Dashboard displays all game server statuses organized by platform.
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
 * @example
 * ```tsx
 * <ConvexProvider client={convex}>
 *   <Dashboard />
 * </ConvexProvider>
 * ```
 */
export function Dashboard(): JSX.Element {
  // Get auth state to determine which query to use
  const { isAuthenticated } = useAuth();

  // Fetch games with status - use favorites-aware query for authenticated users
  const gamesWithStatusAndFavorites = useQuery(
    api.queries.getAllGamesWithStatusAndFavorites
  );
  const gamesWithStatusBasic = useQuery(api.queries.getAllGamesWithStatus);

  // Use the appropriate data based on auth state
  const gamesWithStatus = isAuthenticated
    ? gamesWithStatusAndFavorites
    : gamesWithStatusBasic;

  // Group games by platform
  const gamesByPlatform = useMemo(() => {
    if (!gamesWithStatus) return null;
    return groupByPlatform(gamesWithStatus as unknown as GameWithStatus[]);
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

  // Render loading state
  if (gamesWithStatus === undefined) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1 className="dashboard-brand">GameStatus</h1>
          <p className="dashboard-tagline">
            Real-time game server status monitoring
          </p>
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
          <h1 className="dashboard-brand">GameStatus</h1>
          <p className="dashboard-tagline">
            Real-time game server status monitoring
          </p>
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
        <h1 className="dashboard-brand">GameStatus</h1>
        <p className="dashboard-tagline">
          Real-time game server status monitoring
        </p>
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
            Last updated: {formatTime(lastRefreshTime)}
          </p>
        )}
        <p className="footer-attribution">
          Data sourced from official game status APIs
        </p>
      </footer>
    </div>
  );
}

export default Dashboard;
