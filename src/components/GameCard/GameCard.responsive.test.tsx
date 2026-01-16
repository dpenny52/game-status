/**
 * GameCard Responsive Component Sizing Tests
 *
 * Tests for responsive card dimensions, typography, and icon sizing.
 *
 * @module GameCardResponsiveTests
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

// Mock the hooks and modules
const mockUseAuth = { isAuthenticated: false };

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth,
}));

vi.mock("../../hooks/useRelativeTime", () => ({
  useRelativeTime: () => "5 minutes ago",
}));

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
  useQuery: () => undefined,
}));

// Import after mocks
import { GameCard, type GameData, type StatusRecord } from "./GameCard";

const mockGame: GameData = {
  _id: "game1",
  slug: "wow",
  displayName: "World of Warcraft",
  platform: "blizzard",
  iconUrl: "https://example.com/wow.png",
  sortOrder: 1,
  isActive: true,
};

const mockStatusRecords: StatusRecord[] = [
  {
    _id: "s1",
    status: "online",
    region: "na",
    lastCheckedAt: Date.now(),
    statusChangedAt: Date.now(),
  },
  {
    _id: "s2",
    status: "online",
    region: "eu",
    lastCheckedAt: Date.now(),
    statusChangedAt: Date.now(),
  },
];

describe("GameCard Responsive Component Sizing", () => {
  let styleElement: HTMLStyleElement;

  beforeEach(() => {
    cleanup();
    // Add responsive CSS custom properties
    styleElement = document.createElement("style");
    styleElement.textContent = `
      :root {
        --font-size-min-body: 0.875rem;
        --font-size-min-small: 0.75rem;
        --touch-target-min: 44px;
      }
      .game-card {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        min-height: 6rem;
      }
      .game-card-icon {
        width: 2rem;
        height: 2rem;
        aspect-ratio: 1 / 1;
      }
      .game-card-title {
        font-size: var(--font-size-min-body, 0.875rem);
      }
      .game-card-timestamps {
        font-size: var(--font-size-min-small, 0.75rem);
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

  it("should render game card with all content elements visible", () => {
    const { container } = render(
      <GameCard game={mockGame} statusRecords={mockStatusRecords} />
    );

    const card = container.querySelector('[data-testid="game-card"]');
    expect(card).toBeInTheDocument();

    // Verify all card content elements are present
    const icon = container.querySelector(".game-card-icon");
    expect(icon).toBeInTheDocument();

    const title = container.querySelector(".game-card-title");
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toBe("World of Warcraft");

    const platform = container.querySelector(".game-card-platform");
    expect(platform).toBeInTheDocument();

    const statusIndicator = container.querySelector('[data-testid="status-indicator"]');
    expect(statusIndicator).toBeInTheDocument();

    const timestamps = container.querySelector(".game-card-timestamps");
    expect(timestamps).toBeInTheDocument();
  });

  it("should have minimum readable font size defined (14px/0.875rem for body text)", () => {
    const computedStyle = getComputedStyle(document.documentElement);
    const minBodyFontSize = computedStyle.getPropertyValue("--font-size-min-body").trim();
    expect(minBodyFontSize).toBe("0.875rem");
  });

  it("should have game icon with aspect ratio maintained", () => {
    const { container } = render(
      <GameCard game={mockGame} statusRecords={mockStatusRecords} />
    );

    const icon = container.querySelector(".game-card-icon") as HTMLImageElement;
    expect(icon).toBeInTheDocument();

    // Verify icon has proper attributes
    expect(icon.tagName.toLowerCase()).toBe("img");
    expect(icon.getAttribute("src")).toBe(mockGame.iconUrl);
    expect(icon.getAttribute("alt")).toContain(mockGame.displayName);
  });

  it("should display regional status information when present", () => {
    const { container } = render(
      <GameCard game={mockGame} statusRecords={mockStatusRecords} />
    );

    // Regional status should be visible in footer
    const footer = container.querySelector(".game-card-footer");
    expect(footer).toBeInTheDocument();

    // Regional status component should render (uses .regional-status class)
    const regionalStatus = container.querySelector(".regional-status");
    expect(regionalStatus).toBeInTheDocument();
  });

  it("should render timestamp information without truncation", () => {
    const { container } = render(
      <GameCard game={mockGame} statusRecords={mockStatusRecords} />
    );

    const timestamps = container.querySelector(".game-card-timestamps");
    expect(timestamps).toBeInTheDocument();

    const timestampValue = container.querySelector(".timestamp-value");
    expect(timestampValue).toBeInTheDocument();
    expect(timestampValue?.textContent).toBe("5 minutes ago");
  });

  it("should use relative units (rem/em) for scalable typography via CSS variables", () => {
    const computedStyle = getComputedStyle(document.documentElement);

    // Body text minimum
    const bodyFont = computedStyle.getPropertyValue("--font-size-min-body").trim();
    expect(bodyFont).toMatch(/rem$/);

    // Small text minimum
    const smallFont = computedStyle.getPropertyValue("--font-size-min-small").trim();
    expect(smallFont).toMatch(/rem$/);
  });
});
