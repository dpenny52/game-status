/**
 * RegionalStatus Component
 *
 * Displays expandable regional breakdown for games with multi-region status data.
 * Shows individual region status indicators or "Global" label for games
 * without regional separation.
 *
 * @module RegionalStatus
 */
import React, { useState, useMemo } from "react";
import { StatusIndicator, type Status } from "../StatusIndicator";
import "./RegionalStatus.css";

/**
 * Region type representing geographic regions.
 */
export type Region = "na" | "eu" | "asia" | "oce" | "global";

/**
 * Status data for a single region.
 */
export interface RegionStatus {
  region: Region;
  status: Status;
  statusMessage?: string;
}

/**
 * Props for the RegionalStatus component.
 */
export interface RegionalStatusProps {
  /** Array of region status data */
  regions: RegionStatus[];
  /** Whether to start expanded (default: false) */
  defaultExpanded?: boolean;
  /** User's detected region for highlighting */
  userRegion?: Region;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Display labels for regions.
 */
const REGION_LABELS: Record<Region, string> = {
  na: "NA",
  eu: "EU",
  asia: "ASIA",
  oce: "OCE",
  global: "Global",
};

/**
 * Detects user's likely region based on browser locale/timezone.
 */
function detectUserRegion(): Region | null {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (timezone.startsWith("America/")) {
      return "na";
    }
    if (timezone.startsWith("Europe/")) {
      return "eu";
    }
    if (
      timezone.startsWith("Asia/") ||
      timezone.startsWith("Pacific/") &&
      !timezone.includes("Auckland")
    ) {
      return "asia";
    }
    if (
      timezone.includes("Australia") ||
      timezone.includes("Auckland") ||
      timezone.includes("Pacific/")
    ) {
      return "oce";
    }
  } catch {
    // Timezone detection failed
  }

  return null;
}

/**
 * RegionalStatus displays regional server status with expand/collapse.
 *
 * @example
 * ```tsx
 * <RegionalStatus
 *   regions={[
 *     { region: "na", status: "online" },
 *     { region: "eu", status: "degraded" },
 *   ]}
 * />
 * ```
 */
export function RegionalStatus({
  regions,
  defaultExpanded = false,
  userRegion,
  className = "",
}: RegionalStatusProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Detect user region if not provided
  const detectedUserRegion = useMemo(() => {
    return userRegion ?? detectUserRegion();
  }, [userRegion]);

  // Check if this is a global-only game
  const isGlobal =
    regions.length === 1 && regions[0].region === "global";

  // Sort regions to show user's region first
  const sortedRegions = useMemo(() => {
    if (!detectedUserRegion || isGlobal) return regions;

    return [...regions].sort((a, b) => {
      if (a.region === detectedUserRegion) return -1;
      if (b.region === detectedUserRegion) return 1;
      return 0;
    });
  }, [regions, detectedUserRegion, isGlobal]);

  // Get aggregate status for collapsed view
  const aggregateStatus = useMemo((): Status => {
    const hasOffline = regions.some((r) => r.status === "offline");
    const hasDegraded = regions.some((r) => r.status === "degraded");
    const hasMaintenance = regions.some((r) => r.status === "maintenance");
    const hasUnknown = regions.some((r) => r.status === "unknown");
    const allOnline = regions.every((r) => r.status === "online");

    if (allOnline) return "online";
    if (hasOffline) return "offline";
    if (hasMaintenance) return "maintenance";
    if (hasDegraded) return "degraded";
    if (hasUnknown) return "unknown";
    return "online";
  }, [regions]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // For global games, just show the status without expand/collapse
  if (isGlobal) {
    return (
      <div className={`regional-status regional-status-global ${className}`.trim()}>
        <div className="regional-status-item regional-status-item-global">
          <span className="region-label">Global</span>
          <StatusIndicator status={regions[0].status} size="small" showLabel={false} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`regional-status ${isExpanded ? "regional-status-expanded" : "regional-status-collapsed"} ${className}`.trim()}
    >
      <button
        type="button"
        className="regional-status-toggle"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Collapse regional status" : "Expand regional status"}
      >
        <StatusIndicator status={aggregateStatus} size="small" showLabel={false} />
        <span className="regional-status-summary">
          {regions.length} regions
        </span>
        <span className={`regional-status-chevron ${isExpanded ? "expanded" : ""}`}>
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
      </button>

      {isExpanded && (
        <div className="regional-status-details" role="list">
          {sortedRegions.map((regionStatus) => (
            <div
              key={regionStatus.region}
              className={`regional-status-item ${
                regionStatus.region === detectedUserRegion
                  ? "regional-status-item-highlighted"
                  : ""
              }`}
              role="listitem"
            >
              <span className="region-label">
                {REGION_LABELS[regionStatus.region]}
              </span>
              <StatusIndicator
                status={regionStatus.status}
                size="small"
                showLabel={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RegionalStatus;
