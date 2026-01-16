/**
 * Tests for GameCard Component
 *
 * Tests verify that GameCard displays game information, status,
 * and timestamps correctly.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { GameCard } from "./GameCard";
import type { GameCardProps } from "./GameCard";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("GameCard Component", () => {
  // Use a fixed "now" time for all tests
  const NOW = new Date("2025-01-15T12:00:00Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  const baseProps: GameCardProps = {
    game: {
      _id: "game1",
      slug: "world-of-warcraft",
      displayName: "World of Warcraft",
      platform: "blizzard",
      iconUrl: "https://example.com/wow.png",
      sortOrder: 1,
      isActive: true,
    },
    statusRecords: [
      {
        _id: "status1",
        status: "online",
        region: "na",
        lastCheckedAt: NOW - 120000, // 2 minutes ago
        statusChangedAt: NOW - 3600000, // 1 hour ago
      },
      {
        _id: "status2",
        status: "online",
        region: "eu",
        lastCheckedAt: NOW - 120000,
        statusChangedAt: NOW - 3600000,
      },
    ],
  };

  it("should render game icon, name, and platform badge", () => {
    render(<GameCard {...baseProps} />);

    // Game name should be displayed
    expect(screen.getByText("World of Warcraft")).toBeInTheDocument();

    // Platform badge should be displayed
    expect(screen.getByText("Blizzard")).toBeInTheDocument();

    // Icon should be rendered (as img)
    const icon = screen.getByRole("img", { name: /World of Warcraft/i });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("src", "https://example.com/wow.png");
  });

  it('should display "Last checked:" with relative time', () => {
    render(<GameCard {...baseProps} />);

    // Should show relative time for last checked
    expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
    // The timestamp value should exist (2 minutes ago)
    const timestampContainer = screen.getByText(/Last checked:/).closest(".game-card-timestamp");
    expect(timestampContainer).toBeInTheDocument();
    expect(timestampContainer?.textContent).toContain("2 minutes ago");
  });

  it('should show "Down since" when status is offline or maintenance', () => {
    const offlineProps: GameCardProps = {
      game: baseProps.game,
      statusRecords: [
        {
          _id: "status1",
          status: "offline",
          region: "global",
          lastCheckedAt: NOW - 60000, // 1 minute ago
          statusChangedAt: NOW - 7200000, // 2 hours ago
          statusMessage: "Unexpected outage",
        },
      ],
    };

    render(<GameCard {...offlineProps} />);

    // Should show "Down since" text
    expect(screen.getByText(/Down since:/)).toBeInTheDocument();
    // The timestamp should show 2 hours ago
    const downSinceContainer = screen.getByText(/Down since:/).closest(".game-card-timestamp");
    expect(downSinceContainer?.textContent).toContain("2 hours ago");
  });

  it("should display status message when provided", () => {
    const propsWithMessage: GameCardProps = {
      game: baseProps.game,
      statusRecords: [
        {
          _id: "status1",
          status: "maintenance",
          region: "global",
          lastCheckedAt: NOW - 60000,
          statusChangedAt: NOW - 3600000,
          statusMessage: "Scheduled maintenance in progress",
        },
      ],
    };

    render(<GameCard {...propsWithMessage} />);

    expect(
      screen.getByText("Scheduled maintenance in progress")
    ).toBeInTheDocument();
  });
});
