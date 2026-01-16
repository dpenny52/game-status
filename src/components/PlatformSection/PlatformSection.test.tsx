/**
 * Tests for PlatformSection Component
 *
 * Tests verify platform header, aggregate status summary, and
 * expand/collapse functionality.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { PlatformSection } from "./PlatformSection";
import type { PlatformSectionProps } from "./PlatformSection";

// Mock the auth hook
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

// Mock the useMutation hook from convex
vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn().mockResolvedValue(true)),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PlatformSection Component", () => {
  const NOW = new Date("2025-01-15T12:00:00Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  const baseProps: PlatformSectionProps = {
    platform: "blizzard",
    games: [
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
          slug: "diablo-iv",
          displayName: "Diablo IV",
          platform: "blizzard",
          iconUrl: "https://example.com/d4.png",
          sortOrder: 2,
          isActive: true,
        },
        statusRecords: [
          {
            _id: "status2",
            status: "online",
            region: "global",
            lastCheckedAt: NOW - 60000,
            statusChangedAt: NOW - 3600000,
          },
        ],
      },
      {
        game: {
          _id: "game3",
          slug: "overwatch-2",
          displayName: "Overwatch 2",
          platform: "blizzard",
          iconUrl: "https://example.com/ow2.png",
          sortOrder: 3,
          isActive: true,
        },
        statusRecords: [
          {
            _id: "status3",
            status: "offline",
            region: "global",
            lastCheckedAt: NOW - 60000,
            statusChangedAt: NOW - 1800000,
          },
        ],
      },
    ],
  };

  it("should render platform header with name", () => {
    render(<PlatformSection {...baseProps} />);

    // Use role to specifically target the header
    const header = screen.getByRole("heading", { name: "Blizzard" });
    expect(header).toBeInTheDocument();
    expect(header.className).toContain("platform-name");
  });

  it("should display aggregate status summary in header", () => {
    render(<PlatformSection {...baseProps} />);

    // Should show "2/3 online" since 2 games are online and 1 is offline
    expect(screen.getByText(/2\/3 online/)).toBeInTheDocument();
  });

  it("should support expand/collapse functionality", () => {
    render(<PlatformSection {...baseProps} defaultExpanded={false} />);

    // Initially collapsed - game cards should not be visible
    expect(screen.queryByText("World of Warcraft")).not.toBeInTheDocument();

    // Click to expand
    const header = screen.getByRole("button");
    fireEvent.click(header);

    // Now game cards should be visible
    expect(screen.getByText("World of Warcraft")).toBeInTheDocument();
    expect(screen.getByText("Diablo IV")).toBeInTheDocument();
    expect(screen.getByText("Overwatch 2")).toBeInTheDocument();

    // Click to collapse again
    fireEvent.click(header);

    // Game cards should be hidden again
    expect(screen.queryByText("World of Warcraft")).not.toBeInTheDocument();
  });

  it("should show all game cards when expanded by default", () => {
    render(<PlatformSection {...baseProps} defaultExpanded />);

    // All games should be visible
    expect(screen.getByText("World of Warcraft")).toBeInTheDocument();
    expect(screen.getByText("Diablo IV")).toBeInTheDocument();
    expect(screen.getByText("Overwatch 2")).toBeInTheDocument();
  });

  describe("Favorites Sorting", () => {
    it("should sort favorites first when favorites data is provided", () => {
      const propsWithFavorites: PlatformSectionProps = {
        platform: "blizzard",
        games: [
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
            isFavorited: false,
          },
          {
            game: {
              _id: "game2",
              slug: "diablo-iv",
              displayName: "Diablo IV",
              platform: "blizzard",
              iconUrl: "https://example.com/d4.png",
              sortOrder: 2,
              isActive: true,
            },
            statusRecords: [
              {
                _id: "status2",
                status: "online",
                region: "global",
                lastCheckedAt: NOW - 60000,
                statusChangedAt: NOW - 3600000,
              },
            ],
            isFavorited: true, // This one is favorited
          },
        ],
      };

      render(<PlatformSection {...propsWithFavorites} defaultExpanded />);

      // Get all game card titles
      const gameCards = screen.getAllByTestId("game-card");
      expect(gameCards).toHaveLength(2);

      // Diablo IV (favorited) should appear first
      const titles = screen.getAllByRole("heading", { level: 3 });
      expect(titles[0]).toHaveTextContent("Diablo IV");
      expect(titles[1]).toHaveTextContent("World of Warcraft");
    });
  });
});
