/**
 * Tests for useStaleData Hook
 *
 * Tests verify that the hook correctly determines data staleness
 * based on timestamp age and updates over time.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStaleData } from "./useStaleData";

describe("useStaleData Hook", () => {
  const NOW = new Date("2025-01-15T12:00:00Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return stale=true when data is older than 10 minutes", () => {
    // 11 minutes ago
    const oldTimestamp = NOW - 11 * 60 * 1000;

    const { result } = renderHook(() => useStaleData(oldTimestamp));

    expect(result.current.isStale).toBe(true);
    expect(result.current.minutesOld).toBe(11);
  });

  it("should return stale=false when data is within 10 minutes", () => {
    // 5 minutes ago
    const recentTimestamp = NOW - 5 * 60 * 1000;

    const { result } = renderHook(() => useStaleData(recentTimestamp));

    expect(result.current.isStale).toBe(false);
    expect(result.current.minutesOld).toBe(5);
  });

  it("should handle null timestamp gracefully", () => {
    const { result } = renderHook(() => useStaleData(null));

    expect(result.current.isStale).toBe(false);
    expect(result.current.minutesOld).toBe(null);
  });

  it("should handle undefined timestamp gracefully", () => {
    const { result } = renderHook(() => useStaleData(undefined));

    expect(result.current.isStale).toBe(false);
    expect(result.current.minutesOld).toBe(null);
  });

  it("should use custom threshold when provided", () => {
    // 7 minutes ago - stale with 5 minute threshold, not stale with 10 minute
    const timestamp = NOW - 7 * 60 * 1000;

    const { result: resultDefault } = renderHook(() => useStaleData(timestamp));
    const { result: resultCustom } = renderHook(() =>
      useStaleData(timestamp, { thresholdMinutes: 5 })
    );

    // Default 10 minute threshold - not stale
    expect(resultDefault.current.isStale).toBe(false);

    // Custom 5 minute threshold - stale
    expect(resultCustom.current.isStale).toBe(true);
  });

  it("should update stale state when fresh data arrives", () => {
    // Start with stale data (15 minutes ago)
    const staleTimestamp = NOW - 15 * 60 * 1000;

    const { result, rerender } = renderHook(
      ({ timestamp }: { timestamp: number | null }) => useStaleData(timestamp),
      { initialProps: { timestamp: staleTimestamp } }
    );

    // Initially stale
    expect(result.current.isStale).toBe(true);

    // Fresh data arrives (1 minute ago)
    const freshTimestamp = NOW - 1 * 60 * 1000;
    rerender({ timestamp: freshTimestamp });

    // Should no longer be stale
    expect(result.current.isStale).toBe(false);
    expect(result.current.minutesOld).toBe(1);
  });

  it("should detect when data becomes stale over time via interval", () => {
    // Start with fresh data (9 minutes ago, just under threshold)
    const timestamp = NOW - 9 * 60 * 1000;

    const { result } = renderHook(() => useStaleData(timestamp));

    // Initially not stale
    expect(result.current.isStale).toBe(false);

    // Advance time by 2 minutes (data is now 11 minutes old)
    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000);
    });

    // Should now be stale
    expect(result.current.isStale).toBe(true);
    expect(result.current.minutesOld).toBe(11);
  });
});
