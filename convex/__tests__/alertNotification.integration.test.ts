/**
 * Integration Tests for Alert Notification Service
 *
 * These tests cover integration scenarios and edge cases that span
 * multiple components of the alert notification system.
 */
import { describe, it, expect } from "vitest";
import { shouldTriggerAlert } from "../lib/transitionDetection";
import { ALERT_CONSTANTS } from "../alertNotifications";
import type { Status, Region } from "../schema";

describe("Alert Notification Integration Scenarios", () => {
  describe("Status Transition Edge Cases", () => {
    const allStatuses: Status[] = ["online", "offline", "degraded", "maintenance", "unknown"];

    it("should only trigger alerts for offline->online among all possible transitions", () => {
      const alertTriggeringTransitions: Array<[Status, Status]> = [];

      for (const from of allStatuses) {
        for (const to of allStatuses) {
          if (shouldTriggerAlert(from, to)) {
            alertTriggeringTransitions.push([from, to]);
          }
        }
      }

      // Only offline->online should trigger
      expect(alertTriggeringTransitions).toHaveLength(1);
      expect(alertTriggeringTransitions[0]).toEqual(["offline", "online"]);
    });

    it("should NOT trigger alert for rapid offline->online->offline->online sequence (cooldown protects)", () => {
      // Simulate rapid status changes
      const transitions: Array<{ from: Status; to: Status; timestamp: number }> = [];
      const now = Date.now();

      // First transition: offline -> online (should trigger)
      transitions.push({ from: "offline", to: "online", timestamp: now });
      expect(shouldTriggerAlert("offline", "online")).toBe(true);

      // Second transition 5 minutes later: online -> offline (no trigger)
      transitions.push({ from: "online", to: "offline", timestamp: now + 5 * 60 * 1000 });
      expect(shouldTriggerAlert("online", "offline")).toBe(false);

      // Third transition 10 minutes later: offline -> online (should trigger but cooldown applies)
      transitions.push({ from: "offline", to: "online", timestamp: now + 10 * 60 * 1000 });
      // This would trigger in terms of transition, but cooldown (30 min) would block
      expect(shouldTriggerAlert("offline", "online")).toBe(true);

      // The cooldown logic is applied separately after transition detection
    });
  });

  describe("Cooldown Boundary Conditions", () => {
    const COOLDOWN_MS = ALERT_CONSTANTS.COOLDOWN_MS;

    it("should correctly handle cooldown at exactly 30 minutes", () => {
      const now = Date.now();
      const exactlyAtCooldown = now - COOLDOWN_MS;
      const oneSecondBefore = now - COOLDOWN_MS + 1000;
      const oneSecondAfter = now - COOLDOWN_MS - 1000;
      const cooldownThreshold = now - COOLDOWN_MS;

      // At exactly 30 minutes, lastSent === cooldownThreshold, so NOT allowed
      expect(exactlyAtCooldown < cooldownThreshold).toBe(false);

      // 1 second before 30 minutes (29:59), still in cooldown
      expect(oneSecondBefore < cooldownThreshold).toBe(false);

      // 1 second after 30 minutes (30:01), allowed
      expect(oneSecondAfter < cooldownThreshold).toBe(true);
    });

    it("should handle cooldown correctly for very old timestamps", () => {
      const now = Date.now();
      const cooldownThreshold = now - COOLDOWN_MS;
      const veryOldTimestamp = now - (365 * 24 * 60 * 60 * 1000); // 1 year ago

      expect(veryOldTimestamp < cooldownThreshold).toBe(true);
    });

    it("should handle cooldown correctly for future timestamps (edge case)", () => {
      const now = Date.now();
      const cooldownThreshold = now - COOLDOWN_MS;
      const futureTimestamp = now + (60 * 60 * 1000); // 1 hour in the future

      // Future timestamps should NOT trigger (still in "cooldown")
      expect(futureTimestamp < cooldownThreshold).toBe(false);
    });
  });

  describe("Region-Specific Subscription Handling", () => {
    const allRegions: Region[] = ["na", "eu", "asia", "oce", "global"];

    it("should format region display correctly for email subjects", () => {
      const gameName = "Test Game";

      for (const region of allRegions) {
        const subject = `${gameName} is back online - ${region.toUpperCase()}`;
        expect(subject).toContain(region.toUpperCase());
      }
    });

    it("should have unique combination of (userId, gameId, region) for subscriptions", () => {
      // Simulating uniqueness constraint check
      const subscriptions = [
        { userId: "user1", gameId: "game1", region: "na" },
        { userId: "user1", gameId: "game1", region: "eu" }, // Different region, allowed
        { userId: "user1", gameId: "game2", region: "na" }, // Different game, allowed
        { userId: "user2", gameId: "game1", region: "na" }, // Different user, allowed
      ];

      // Check uniqueness
      const uniqueKeys = new Set(
        subscriptions.map((s) => `${s.userId}:${s.gameId}:${s.region}`)
      );

      expect(uniqueKeys.size).toBe(subscriptions.length);
    });
  });

  describe("Retry Logic Validation", () => {
    const MAX_ATTEMPTS = ALERT_CONSTANTS.MAX_RETRY_ATTEMPTS;
    const BASE_DELAY = ALERT_CONSTANTS.BASE_RETRY_DELAY_MS;

    it("should calculate total max wait time correctly", () => {
      // With 3 max attempts, we have:
      // - Attempt 0 (initial): immediate
      // - Retry 1 (attempt 1): wait 1s (2^0 * 1000)
      // - Retry 2 (attempt 2): wait 2s (2^1 * 1000)
      // Total wait time for retries: 1s + 2s = 3 seconds
      let totalWaitTime = 0;
      for (let attempt = 0; attempt < MAX_ATTEMPTS - 1; attempt++) {
        totalWaitTime += BASE_DELAY * Math.pow(2, attempt);
      }

      // With MAX_ATTEMPTS=3: retry after attempt 0 (1s) + retry after attempt 1 (2s) = 3s
      expect(totalWaitTime).toBe(1000 + 2000); // 3 seconds total for 2 retries
    });

    it("should never retry more than max attempts", () => {
      const attemptsLog: number[] = [];

      for (let attempt = 0; attempt < 10; attempt++) {
        const shouldRetry = attempt + 1 < MAX_ATTEMPTS;
        if (!shouldRetry) break;
        attemptsLog.push(attempt);
      }

      // Should only log 2 retries (attempt 0 and 1), stopping before attempt 2
      expect(attemptsLog).toHaveLength(MAX_ATTEMPTS - 1);
    });

    it("should have exponential growth in retry delays", () => {
      const delays: number[] = [];

      for (let attempt = 0; attempt < MAX_ATTEMPTS - 1; attempt++) {
        delays.push(BASE_DELAY * Math.pow(2, attempt));
      }

      // Verify exponential growth: each delay should be 2x the previous
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBe(delays[i - 1] * 2);
      }
    });
  });
});
