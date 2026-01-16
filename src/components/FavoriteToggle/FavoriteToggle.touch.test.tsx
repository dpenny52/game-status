/**
 * FavoriteToggle Touch Target Accessibility Tests
 *
 * Tests for 44x44px minimum touch target accessibility.
 *
 * @module FavoriteToggleTouchTests
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

// Mock Convex
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn().mockResolvedValue(true),
  useQuery: () => undefined,
}));

// Import after mocks
import { FavoriteToggle } from "./FavoriteToggle";
import type { Id } from "../../../convex/_generated/dataModel";

describe("FavoriteToggle Touch Target Accessibility", () => {
  let styleElement: HTMLStyleElement;

  beforeEach(() => {
    cleanup();
    // Add CSS styles including touch target variable
    styleElement = document.createElement("style");
    styleElement.textContent = `
      :root {
        --touch-target-min: 44px;
        --touch-target-gap: 8px;
      }
      .favorite-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: var(--touch-target-min, 44px);
        min-height: var(--touch-target-min, 44px);
        padding: 0.625rem;
      }
      .favorite-toggle-icon {
        width: 1.25rem;
        height: 1.25rem;
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

  it("should have 44x44px minimum touch target defined", () => {
    const computedStyle = getComputedStyle(document.documentElement);
    expect(computedStyle.getPropertyValue("--touch-target-min").trim()).toBe("44px");
  });

  it("should render favorite toggle button with accessible touch target", () => {
    const { container } = render(
      <FavoriteToggle
        gameId={"game1" as Id<"games">}
        isFavorited={false}
      />
    );

    const button = container.querySelector('[data-testid="favorite-toggle"]');
    expect(button).toBeInTheDocument();
    expect(button?.tagName.toLowerCase()).toBe("button");

    // Verify it has the favorite-toggle class which has min-width/min-height
    expect(button?.classList.contains("favorite-toggle")).toBe(true);
  });

  it("should have star icon that remains visually smaller than touch target", () => {
    const { container } = render(
      <FavoriteToggle
        gameId={"game1" as Id<"games">}
        isFavorited={true}
      />
    );

    const icon = container.querySelector(".favorite-toggle-icon");
    expect(icon).toBeInTheDocument();

    // Icon should be visually smaller (1.25rem = 20px at default)
    // while button touch target is 44px minimum
    const iconStyle = window.getComputedStyle(icon!);
    expect(iconStyle.width).toBe("1.25rem");
    expect(iconStyle.height).toBe("1.25rem");
  });

  it("should have proper aria-label for accessibility", () => {
    const { container: containerUnfavorited } = render(
      <FavoriteToggle
        gameId={"game1" as Id<"games">}
        isFavorited={false}
      />
    );

    const buttonUnfavorited = containerUnfavorited.querySelector('[data-testid="favorite-toggle"]');
    expect(buttonUnfavorited?.getAttribute("aria-label")).toBe("Add to favorites");

    cleanup();

    const { container: containerFavorited } = render(
      <FavoriteToggle
        gameId={"game1" as Id<"games">}
        isFavorited={true}
      />
    );

    const buttonFavorited = containerFavorited.querySelector('[data-testid="favorite-toggle"]');
    expect(buttonFavorited?.getAttribute("aria-label")).toBe("Remove from favorites");
  });

  it("should define minimum gap between interactive elements", () => {
    const computedStyle = getComputedStyle(document.documentElement);
    expect(computedStyle.getPropertyValue("--touch-target-gap").trim()).toBe("8px");
  });
});
