/**
 * Tests for Notification Preferences Component
 *
 * These tests verify the notification preferences UI renders correctly
 * and handles user interactions properly.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { NotificationPreferences } from "./NotificationPreferences";
import type { AlertSubscription } from "./NotificationPreferences";

// Mock data
const mockSubscriptions: AlertSubscription[] = [
  {
    _id: "sub1",
    userId: "user1",
    gameId: "game1",
    region: "na",
    isActive: true,
    gameName: "World of Warcraft",
    lastAlertSentAt: null,
  },
  {
    _id: "sub2",
    userId: "user1",
    gameId: "game2",
    region: "eu",
    isActive: false,
    gameName: "Diablo IV",
    lastAlertSentAt: Date.now() - 30 * 60 * 1000,
  },
];

const mockGames = [
  { _id: "game1", displayName: "World of Warcraft" },
  { _id: "game2", displayName: "Diablo IV" },
  { _id: "game3", displayName: "Overwatch 2" },
];

// Mock handlers
const mockOnToggle = vi.fn();
const mockOnAdd = vi.fn();
const mockOnDelete = vi.fn();

describe("NotificationPreferences Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should display subscription list with game name, region, and status", () => {
    render(
      <NotificationPreferences
        subscriptions={mockSubscriptions}
        games={mockGames}
        onToggle={mockOnToggle}
        onAdd={mockOnAdd}
        onDelete={mockOnDelete}
        isLoading={false}
      />
    );

    // Check game names are displayed
    expect(screen.getByText("World of Warcraft")).toBeInTheDocument();
    expect(screen.getByText("Diablo IV")).toBeInTheDocument();

    // Check regions are displayed (uppercase)
    expect(screen.getByText("NA")).toBeInTheDocument();
    expect(screen.getByText("EU")).toBeInTheDocument();
  });

  it("should show empty state when no subscriptions exist", () => {
    render(
      <NotificationPreferences
        subscriptions={[]}
        games={mockGames}
        onToggle={mockOnToggle}
        onAdd={mockOnAdd}
        onDelete={mockOnDelete}
        isLoading={false}
      />
    );

    expect(screen.getByText(/no alert subscriptions/i)).toBeInTheDocument();
  });

  it("should call onToggle when toggle is clicked", async () => {
    render(
      <NotificationPreferences
        subscriptions={mockSubscriptions}
        games={mockGames}
        onToggle={mockOnToggle}
        onAdd={mockOnAdd}
        onDelete={mockOnDelete}
        isLoading={false}
      />
    );

    // Find the first toggle button
    const toggleButtons = screen.getAllByRole("switch");
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalledWith("sub1", false);
    });
  });

  it("should show loading state", () => {
    render(
      <NotificationPreferences
        subscriptions={[]}
        games={[]}
        onToggle={mockOnToggle}
        onAdd={mockOnAdd}
        onDelete={mockOnDelete}
        isLoading={true}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should display add subscription button", () => {
    const { container } = render(
      <NotificationPreferences
        subscriptions={mockSubscriptions}
        games={mockGames}
        onToggle={mockOnToggle}
        onAdd={mockOnAdd}
        onDelete={mockOnDelete}
        isLoading={false}
      />
    );

    // Use container query to find the specific button within this render
    const addButton = container.querySelector(".notification-btn-add");
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent(/add/i);
  });
});
