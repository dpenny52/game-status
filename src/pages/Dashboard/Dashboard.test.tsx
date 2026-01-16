/**
 * Tests for Dashboard Page
 *
 * Tests verify the dashboard renders header, platform sections, and footer.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Dashboard } from "./Dashboard";
import type { GameWithStatus } from "../../components/PlatformSection";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// Mock the Convex useQuery hook
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

import { useQuery } from "convex/react";

describe("Dashboard Page", () => {
  const NOW = new Date("2025-01-15T12:00:00Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  const mockGamesData: GameWithStatus[] = [
    {
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
          region: "global",
          lastCheckedAt: NOW - 60000,
          statusChangedAt: NOW - 3600000,
        },
      ],
    },
    {
      game: {
        _id: "game2",
        slug: "league-of-legends",
        displayName: "League of Legends",
        platform: "riot",
        iconUrl: "https://example.com/lol.png",
        sortOrder: 1,
        isActive: true,
      },
      statusRecords: [
        {
          _id: "status2",
          status: "online",
          region: "na",
          lastCheckedAt: NOW - 120000,
          statusChangedAt: NOW - 7200000,
        },
      ],
    },
  ];

  it("should render header with brand name and tagline", () => {
    vi.mocked(useQuery).mockReturnValue(mockGamesData);

    render(<Dashboard />);

    expect(screen.getByText("GameStatus")).toBeInTheDocument();
    expect(
      screen.getByText(/real-time game server status/i)
    ).toBeInTheDocument();
  });

  it("should display platform sections with game cards", () => {
    vi.mocked(useQuery).mockReturnValue(mockGamesData);

    render(<Dashboard />);

    // Platform headers should be present
    expect(screen.getByRole("heading", { name: "Blizzard" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Riot Games" })
    ).toBeInTheDocument();

    // Game names should be visible
    expect(screen.getByText("World of Warcraft")).toBeInTheDocument();
    expect(screen.getByText("League of Legends")).toBeInTheDocument();
  });

  it("should show loading state while data is being fetched", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);

    render(<Dashboard />);

    // Should show loading skeletons
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("should show empty state when no games are available", () => {
    vi.mocked(useQuery).mockReturnValue([]);

    render(<Dashboard />);

    expect(screen.getByText(/No games/i)).toBeInTheDocument();
  });
});
