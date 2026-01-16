/**
 * Tests for Timestamp Formatting Utilities
 *
 * Tests verify that timestamp formatting functions correctly format
 * relative and absolute time displays.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatRelativeTime,
  formatAbsoluteTime,
  shouldUseRelative,
} from "./timeFormat";

describe("Timestamp Formatting Utilities", () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("formatRelativeTime", () => {
    it('should return "just now" for very recent updates', () => {
      const now = Date.now();
      expect(formatRelativeTime(now)).toBe("just now");
      expect(formatRelativeTime(now - 30000)).toBe("just now"); // 30 seconds ago
    });

    it("should return minutes ago for recent updates", () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 60000)).toBe("1 minute ago");
      expect(formatRelativeTime(now - 120000)).toBe("2 minutes ago");
      expect(formatRelativeTime(now - 300000)).toBe("5 minutes ago");
    });

    it("should return hours ago for older updates", () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 3600000)).toBe("1 hour ago");
      expect(formatRelativeTime(now - 7200000)).toBe("2 hours ago");
      expect(formatRelativeTime(now - 23 * 3600000)).toBe("23 hours ago");
    });
  });

  describe("formatAbsoluteTime", () => {
    it("should return formatted date with timezone context", () => {
      const timestamp = new Date("2025-01-14T10:30:00Z").getTime();
      const result = formatAbsoluteTime(timestamp);

      // Should include date components
      expect(result).toMatch(/Jan/);
      expect(result).toMatch(/14/);
      // Should include time
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe("shouldUseRelative", () => {
    it("should return true for timestamps less than 24 hours old", () => {
      const now = Date.now();
      expect(shouldUseRelative(now)).toBe(true);
      expect(shouldUseRelative(now - 60000)).toBe(true); // 1 minute ago
      expect(shouldUseRelative(now - 3600000)).toBe(true); // 1 hour ago
      expect(shouldUseRelative(now - 23 * 3600000)).toBe(true); // 23 hours ago
    });

    it("should return false for timestamps older than 24 hours", () => {
      const now = Date.now();
      expect(shouldUseRelative(now - 25 * 3600000)).toBe(false); // 25 hours ago
      expect(shouldUseRelative(now - 48 * 3600000)).toBe(false); // 48 hours ago
      expect(shouldUseRelative(now - 7 * 24 * 3600000)).toBe(false); // 7 days ago
    });
  });
});
