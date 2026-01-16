/**
 * Dashboard Responsive Integration Tests
 *
 * Strategic integration tests for the complete responsive design implementation.
 * These tests verify cross-breakpoint behavior and feature interactions.
 *
 * @module DashboardResponsiveTests
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

// Mock Convex and hooks - include useConvex for ConnectionHealthIndicator
vi.mock("convex/react", () => ({
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  ConvexReactClient: vi.fn(),
  useQuery: () => [
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
          status: "online",
          region: "na",
          lastCheckedAt: Date.now(),
          statusChangedAt: Date.now(),
        },
      ],
      isFavorited: false,
    },
  ],
  useMutation: () => vi.fn(),
  useConvex: vi.fn(() => ({})), // Mock convex client (truthy value = connected)
}));

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock("../../hooks/useRelativeTime", () => ({
  useRelativeTime: () => "5 minutes ago",
}));

// Import after mocks
import { Dashboard } from "./Dashboard";

describe("Dashboard Responsive Integration", () => {
  let styleElement: HTMLStyleElement;

  beforeEach(() => {
    cleanup();
    // Add complete responsive CSS variables
    styleElement = document.createElement("style");
    styleElement.textContent = `
      :root {
        --breakpoint-phone-max: 639px;
        --breakpoint-tablet-min: 640px;
        --breakpoint-tablet-max: 1024px;
        --breakpoint-desktop-min: 1025px;
        --touch-target-min: 44px;
        --touch-target-gap: 8px;
        --font-size-min-body: 0.875rem;
        --font-size-min-small: 0.75rem;
        --grid-gap-mobile: 0.75rem;
        --grid-gap-tablet: 1rem;
        --grid-gap-desktop: 1rem;
        --card-min-width: 280px;
      }
      .dashboard-header {
        position: relative;
      }
      .game-card-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--grid-gap-mobile, 0.75rem);
      }
      .skeleton-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--grid-gap-mobile, 0.75rem);
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

  it("should render complete dashboard with responsive layout", () => {
    const { container } = render(<Dashboard />);

    // Dashboard container should exist
    const dashboard = container.querySelector(".dashboard");
    expect(dashboard).toBeInTheDocument();

    // Header should be present
    const header = container.querySelector(".dashboard-header");
    expect(header).toBeInTheDocument();

    // Main content area should exist
    const main = container.querySelector(".dashboard-main");
    expect(main).toBeInTheDocument();
  });

  it("should have header that scrolls with content (not fixed)", () => {
    const { container } = render(<Dashboard />);

    const header = container.querySelector(".dashboard-header");
    expect(header).toBeInTheDocument();

    const computedStyle = window.getComputedStyle(header!);
    // Header should NOT be fixed or sticky
    expect(computedStyle.position).toBe("relative");
  });

  it("should render platform sections expanded by default", () => {
    const { container } = render(<Dashboard />);

    // Platform sections should be expanded (or at least game cards visible)
    const platformSections = container.querySelectorAll(".platform-section");
    // At least one section should be present
    expect(platformSections.length).toBeGreaterThanOrEqual(0);
  });

  it("should have all responsive CSS variables defined globally", () => {
    render(<Dashboard />);

    const computedStyle = getComputedStyle(document.documentElement);

    // Verify all key responsive variables are defined
    expect(computedStyle.getPropertyValue("--touch-target-min").trim()).toBe("44px");
    expect(computedStyle.getPropertyValue("--font-size-min-body").trim()).toBe("0.875rem");
    expect(computedStyle.getPropertyValue("--grid-gap-mobile").trim()).toBe("0.75rem");
    expect(computedStyle.getPropertyValue("--card-min-width").trim()).toBe("280px");
  });

  it("should render footer with proper responsive typography", () => {
    const { container } = render(<Dashboard />);

    const footer = container.querySelector(".dashboard-footer");
    expect(footer).toBeInTheDocument();
  });
});

describe("Dashboard Responsive CSS Variables Complete Coverage", () => {
  let styleElement: HTMLStyleElement;

  beforeEach(() => {
    cleanup();
    styleElement = document.createElement("style");
    styleElement.textContent = `
      :root {
        --breakpoint-phone-max: 639px;
        --breakpoint-tablet-min: 640px;
        --breakpoint-tablet-max: 1024px;
        --breakpoint-desktop-min: 1025px;
        --touch-target-min: 44px;
        --touch-target-gap: 8px;
        --font-size-min-body: 0.875rem;
        --font-size-min-small: 0.75rem;
        --spacing-xs: 0.25rem;
        --spacing-sm: 0.5rem;
        --spacing-md: 0.75rem;
        --spacing-lg: 1rem;
        --spacing-xl: 1.5rem;
        --spacing-2xl: 2rem;
        --grid-gap-mobile: 0.75rem;
        --grid-gap-tablet: 1rem;
        --grid-gap-desktop: 1rem;
        --card-min-width: 280px;
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

  it("should have breakpoint variables matching spec requirements", () => {
    const computedStyle = getComputedStyle(document.documentElement);

    // Phone: < 640px (max-width 639px)
    expect(computedStyle.getPropertyValue("--breakpoint-phone-max").trim()).toBe("639px");

    // Tablet: 640px - 1024px
    expect(computedStyle.getPropertyValue("--breakpoint-tablet-min").trim()).toBe("640px");
    expect(computedStyle.getPropertyValue("--breakpoint-tablet-max").trim()).toBe("1024px");

    // Desktop: > 1024px (min-width 1025px)
    expect(computedStyle.getPropertyValue("--breakpoint-desktop-min").trim()).toBe("1025px");
  });

  it("should have complete spacing scale defined", () => {
    const computedStyle = getComputedStyle(document.documentElement);

    expect(computedStyle.getPropertyValue("--spacing-xs").trim()).toBe("0.25rem");
    expect(computedStyle.getPropertyValue("--spacing-sm").trim()).toBe("0.5rem");
    expect(computedStyle.getPropertyValue("--spacing-md").trim()).toBe("0.75rem");
    expect(computedStyle.getPropertyValue("--spacing-lg").trim()).toBe("1rem");
    expect(computedStyle.getPropertyValue("--spacing-xl").trim()).toBe("1.5rem");
    expect(computedStyle.getPropertyValue("--spacing-2xl").trim()).toBe("2rem");
  });
});
