/**
 * PlatformSection Component
 *
 * Displays a collapsible section for a platform/publisher with aggregate
 * status summary and a grid of game cards.
 *
 * @module PlatformSection
 */
import React, { useState, useMemo } from "react";
import { GameCard, type GameData, type StatusRecord } from "../GameCard";
import { StatusIndicator, type Status } from "../StatusIndicator";
import "./PlatformSection.css";

/**
 * Platform type representing game publishers.
 */
export type Platform =
  | "blizzard"
  | "riot"
  | "steam"
  | "epic"
  | "mojang"
  | "squareenix";

/**
 * Combined game and status data.
 */
export interface GameWithStatus {
  game: GameData;
  statusRecords: StatusRecord[];
}

/**
 * Props for the PlatformSection component.
 */
export interface PlatformSectionProps {
  /** Platform identifier */
  platform: Platform;
  /** Array of games with their status records */
  games: GameWithStatus[];
  /** Whether to start expanded (default: true) */
  defaultExpanded?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Display labels for platforms.
 */
const PLATFORM_LABELS: Record<Platform, string> = {
  blizzard: "Blizzard",
  riot: "Riot Games",
  steam: "Steam",
  epic: "Epic Games",
  mojang: "Mojang",
  squareenix: "Square Enix",
};

/**
 * Platform logo/icon URLs (placeholder for actual logos).
 */
const PLATFORM_ICONS: Record<Platform, string> = {
  blizzard: "https://cdn.worldvectorlogo.com/logos/blizzard-entertainment.svg",
  riot: "https://cdn.worldvectorlogo.com/logos/riot-games.svg",
  steam: "https://cdn.worldvectorlogo.com/logos/steam-icon-logo.svg",
  epic: "https://cdn.worldvectorlogo.com/logos/epic-games-2.svg",
  mojang: "https://cdn.worldvectorlogo.com/logos/minecraft-1.svg",
  squareenix: "https://cdn.worldvectorlogo.com/logos/square-enix-1.svg",
};

/**
 * Gets primary status from a game's status records.
 */
function getGamePrimaryStatus(statusRecords: StatusRecord[]): Status {
  if (statusRecords.length === 0) return "unknown";
  if (statusRecords.some((r) => r.status === "offline")) return "offline";
  if (statusRecords.some((r) => r.status === "maintenance")) return "maintenance";
  if (statusRecords.some((r) => r.status === "degraded")) return "degraded";
  if (statusRecords.some((r) => r.status === "unknown")) return "unknown";
  return "online";
}

/**
 * PlatformSection displays a collapsible section with game cards.
 *
 * @example
 * ```tsx
 * <PlatformSection
 *   platform="blizzard"
 *   games={[{ game: {...}, statusRecords: [...] }]}
 *   defaultExpanded
 * />
 * ```
 */
export function PlatformSection({
  platform,
  games,
  defaultExpanded = true,
  className = "",
}: PlatformSectionProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate aggregate status
  const { onlineCount, totalCount, aggregateStatus } = useMemo(() => {
    const total = games.length;
    const online = games.filter(
      (g) => getGamePrimaryStatus(g.statusRecords) === "online"
    ).length;

    // Aggregate status for the platform
    let status: Status = "online";
    if (games.some((g) => getGamePrimaryStatus(g.statusRecords) === "offline")) {
      status = "offline";
    } else if (
      games.some((g) => getGamePrimaryStatus(g.statusRecords) === "maintenance")
    ) {
      status = "maintenance";
    } else if (
      games.some((g) => getGamePrimaryStatus(g.statusRecords) === "degraded")
    ) {
      status = "degraded";
    } else if (
      games.some((g) => getGamePrimaryStatus(g.statusRecords) === "unknown")
    ) {
      status = "unknown";
    }

    return { onlineCount: online, totalCount: total, aggregateStatus: status };
  }, [games]);

  // Sort games by sortOrder
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => a.game.sortOrder - b.game.sortOrder);
  }, [games]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <section
      className={`platform-section ${isExpanded ? "platform-section-expanded" : "platform-section-collapsed"} ${className}`.trim()}
      aria-labelledby={`platform-${platform}-header`}
    >
      <button
        type="button"
        className="platform-section-header"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        id={`platform-${platform}-header`}
      >
        <div className="platform-section-header-left">
          <img
            src={PLATFORM_ICONS[platform]}
            alt=""
            className="platform-icon"
            loading="lazy"
          />
          <h2 className="platform-name">{PLATFORM_LABELS[platform]}</h2>
        </div>
        <div className="platform-section-header-right">
          <StatusIndicator status={aggregateStatus} size="small" showLabel={false} />
          <span className="platform-summary">
            {onlineCount}/{totalCount} online
          </span>
          <span className={`platform-chevron ${isExpanded ? "expanded" : ""}`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="platform-section-content">
          <div className="game-card-grid">
            {sortedGames.map((gameData) => (
              <GameCard
                key={gameData.game._id}
                game={gameData.game}
                statusRecords={gameData.statusRecords}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default PlatformSection;
