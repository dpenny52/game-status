/**
 * Tests for Dashboard Page
 *
 * Tests verify the dashboard renders header, platform sections, footer,
 * and connection health indicator.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Dashboard } from "./Dashboard";
import type { GameWithStatus } from "../../components/PlatformSection";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// Create mock functions for auth
const mockLogout = vi.fn();
const mockOpenLoginModal = vi.fn();

// Default to unauthenticated state
let mockAuthState = {
  isAuthenticated: false,
  user: null as { _id: string; displayName: string; email: string } | null,
  logout: mockLogout,
  openLoginModal: mockOpenLoginModal,
};

// Mock the auth hook - need to mock both paths since different components import from different locations
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => mockAuthState,
}));

// Also mock the context path that SubscriptionToggle uses
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

// Mock the Convex hooks - include useConvex for ConnectionHealthIndicator
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue(true)),
  useConvex: vi.fn(() => ({})), // Mock convex client (truthy value = connected)
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

  it("should display ConnectionHealthIndicator in header", () => {
    vi.mocked(useQuery).mockReturnValue(mockGamesData);

    render(<Dashboard />);

    // Connection indicator should be visible
    const connectionIndicator = screen.getByTestId("connection-health-indicator");
    expect(connectionIndicator).toBeInTheDocument();
    expect(connectionIndicator).toHaveAttribute("data-status", "connected");
  });

  it("should display auto-updating last updated timestamp in footer", () => {
    vi.mocked(useQuery).mockReturnValue(mockGamesData);

    render(<Dashboard />);

    // Footer should show last updated time
    const footerTimestamp = screen.getByText(/Last updated:/i);
    expect(footerTimestamp).toBeInTheDocument();
    // The footer should contain a relative timestamp
    expect(footerTimestamp.textContent).toContain("1 minute ago");
  });
});

describe("Dashboard Page - Authenticated User", () => {
  const NOW = new Date("2025-01-15T12:00:00Z").getTime();

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
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    mockLogout.mockClear();
    mockOpenLoginModal.mockClear();
    // Set authenticated state
    mockAuthState = {
      isAuthenticated: true,
      user: {
        _id: "test-user-id",
        displayName: "Test User",
        email: "test@example.com",
      },
      logout: mockLogout,
      openLoginModal: mockOpenLoginModal,
    };
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    // Reset to unauthenticated state
    mockAuthState = {
      isAuthenticated: false,
      user: null,
      logout: mockLogout,
      openLoginModal: mockOpenLoginModal,
    };
  });

  it("should display logout button for authenticated users", () => {
    vi.mocked(useQuery).mockReturnValue(mockGamesData);

    render(<Dashboard />);

    // Logout button should be visible
    const logoutButton = screen.getByTestId("dashboard-logout-button");
    expect(logoutButton).toBeInTheDocument();
    expect(logoutButton).toHaveTextContent("Log Out");
  });

  it("should display username for authenticated users", () => {
    vi.mocked(useQuery).mockReturnValue(mockGamesData);

    render(<Dashboard />);

    // Username should be visible
    const username = screen.getByTestId("dashboard-username");
    expect(username).toBeInTheDocument();
    expect(username).toHaveTextContent("Test User");
  });

  it("should call logout when logout button is clicked", () => {
    vi.mocked(useQuery).mockReturnValue(mockGamesData);

    render(<Dashboard />);

    // Click logout button
    const logoutButton = screen.getByTestId("dashboard-logout-button");
    fireEvent.click(logoutButton);

    // Verify logout was called
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("should not show Sign In button for authenticated users", () => {
    vi.mocked(useQuery).mockReturnValue(mockGamesData);

    render(<Dashboard />);

    // Sign In button should not be present
    expect(screen.queryByTestId("dashboard-login-button")).not.toBeInTheDocument();
  });

  it("should show logout button in loading state for authenticated users", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);

    render(<Dashboard />);

    // Logout button should still be visible in loading state
    const logoutButton = screen.getByTestId("dashboard-logout-button");
    expect(logoutButton).toBeInTheDocument();
  });

  it("should show logout button in empty state for authenticated users", () => {
    vi.mocked(useQuery).mockReturnValue([]);

    render(<Dashboard />);

    // Logout button should still be visible in empty state
    const logoutButton = screen.getByTestId("dashboard-logout-button");
    expect(logoutButton).toBeInTheDocument();
  });

  it("should have proper aria-label for accessibility", () => {
    vi.mocked(useQuery).mockReturnValue(mockGamesData);

    render(<Dashboard />);

    const logoutButton = screen.getByTestId("dashboard-logout-button");
    expect(logoutButton).toHaveAttribute("aria-label", "Log out");
  });
});
