/**
 * Tests for RelativeTime Component
 *
 * Tests verify that RelativeTime displays timestamps correctly
 * and auto-updates at appropriate intervals.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import { RelativeTime } from "./RelativeTime";

describe("RelativeTime Component", () => {
  // Fixed timestamp for consistent testing
  const NOW = new Date("2025-01-15T12:00:00Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('should display "just now" for timestamps under 1 minute old', () => {
    render(<RelativeTime timestamp={NOW - 30000} />); // 30 seconds ago

    expect(screen.getByTestId("relative-time")).toHaveTextContent("just now");
  });

  it('should display relative format for recent timestamps (e.g., "X minutes ago")', () => {
    render(<RelativeTime timestamp={NOW - 120000} />); // 2 minutes ago

    expect(screen.getByTestId("relative-time")).toHaveTextContent("2 minutes ago");
  });

  it('should display relative format for hours (e.g., "X hours ago")', () => {
    render(<RelativeTime timestamp={NOW - 3600000} />); // 1 hour ago

    expect(screen.getByTestId("relative-time")).toHaveTextContent("1 hour ago");
  });

  it("should display absolute format for timestamps older than 24 hours", () => {
    const oldTimestamp = NOW - 25 * 3600000; // 25 hours ago
    render(<RelativeTime timestamp={oldTimestamp} />);

    const content = screen.getByTestId("relative-time").textContent;
    // Should contain a month abbreviation for absolute format
    expect(content).toMatch(/Jan/);
  });

  it("should display fallback text for null/undefined timestamps", () => {
    render(<RelativeTime timestamp={null} fallback="Not available" />);

    expect(screen.getByTestId("relative-time")).toHaveTextContent("Not available");
  });

  it('should display default fallback "Never" when no custom fallback provided', () => {
    render(<RelativeTime timestamp={undefined} />);

    expect(screen.getByTestId("relative-time")).toHaveTextContent("Never");
  });

  it("should auto-update displayed time via interval", async () => {
    // Start at 30 seconds ago (should show "just now")
    const timestamp = NOW - 30000;
    render(<RelativeTime timestamp={timestamp} />);

    expect(screen.getByTestId("relative-time")).toHaveTextContent("just now");

    // Advance time by 40 seconds (now 70 seconds old = 1 minute ago)
    await act(async () => {
      vi.advanceTimersByTime(40000);
    });

    // After 70 seconds total, should show "1 minute ago"
    expect(screen.getByTestId("relative-time")).toHaveTextContent("1 minute ago");
  });

  it("should include datetime attribute when timestamp is provided", () => {
    const timestamp = NOW - 60000;
    render(<RelativeTime timestamp={timestamp} />);

    const timeElement = screen.getByTestId("relative-time");
    expect(timeElement).toHaveAttribute("datetime");
    expect(timeElement.getAttribute("datetime")).toBe(new Date(timestamp).toISOString());
  });

  it("should not include datetime attribute when timestamp is null", () => {
    render(<RelativeTime timestamp={null} />);

    const timeElement = screen.getByTestId("relative-time");
    expect(timeElement).not.toHaveAttribute("datetime");
  });
});
