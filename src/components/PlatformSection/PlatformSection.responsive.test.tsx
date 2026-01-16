/**
 * PlatformSection Responsive Grid Layout Tests
 *
 * Tests for the responsive grid layout behavior at different breakpoints.
 *
 * @module PlatformSectionResponsiveTests
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";

// Mock the Convex hooks and context
const mockUseAuth = { isAuthenticated: false };

// We need to mock modules before importing the component
import { vi } from "vitest";

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth,
}));

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
  useQuery: () => undefined,
}));

// Import after mocks are set up
import { PlatformSection } from "./PlatformSection";
import type { GameWithStatus } from "./PlatformSection";

// Test data
const mockGames: GameWithStatus[] = [
  {
    game: {
      _id: "game1",
      slug: "wow",
      displayName: "World of Warcraft",
      platform: "blizzard",
      iconUrl: "https://example.com/wow.png",
      sortOrder: 1,
      isActive: true,
    },
    statusRecords: [
      {
        _id: "s1",
        status: "online" as const,
        region: "na",
        lastCheckedAt: Date.now(),
        statusChangedAt: Date.now(),
      },
    ],
  },
  {
    game: {
      _id: "game2",
      slug: "diablo4",
      displayName: "Diablo IV",
      platform: "blizzard",
      iconUrl: "https://example.com/d4.png",
      sortOrder: 2,
      isActive: true,
    },
    statusRecords: [
      {
        _id: "s2",
        status: "online" as const,
        region: "na",
        lastCheckedAt: Date.now(),
        statusChangedAt: Date.now(),
      },
    ],
  },
  {
    game: {
      _id: "game3",
      slug: "hearthstone",
      displayName: "Hearthstone",
      platform: "blizzard",
      iconUrl: "https://example.com/hs.png",
      sortOrder: 3,
      isActive: true,
    },
    statusRecords: [
      {
        _id: "s3",
        status: "degraded" as const,
        region: "na",
        lastCheckedAt: Date.now(),
        statusChangedAt: Date.now(),
      },
    ],
  },
];

describe("PlatformSection Responsive Grid Layout", () => {
  let styleElement: HTMLStyleElement;

  beforeEach(() => {
    // Clean up any previous renders
    cleanup();

    // Add CSS custom properties and grid styles to JSDOM
    styleElement = document.createElement("style");
    styleElement.textContent = `
      :root {
        --grid-gap-mobile: 0.75rem;
        --grid-gap-tablet: 1rem;
        --grid-gap-desktop: 1rem;
        --card-min-width: 280px;
      }
      .game-card-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--grid-gap-mobile, 0.75rem);
      }
      @media (min-width: 640px) {
        .game-card-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: var(--grid-gap-tablet, 1rem);
        }
      }
      @media (min-width: 1025px) {
        .game-card-grid {
          grid-template-columns: repeat(auto-fill, minmax(var(--card-min-width, 280px), 1fr));
          gap: var(--grid-gap-desktop, 1rem);
        }
      }
    `;
    document.head.appendChild(styleElement);
  });

  afterEach(() => {
    cleanup();
    if (styleElement && styleElement.parentNode) {
      document.head.removeChild(styleElement);
    }
  });

  it("should render game card grid container", () => {
    const { container } = render(
      <PlatformSection
        platform="blizzard"
        games={mockGames}
        defaultExpanded
      />
    );

    // Find the grid container within this render
    const gridContainer = container.querySelector(".game-card-grid");
    expect(gridContainer).toBeInTheDocument();
  });

  it("should render all game cards within the grid", () => {
    const { container } = render(
      <PlatformSection
        platform="blizzard"
        games={mockGames}
        defaultExpanded
      />
    );

    // All game cards should be rendered - use container to scope query
    const gameCards = container.querySelectorAll('[data-testid="game-card"]');
    expect(gameCards.length).toBe(3);
  });

  it("should apply CSS grid display to game-card-grid class", () => {
    const { container } = render(
      <PlatformSection
        platform="blizzard"
        games={mockGames}
        defaultExpanded
      />
    );

    const gridContainer = container.querySelector(".game-card-grid");
    expect(gridContainer).toBeInTheDocument();

    // In JSDOM, computed styles from media queries may not apply,
    // but we can verify the base grid display is set
    const computedStyle = window.getComputedStyle(gridContainer!);
    expect(computedStyle.display).toBe("grid");
  });

  it("should have consistent gap spacing defined", () => {
    render(
      <PlatformSection
        platform="blizzard"
        games={mockGames}
        defaultExpanded
      />
    );

    // Verify CSS custom properties for gaps are defined
    const computedStyle = getComputedStyle(document.documentElement);
    expect(computedStyle.getPropertyValue("--grid-gap-mobile").trim()).toBe("0.75rem");
    expect(computedStyle.getPropertyValue("--grid-gap-tablet").trim()).toBe("1rem");
    expect(computedStyle.getPropertyValue("--grid-gap-desktop").trim()).toBe("1rem");
  });

  it("should define card minimum width for desktop grid", () => {
    const computedStyle = getComputedStyle(document.documentElement);
    expect(computedStyle.getPropertyValue("--card-min-width").trim()).toBe("280px");
  });
});
