/**
 * Tests for Status Transition Detection
 *
 * These tests verify that the status transition detection system correctly
 * identifies offline-to-online transitions and ignores other transitions.
 */
import { describe, it, expect } from "vitest";
import { shouldTriggerAlert } from "../lib/transitionDetection";

describe("Status Transition Detection", () => {
  it("should trigger alert for offline to online transition", () => {
    const result = shouldTriggerAlert("offline", "online");
    expect(result).toBe(true);
  });

  it("should NOT trigger alert for online to offline transition", () => {
    const result = shouldTriggerAlert("online", "offline");
    expect(result).toBe(false);
  });

  it("should NOT trigger alert for degraded to online transition", () => {
    const result = shouldTriggerAlert("degraded", "online");
    expect(result).toBe(false);
  });

  it("should NOT trigger alert for maintenance to online transition", () => {
    const result = shouldTriggerAlert("maintenance", "online");
    expect(result).toBe(false);
  });

  it("should NOT trigger alert for unknown to online transition", () => {
    const result = shouldTriggerAlert("unknown", "online");
    expect(result).toBe(false);
  });

  it("should NOT trigger alert when status does not change", () => {
    const result = shouldTriggerAlert("online", "online");
    expect(result).toBe(false);
  });
});
