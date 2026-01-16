/**
 * Tests for GameCard Component
 *
 * Tests verify that GameCard displays game information, status,
 * timestamps, and favorites correctly.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { GameCard } from "./GameCard";
import type { GameCardProps } from "./GameCard";
import type { Id } from "../../../convex/_generated/dataModel";

// Mock the auth hook (used by GameCard)
const mockUseAuth = vi.fn();
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the auth context (used by SubscriptionToggle)
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock the useMutation and useQuery hooks from convex
vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn().mockResolvedValue(true)),
  useQuery: vi.fn(() => null),
}));

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
    vi.clearAllMocks();
    // Default to not authenticated
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
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

  describe("Favorites Integration", () => {
    const mockGameId = "game_123" as Id<"games">;

    it("should render FavoriteToggle when authenticated and gameId is provided", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { _id: "user_123", email: "test@example.com", displayName: "Test" },
      });

      render(
        <GameCard
          {...baseProps}
          gameId={mockGameId}
          isFavorited={false}
        />
      );

      // Check that FavoriteToggle is rendered
      const favoriteToggle = screen.queryByTestId("favorite-toggle");
      expect(favoriteToggle).toBeInTheDocument();
    });

    it("should hide FavoriteToggle when not authenticated", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(
        <GameCard
          {...baseProps}
          gameId={mockGameId}
          isFavorited={false}
        />
      );

      // Check that FavoriteToggle is NOT rendered
      const favoriteToggle = screen.queryByTestId("favorite-toggle");
      expect(favoriteToggle).not.toBeInTheDocument();
    });

    it("should display favorited styling when isFavorited is true", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { _id: "user_123", email: "test@example.com", displayName: "Test" },
      });

      render(
        <GameCard
          {...baseProps}
          gameId={mockGameId}
          isFavorited={true}
        />
      );

      const card = screen.getByTestId("game-card");
      expect(card).toHaveClass("game-card-favorited");
    });

    it("should not have favorited styling when isFavorited is false", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { _id: "user_123", email: "test@example.com", displayName: "Test" },
      });

      render(
        <GameCard
          {...baseProps}
          gameId={mockGameId}
          isFavorited={false}
        />
      );

      const card = screen.getByTestId("game-card");
      expect(card).not.toHaveClass("game-card-favorited");
    });

    it("should not show favorited styling for anonymous users", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      render(
        <GameCard
          {...baseProps}
          gameId={mockGameId}
          isFavorited={true}
        />
      );

      const card = screen.getByTestId("game-card");
      expect(card).not.toHaveClass("game-card-favorited");
    });

    it("should work without gameId prop (backward compatibility)", () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: { _id: "user_123", email: "test@example.com", displayName: "Test" },
      });

      render(<GameCard {...baseProps} />);

      const card = screen.getByTestId("game-card");
      expect(card).toBeInTheDocument();

      // Should not have favorited styling
      expect(card).not.toHaveClass("game-card-favorited");

      // Should not have favorite toggle
      const favoriteToggle = screen.queryByTestId("favorite-toggle");
      expect(favoriteToggle).not.toBeInTheDocument();
    });
  });
});
