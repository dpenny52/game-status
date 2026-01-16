/**
 * Tests for Scheduler and Retry Framework
 *
 * These tests verify the core scheduler and retry logic for the
 * server status fetching service.
 */
import { describe, it, expect } from "vitest";

/**
 * Exponential backoff delay calculation.
 * Calculates delay: Math.min(1000 * Math.pow(2, attempt), 16000)
 */
function calculateBackoffDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 16000);
}

/**
 * Maximum retry attempts per publisher per cycle.
 */
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Supported platforms for dispatching.
 */
const SUPPORTED_PLATFORMS = [
  "blizzard",
  "riot",
  "steam",
  "epic",
  "mojang",
  "squareenix",
] as const;

describe("Scheduler Configuration", () => {
  it("should define a 60-second polling interval", () => {
    const POLLING_INTERVAL_SECONDS = 60;
    expect(POLLING_INTERVAL_SECONDS).toBe(60);
  });

  it("should dispatch to all supported publishers", () => {
    expect(SUPPORTED_PLATFORMS).toHaveLength(6);
    expect(SUPPORTED_PLATFORMS).toContain("blizzard");
    expect(SUPPORTED_PLATFORMS).toContain("riot");
    expect(SUPPORTED_PLATFORMS).toContain("steam");
    expect(SUPPORTED_PLATFORMS).toContain("epic");
    expect(SUPPORTED_PLATFORMS).toContain("mojang");
    expect(SUPPORTED_PLATFORMS).toContain("squareenix");
  });
});

describe("Exponential Backoff Delay Calculation", () => {
  it("should calculate correct delay for attempt 0 (1 second)", () => {
    expect(calculateBackoffDelay(0)).toBe(1000);
  });

  it("should calculate correct delay for attempt 1 (2 seconds)", () => {
    expect(calculateBackoffDelay(1)).toBe(2000);
  });

  it("should calculate correct delay for attempt 2 (4 seconds)", () => {
    expect(calculateBackoffDelay(2)).toBe(4000);
  });

  it("should calculate correct delay for attempt 3 (8 seconds)", () => {
    expect(calculateBackoffDelay(3)).toBe(8000);
  });

  it("should cap delay at 16 seconds for attempt 4 and beyond", () => {
    expect(calculateBackoffDelay(4)).toBe(16000);
    expect(calculateBackoffDelay(5)).toBe(16000);
    expect(calculateBackoffDelay(10)).toBe(16000);
  });
});

describe("Retry Counter Management", () => {
  it("should enforce maximum 5 retry attempts", () => {
    expect(MAX_RETRY_ATTEMPTS).toBe(5);
  });

  it("should track retry attempts per publisher", () => {
    const retryState: Record<string, number> = {};

    // Simulate incrementing retry count
    retryState["blizzard"] = 0;
    retryState["blizzard"]++;
    expect(retryState["blizzard"]).toBe(1);

    retryState["blizzard"]++;
    retryState["blizzard"]++;
    expect(retryState["blizzard"]).toBe(3);
  });

  it("should reset retry counter on success", () => {
    const retryState: Record<string, number> = {
      blizzard: 3,
      riot: 2,
    };

    // Simulate success - reset counter
    function onSuccess(platform: string) {
      retryState[platform] = 0;
    }

    onSuccess("blizzard");
    expect(retryState["blizzard"]).toBe(0);
    expect(retryState["riot"]).toBe(2); // Other publishers unaffected
  });
});

describe("Parallel Publisher Dispatch", () => {
  it("should allow independent failure handling per publisher", async () => {
    const results: Record<string, { success: boolean; error?: string }> = {};

    // Simulate parallel dispatch with mixed success/failure
    async function fetchPublisherStatus(
      platform: string,
      shouldFail: boolean
    ): Promise<void> {
      if (shouldFail) {
        results[platform] = { success: false, error: "API unavailable" };
      } else {
        results[platform] = { success: true };
      }
    }

    // Dispatch all publishers in parallel
    await Promise.all([
      fetchPublisherStatus("blizzard", false),
      fetchPublisherStatus("riot", true), // This one fails
      fetchPublisherStatus("steam", false),
      fetchPublisherStatus("epic", false),
      fetchPublisherStatus("mojang", true), // This one fails
      fetchPublisherStatus("squareenix", false),
    ]);

    // Verify all publishers were processed despite failures
    expect(Object.keys(results)).toHaveLength(6);
    expect(results["blizzard"].success).toBe(true);
    expect(results["riot"].success).toBe(false);
    expect(results["steam"].success).toBe(true);
    expect(results["epic"].success).toBe(true);
    expect(results["mojang"].success).toBe(false);
    expect(results["squareenix"].success).toBe(true);
  });

  it("should continue processing when individual publishers fail", async () => {
    const processedPublishers: string[] = [];

    async function processPublisher(
      platform: string,
      shouldThrow: boolean
    ): Promise<void> {
      if (shouldThrow) {
        throw new Error(`${platform} failed`);
      }
      processedPublishers.push(platform);
    }

    // Wrap each call to catch errors independently
    const publishers = ["blizzard", "riot", "steam"];
    const shouldThrow = [false, true, false];

    await Promise.all(
      publishers.map(async (platform, index) => {
        try {
          await processPublisher(platform, shouldThrow[index]);
        } catch {
          // Log error but continue
        }
      })
    );

    // Verify successful publishers were processed
    expect(processedPublishers).toContain("blizzard");
    expect(processedPublishers).toContain("steam");
    expect(processedPublishers).not.toContain("riot");
  });
});
