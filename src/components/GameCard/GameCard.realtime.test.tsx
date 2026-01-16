/**
 * Tests for GameCard Real-Time Features
 *
 * Tests verify that GameCard correctly integrates status change animation,
 * stale data indicators, and auto-updating timestamps.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { GameCard } from "./GameCard";
import type { GameCardProps, StatusRecord } from "./GameCard";

// Mock the auth hook
const mockUseAuth = vi.fn();
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock convex hooks
vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn().mockResolvedValue(true)),
  useQuery: vi.fn(() => null),
}));

describe("GameCard Real-Time Features", () => {
  const NOW = new Date("2025-01-15T12:00:00Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const createBaseProps = (statusRecords: StatusRecord[]): GameCardProps => ({
    game: {
      _id: "game1",
      slug: "world-of-warcraft",
      displayName: "World of Warcraft",
      platform: "blizzard",
      iconUrl: "https://example.com/wow.png",
      sortOrder: 1,
      isActive: true,
    },
    statusRecords,
  });

  describe("Auto-updating RelativeTime", () => {
    it("should display relative time for lastCheckedAt", () => {
      const props = createBaseProps([
        {
          _id: "s1",
          status: "online",
          region: "na",
          lastCheckedAt: NOW - 120000, // 2 minutes ago
          statusChangedAt: NOW - 3600000,
        },
      ]);

      render(<GameCard {...props} />);

      const timestampContainer = screen.getByText(/Last checked:/).closest(".game-card-timestamp");
      expect(timestampContainer?.textContent).toContain("2 minutes ago");
    });
  });

  describe("Status Change Animation", () => {
    it("should not have animation class on initial render", () => {
      const props = createBaseProps([
        {
          _id: "s1",
          status: "online",
          region: "na",
          lastCheckedAt: NOW - 60000,
          statusChangedAt: NOW - 3600000,
        },
      ]);

      render(<GameCard {...props} />);

      const card = screen.getByTestId("game-card");
      expect(card).not.toHaveClass("game-card-status-changed");
      expect(card).not.toHaveAttribute("data-animating", "true");
    });

    it("should apply animation class when status changes", () => {
      const onlineRecord: StatusRecord = {
        _id: "s1",
        status: "online",
        region: "na",
        lastCheckedAt: NOW - 60000,
        statusChangedAt: NOW - 3600000,
      };

      const offlineRecord: StatusRecord = {
        _id: "s1",
        status: "offline",
        region: "na",
        lastCheckedAt: NOW - 60000,
        statusChangedAt: NOW,
      };

      const { rerender } = render(<GameCard {...createBaseProps([onlineRecord])} />);

      // Initial render - no animation
      let card = screen.getByTestId("game-card");
      expect(card).not.toHaveClass("game-card-status-changed");

      // Status changes to offline
      rerender(<GameCard {...createBaseProps([offlineRecord])} />);

      // Should now have animation class
      card = screen.getByTestId("game-card");
      expect(card).toHaveClass("game-card-status-changed");
      expect(card).toHaveAttribute("data-animating", "true");
    });

    it("should remove animation class after duration", () => {
      const onlineRecord: StatusRecord = {
        _id: "s1",
        status: "online",
        region: "na",
        lastCheckedAt: NOW - 60000,
        statusChangedAt: NOW - 3600000,
      };

      const offlineRecord: StatusRecord = {
        _id: "s1",
        status: "offline",
        region: "na",
        lastCheckedAt: NOW - 60000,
        statusChangedAt: NOW,
      };

      const { rerender } = render(<GameCard {...createBaseProps([onlineRecord])} />);

      // Status changes
      rerender(<GameCard {...createBaseProps([offlineRecord])} />);

      // Should be animating
      expect(screen.getByTestId("game-card")).toHaveClass("game-card-status-changed");

      // Advance past animation duration (600ms)
      act(() => {
        vi.advanceTimersByTime(700);
      });

      // Animation should be cleared
      expect(screen.getByTestId("game-card")).not.toHaveClass("game-card-status-changed");
    });
  });

  describe("Stale Data Indicator", () => {
    it("should apply stale styling when data is older than 10 minutes", () => {
      const props = createBaseProps([
        {
          _id: "s1",
          status: "online",
          region: "na",
          lastCheckedAt: NOW - 11 * 60 * 1000, // 11 minutes ago
          statusChangedAt: NOW - 3600000,
        },
      ]);

      render(<GameCard {...props} />);

      const card = screen.getByTestId("game-card");
      expect(card).toHaveClass("game-card-stale");
      expect(card).toHaveAttribute("data-stale", "true");
    });

    it("should not apply stale styling when data is within 10 minutes", () => {
      const props = createBaseProps([
        {
          _id: "s1",
          status: "online",
          region: "na",
          lastCheckedAt: NOW - 5 * 60 * 1000, // 5 minutes ago
          statusChangedAt: NOW - 3600000,
        },
      ]);

      render(<GameCard {...props} />);

      const card = screen.getByTestId("game-card");
      expect(card).not.toHaveClass("game-card-stale");
    });

    it("should display stale indicator icon when data is stale", () => {
      const props = createBaseProps([
        {
          _id: "s1",
          status: "online",
          region: "na",
          lastCheckedAt: NOW - 15 * 60 * 1000, // 15 minutes ago
          statusChangedAt: NOW - 3600000,
        },
      ]);

      render(<GameCard {...props} />);

      const staleIndicator = screen.getByTitle("Data may be outdated");
      expect(staleIndicator).toBeInTheDocument();
    });

    it("should clear stale styling when fresh data arrives via re-render", () => {
      const staleRecord: StatusRecord = {
        _id: "s1",
        status: "online",
        region: "na",
        lastCheckedAt: NOW - 15 * 60 * 1000, // 15 minutes ago
        statusChangedAt: NOW - 3600000,
      };

      const freshRecord: StatusRecord = {
        _id: "s1",
        status: "online",
        region: "na",
        lastCheckedAt: NOW - 30000, // 30 seconds ago (fresh!)
        statusChangedAt: NOW - 3600000,
      };

      const { rerender } = render(<GameCard {...createBaseProps([staleRecord])} />);

      // Initially stale
      expect(screen.getByTestId("game-card")).toHaveClass("game-card-stale");

      // Fresh data arrives
      rerender(<GameCard {...createBaseProps([freshRecord])} />);

      // Should no longer be stale
      expect(screen.getByTestId("game-card")).not.toHaveClass("game-card-stale");
    });
  });

  describe("Convex Reactivity Integration", () => {
    it("should update UI when statusRecords prop changes (simulating Convex subscription)", () => {
      const initialRecord: StatusRecord = {
        _id: "s1",
        status: "online",
        region: "na",
        lastCheckedAt: NOW - 60000,
        statusChangedAt: NOW - 3600000,
      };

      const updatedRecord: StatusRecord = {
        _id: "s1",
        status: "degraded",
        region: "na",
        lastCheckedAt: NOW - 30000,
        statusChangedAt: NOW,
        statusMessage: "Performance issues detected",
      };

      const { rerender } = render(<GameCard {...createBaseProps([initialRecord])} />);

      // Initially online
      expect(screen.getByTestId("game-card")).toHaveAttribute("data-status", "online");

      // Convex subscription pushes new data
      rerender(<GameCard {...createBaseProps([updatedRecord])} />);

      // Should reflect new status
      expect(screen.getByTestId("game-card")).toHaveAttribute("data-status", "degraded");
      expect(screen.getByText("Performance issues detected")).toBeInTheDocument();
    });
  });
});
