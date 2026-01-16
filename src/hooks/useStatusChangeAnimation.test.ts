/**
 * Tests for useStatusChangeAnimation Hook
 *
 * Tests verify that the hook correctly detects status changes
 * and manages the animation state with proper timing.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStatusChangeAnimation } from "./useStatusChangeAnimation";
import type { Status } from "../components/StatusIndicator";

describe("useStatusChangeAnimation Hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not animate on initial render", () => {
    const { result } = renderHook(() => useStatusChangeAnimation("online"));

    expect(result.current.isAnimating).toBe(false);
  });

  it("should animate when status changes", () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: Status }) => useStatusChangeAnimation(status),
      { initialProps: { status: "online" as Status } }
    );

    // Initial render - no animation
    expect(result.current.isAnimating).toBe(false);

    // Change status
    rerender({ status: "offline" });

    // Should now be animating
    expect(result.current.isAnimating).toBe(true);
  });

  it("should clear animation after duration", () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: Status }) => useStatusChangeAnimation(status, { duration: 500 }),
      { initialProps: { status: "online" as Status } }
    );

    // Change status to trigger animation
    rerender({ status: "offline" });
    expect(result.current.isAnimating).toBe(true);

    // Advance time past animation duration
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Animation should be cleared
    expect(result.current.isAnimating).toBe(false);
  });

  it("should not animate when status stays the same", () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: Status }) => useStatusChangeAnimation(status),
      { initialProps: { status: "online" as Status } }
    );

    // Re-render with same status
    rerender({ status: "online" });

    // Should not be animating
    expect(result.current.isAnimating).toBe(false);
  });

  it("should handle rapid status changes", () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: Status }) => useStatusChangeAnimation(status, { duration: 600 }),
      { initialProps: { status: "online" as Status } }
    );

    // First status change
    rerender({ status: "offline" });
    expect(result.current.isAnimating).toBe(true);

    // Advance time partially
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Second status change before first animation completes
    rerender({ status: "degraded" });
    expect(result.current.isAnimating).toBe(true);

    // Advance time past second animation
    act(() => {
      vi.advanceTimersByTime(700);
    });

    // Animation should be cleared
    expect(result.current.isAnimating).toBe(false);
  });

  it("should use custom duration when provided", () => {
    const { result, rerender } = renderHook(
      ({ status }: { status: Status }) => useStatusChangeAnimation(status, { duration: 1000 }),
      { initialProps: { status: "online" as Status } }
    );

    // Change status to trigger animation
    rerender({ status: "offline" });
    expect(result.current.isAnimating).toBe(true);

    // Advance time less than custom duration
    act(() => {
      vi.advanceTimersByTime(800);
    });

    // Should still be animating
    expect(result.current.isAnimating).toBe(true);

    // Advance past custom duration
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Animation should be cleared
    expect(result.current.isAnimating).toBe(false);
  });
});
