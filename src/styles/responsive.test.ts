/**
 * Responsive Breakpoint System Tests
 *
 * Tests for the mobile-first breakpoint CSS variable system.
 *
 * @module ResponsiveTests
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("Responsive Breakpoint System", () => {
  let styleElement: HTMLStyleElement;

  beforeAll(() => {
    // Import the responsive CSS by creating a style element
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

  afterAll(() => {
    document.head.removeChild(styleElement);
  });

  it("should define breakpoint CSS variables", () => {
    const computedStyle = getComputedStyle(document.documentElement);

    expect(computedStyle.getPropertyValue("--breakpoint-phone-max").trim()).toBe("639px");
    expect(computedStyle.getPropertyValue("--breakpoint-tablet-min").trim()).toBe("640px");
    expect(computedStyle.getPropertyValue("--breakpoint-tablet-max").trim()).toBe("1024px");
    expect(computedStyle.getPropertyValue("--breakpoint-desktop-min").trim()).toBe("1025px");
  });

  it("should define touch target accessibility variables", () => {
    const computedStyle = getComputedStyle(document.documentElement);

    expect(computedStyle.getPropertyValue("--touch-target-min").trim()).toBe("44px");
    expect(computedStyle.getPropertyValue("--touch-target-gap").trim()).toBe("8px");
  });

  it("should define typography minimum size variables", () => {
    const computedStyle = getComputedStyle(document.documentElement);

    const bodyFontSize = computedStyle.getPropertyValue("--font-size-min-body").trim();
    expect(bodyFontSize).toBe("0.875rem");
    // 0.875rem = 14px at default 16px root
  });

  it("should define spacing scale variables for mobile-first approach", () => {
    const computedStyle = getComputedStyle(document.documentElement);

    expect(computedStyle.getPropertyValue("--spacing-xs").trim()).toBe("0.25rem");
    expect(computedStyle.getPropertyValue("--spacing-sm").trim()).toBe("0.5rem");
    expect(computedStyle.getPropertyValue("--spacing-md").trim()).toBe("0.75rem");
    expect(computedStyle.getPropertyValue("--spacing-lg").trim()).toBe("1rem");
    expect(computedStyle.getPropertyValue("--spacing-xl").trim()).toBe("1.5rem");
    expect(computedStyle.getPropertyValue("--spacing-2xl").trim()).toBe("2rem");
  });
});
