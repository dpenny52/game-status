/**
 * GameCard Component
 *
 * Displays a game card with icon, name, platform, status indicator,
 * timestamps, and regional status breakdown.
 *
 * @module GameCard
 */
import React, { useMemo } from "react";
import { StatusIndicator, type Status } from "../StatusIndicator";
import { RegionalStatus, type RegionStatus, type Region } from "../RegionalStatus";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import { isStale } from "../../utils/timeFormat";
import "./GameCard.css";

/**
 * Game data structure.
 */
export interface GameData {
  _id: string;
  slug: string;
  displayName: string;
  platform: string;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Status record data structure.
 */
export interface StatusRecord {
  _id: string;
  status: Status;
  region: string;
  lastCheckedAt: number;
  statusChangedAt: number;
  statusMessage?: string;
}

/**
 * Props for the GameCard component.
 */
export interface GameCardProps {
  /** Game information */
  game: GameData;
  /** Status records for the game */
  statusRecords: StatusRecord[];
  /** Additional CSS class names */
  className?: string;
}

/**
 * Platform display labels.
 */
const PLATFORM_LABELS: Record<string, string> = {
  blizzard: "Blizzard",
  riot: "Riot",
  steam: "Steam",
  epic: "Epic",
  mojang: "Mojang",
  squareenix: "Square Enix",
};

/**
 * Determines the primary status from multiple status records.
 */
function getPrimaryStatus(records: StatusRecord[]): Status {
  if (records.length === 0) return "unknown";

  // Priority: offline > maintenance > degraded > unknown > online
  if (records.some((r) => r.status === "offline")) return "offline";
  if (records.some((r) => r.status === "maintenance")) return "maintenance";
  if (records.some((r) => r.status === "degraded")) return "degraded";
  if (records.some((r) => r.status === "unknown")) return "unknown";
  return "online";
}

/**
 * Checks if status should show "down since" message.
 */
function isDownStatus(status: Status): boolean {
  return status === "offline" || status === "maintenance";
}

/**
 * GameCard displays a game with its status and related information.
 *
 * @example
 * ```tsx
 * <GameCard
 *   game={{
 *     _id: "1",
 *     slug: "wow",
 *     displayName: "World of Warcraft",
 *     platform: "blizzard",
 *     iconUrl: "/icons/wow.png",
 *     sortOrder: 1,
 *     isActive: true,
 *   }}
 *   statusRecords={[
 *     { _id: "s1", status: "online", region: "na", lastCheckedAt: Date.now(), statusChangedAt: Date.now() }
 *   ]}
 * />
 * ```
 */
export function GameCard({
  game,
  statusRecords,
  className = "",
}: GameCardProps): JSX.Element {
  // Determine primary status
  const primaryStatus = useMemo(
    () => getPrimaryStatus(statusRecords),
    [statusRecords]
  );

  // Get the most recent check time
  const lastCheckedAt = useMemo(() => {
    if (statusRecords.length === 0) return null;
    return Math.max(...statusRecords.map((r) => r.lastCheckedAt));
  }, [statusRecords]);

  // Get the status changed time (for down since display)
  const statusChangedAt = useMemo(() => {
    if (statusRecords.length === 0) return null;
    // For down status, use the earliest change time
    const downRecords = statusRecords.filter((r) => isDownStatus(r.status));
    if (downRecords.length === 0) return null;
    return Math.min(...downRecords.map((r) => r.statusChangedAt));
  }, [statusRecords]);

  // Get status message if any
  const statusMessage = useMemo(() => {
    const recordWithMessage = statusRecords.find((r) => r.statusMessage);
    return recordWithMessage?.statusMessage;
  }, [statusRecords]);

  // Format timestamps
  const lastCheckedTime = useRelativeTime(lastCheckedAt);
  const downSinceTime = useRelativeTime(statusChangedAt);

  // Check if data is stale
  const dataIsStale = lastCheckedAt ? isStale(lastCheckedAt) : false;

  // Convert status records to region status format
  const regionStatuses: RegionStatus[] = useMemo(() => {
    return statusRecords.map((record) => ({
      region: record.region as Region,
      status: record.status,
      statusMessage: record.statusMessage,
    }));
  }, [statusRecords]);

  const showDownSince = isDownStatus(primaryStatus) && statusChangedAt;

  return (
    <article
      className={`game-card game-card-status-${primaryStatus} ${dataIsStale ? "game-card-stale" : ""} ${className}`.trim()}
      data-testid="game-card"
    >
      <header className="game-card-header">
        <img
          src={game.iconUrl}
          alt={`${game.displayName} icon`}
          className="game-card-icon"
          loading="lazy"
        />
        <div className="game-card-title-section">
          <h3 className="game-card-title">{game.displayName}</h3>
          <span className="game-card-platform">
            {PLATFORM_LABELS[game.platform] || game.platform}
          </span>
        </div>
      </header>

      <div className="game-card-status-section">
        <StatusIndicator status={primaryStatus} />
        {statusMessage && (
          <p className="game-card-status-message">{statusMessage}</p>
        )}
      </div>

      <div className="game-card-timestamps">
        <div className="game-card-timestamp">
          <span className="timestamp-label">Last checked:</span>
          <span className="timestamp-value">{lastCheckedTime}</span>
          {dataIsStale && (
            <span className="stale-indicator" title="Data may be outdated">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="stale-icon"
                aria-label="Data may be outdated"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
            </span>
          )}
        </div>
        {showDownSince && (
          <div className="game-card-timestamp game-card-down-since">
            <span className="timestamp-label">Down since:</span>
            <span className="timestamp-value">{downSinceTime}</span>
          </div>
        )}
      </div>

      {regionStatuses.length > 0 && (
        <footer className="game-card-footer">
          <RegionalStatus regions={regionStatuses} />
        </footer>
      )}
    </article>
  );
}

export default GameCard;
