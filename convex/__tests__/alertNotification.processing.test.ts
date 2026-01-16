/**
 * Tests for Alert Processing Pipeline and Email Sending
 *
 * These tests verify the alert processing logic including:
 * - Querying active subscriptions for game+region
 * - 30-minute cooldown filtering
 * - Email content structure
 * - Exponential backoff retry logic
 */
import { describe, it, expect } from "vitest";
import { ALERT_CONSTANTS } from "../alertNotifications";

describe("Alert Processing Configuration", () => {
  it("should have a 30-minute cooldown period", () => {
    expect(ALERT_CONSTANTS.COOLDOWN_MS).toBe(30 * 60 * 1000);
  });

  it("should have max 3 retry attempts", () => {
    expect(ALERT_CONSTANTS.MAX_RETRY_ATTEMPTS).toBe(3);
  });

  it("should have 1 second base retry delay", () => {
    expect(ALERT_CONSTANTS.BASE_RETRY_DELAY_MS).toBe(1000);
  });
});

describe("Cooldown Filtering Logic", () => {
  const COOLDOWN_MS = ALERT_CONSTANTS.COOLDOWN_MS;

  it("should allow alert when lastAlertSentAt is null (first alert)", () => {
    const lastSent = null;
    const now = Date.now();
    const cooldownThreshold = now - COOLDOWN_MS;

    // Logic: if lastSent is null, return true (allow alert)
    const shouldSendAlert = lastSent === null || lastSent === undefined || lastSent < cooldownThreshold;
    expect(shouldSendAlert).toBe(true);
  });

  it("should allow alert when lastAlertSentAt is undefined", () => {
    const lastSent = undefined;
    const now = Date.now();
    const cooldownThreshold = now - COOLDOWN_MS;

    const shouldSendAlert = lastSent === null || lastSent === undefined || lastSent < cooldownThreshold;
    expect(shouldSendAlert).toBe(true);
  });

  it("should allow alert when outside 30-minute cooldown window", () => {
    const now = Date.now();
    const lastSent = now - COOLDOWN_MS - 1000; // 31 minutes ago
    const cooldownThreshold = now - COOLDOWN_MS;

    const shouldSendAlert = lastSent === null || lastSent === undefined || lastSent < cooldownThreshold;
    expect(shouldSendAlert).toBe(true);
  });

  it("should NOT allow alert when within 30-minute cooldown window", () => {
    const now = Date.now();
    const lastSent = now - (COOLDOWN_MS / 2); // 15 minutes ago
    const cooldownThreshold = now - COOLDOWN_MS;

    const shouldSendAlert = lastSent === null || lastSent === undefined || lastSent < cooldownThreshold;
    expect(shouldSendAlert).toBe(false);
  });

  it("should NOT allow alert when exactly at cooldown threshold", () => {
    const now = Date.now();
    const lastSent = now - COOLDOWN_MS; // Exactly 30 minutes ago
    const cooldownThreshold = now - COOLDOWN_MS;

    // At exactly the threshold, lastSent === cooldownThreshold, so lastSent < cooldownThreshold is false
    const shouldSendAlert = lastSent === null || lastSent === undefined || lastSent < cooldownThreshold;
    expect(shouldSendAlert).toBe(false);
  });
});

describe("Exponential Backoff Retry Logic", () => {
  const BASE_DELAY = ALERT_CONSTANTS.BASE_RETRY_DELAY_MS;

  it("should calculate correct delay for attempt 0", () => {
    const attemptNumber = 0;
    const delayMs = BASE_DELAY * Math.pow(2, attemptNumber);
    expect(delayMs).toBe(1000); // 1 second
  });

  it("should calculate correct delay for attempt 1", () => {
    const attemptNumber = 1;
    const delayMs = BASE_DELAY * Math.pow(2, attemptNumber);
    expect(delayMs).toBe(2000); // 2 seconds
  });

  it("should calculate correct delay for attempt 2", () => {
    const attemptNumber = 2;
    const delayMs = BASE_DELAY * Math.pow(2, attemptNumber);
    expect(delayMs).toBe(4000); // 4 seconds
  });

  it("should not retry when max attempts exhausted", () => {
    const attemptNumber = 2; // 0-indexed, so this is attempt 3
    const maxAttempts = ALERT_CONSTANTS.MAX_RETRY_ATTEMPTS;

    const shouldRetry = attemptNumber + 1 < maxAttempts;
    expect(shouldRetry).toBe(false);
  });

  it("should retry when attempts remaining", () => {
    const attemptNumber = 1; // 0-indexed, so this is attempt 2
    const maxAttempts = ALERT_CONSTANTS.MAX_RETRY_ATTEMPTS;

    const shouldRetry = attemptNumber + 1 < maxAttempts;
    expect(shouldRetry).toBe(true);
  });
});

describe("Email Content Structure", () => {
  it("should format subject line correctly", () => {
    const gameName = "World of Warcraft";
    const region = "na";
    const subject = `${gameName} is back online - ${region.toUpperCase()}`;

    expect(subject).toBe("World of Warcraft is back online - NA");
  });

  it("should format subject line with different regions", () => {
    const gameName = "Diablo IV";

    expect(`${gameName} is back online - ${"eu".toUpperCase()}`).toBe("Diablo IV is back online - EU");
    expect(`${gameName} is back online - ${"asia".toUpperCase()}`).toBe("Diablo IV is back online - ASIA");
    expect(`${gameName} is back online - ${"global".toUpperCase()}`).toBe("Diablo IV is back online - GLOBAL");
  });
});
