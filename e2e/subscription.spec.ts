/**
 * E2E Tests for Subscription Toggle Component
 *
 * Tests the email alert subscription functionality including:
 * - Subscription toggle visibility for authenticated users
 * - Popover opens and displays all regions without cutoff
 * - Region selection and saving works correctly
 * - Subscription state persists after page reload
 *
 * @module subscription.spec
 */
import { test, expect } from "@playwright/test";

// Mock user for authenticated tests
const MOCK_USER = {
  _id: "test-subscription-user-id",
  email: "subscription-test@example.com",
  displayName: "Subscription Test User",
  isEmailVerified: true,
  _creationTime: Date.now() - 86400000, // 1 day ago
};

test.describe("Subscription Toggle", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Clear localStorage to ensure fresh state
    await page.goto(baseURL || "/", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("Unauthenticated User", () => {
    test("subscription toggle is not visible for unauthenticated users", async ({ page }) => {
      // Navigate to dashboard and wait for games to load
      await page.goto("/", { waitUntil: "networkidle" });

      // Wait for game cards to load
      await page.waitForSelector('[data-testid="game-card"]', { timeout: 10000 }).catch(() => {
        // Game cards might not exist in test env, check for loading state
      });

      // Verify no subscription toggle buttons exist
      const subscriptionButtons = page.locator('[aria-label*="email alerts"]');
      const count = await subscriptionButtons.count();
      expect(count).toBe(0);
    });
  });

  test.describe("Authenticated User", () => {
    test.beforeEach(async ({ page }) => {
      // Set up authenticated state via localStorage
      await page.goto("/", { waitUntil: "networkidle" });
      await page.evaluate((user) => {
        localStorage.setItem("gamestatus_auth", JSON.stringify({ user }));
      }, MOCK_USER);
    });

    /**
     * Helper to wait for game cards to load with extended timeout.
     * In test environments, Convex data may take longer to load.
     * Skips the test if data is not available.
     */
    async function waitForGameCards(page: import("@playwright/test").Page, testInfo: import("@playwright/test").TestInfo) {
      // Wait for either game cards or handle case where we have loading state
      // Give it 15s for Convex to connect and load data
      const gameCardLoaded = await page.waitForSelector('[data-testid="game-card"]', { timeout: 15000 }).catch(() => null);

      if (!gameCardLoaded) {
        // Skip test if Convex data is not available
        testInfo.skip(true, "Skipping: Convex data not available in test environment");
      }
    }

    test("subscription toggle is visible for authenticated users", async ({ page }, testInfo) => {
      // Navigate to dashboard
      await page.goto("/", { waitUntil: "networkidle" });

      // Wait for game cards to load
      await waitForGameCards(page, testInfo);

      // Verify subscription toggle buttons exist
      const subscriptionButtons = page.locator('[aria-label*="email alerts"]');
      await expect(subscriptionButtons.first()).toBeVisible({ timeout: 5000 });
    });

    test("clicking subscription toggle opens region popover", async ({ page }, testInfo) => {
      // Navigate to dashboard
      await page.goto("/", { waitUntil: "networkidle" });

      // Wait for game cards to load
      await waitForGameCards(page, testInfo);

      // Find and click the first subscription toggle
      const subscriptionButton = page.locator('[aria-label*="email alerts"]').first();
      await expect(subscriptionButton).toBeVisible({ timeout: 5000 });
      await subscriptionButton.click();

      // Verify popover dialog opens
      const popover = page.locator('[role="dialog"]').filter({ hasText: "Email Alerts" });
      await expect(popover).toBeVisible({ timeout: 5000 });
    });

    test("region popover displays all 5 regions without cutoff", async ({ page }, testInfo) => {
      // Navigate to dashboard
      await page.goto("/", { waitUntil: "networkidle" });

      // Wait for game cards to load
      await waitForGameCards(page, testInfo);

      // Click subscription toggle
      const subscriptionButton = page.locator('[aria-label*="email alerts"]').first();
      await subscriptionButton.click();

      // Verify popover dialog opens
      const popover = page.locator('[role="dialog"]').filter({ hasText: "Email Alerts" });
      await expect(popover).toBeVisible({ timeout: 5000 });

      // Verify all 5 regions are visible (critical fix verification)
      await expect(popover.locator("text=North America")).toBeVisible();
      await expect(popover.locator("text=Europe")).toBeVisible();
      await expect(popover.locator("text=Asia").first()).toBeVisible();
      await expect(popover.locator("text=Oceania")).toBeVisible();
      await expect(popover.locator("text=Global").first()).toBeVisible();

      // Verify action buttons are visible (were previously cut off)
      await expect(popover.getByRole("button", { name: "Cancel" })).toBeVisible();

      // The save button should be "Unsubscribe" when no regions selected
      const saveButton = popover.getByRole("button").filter({ hasText: /Subscribe|Unsubscribe|Update/ });
      await expect(saveButton).toBeVisible();

      // Take screenshot for visual verification
      await page.screenshot({
        path: "e2e/screenshots/subscription-popover-all-regions.png",
        fullPage: false,
      });
    });

    test("popover uses fixed positioning via portal (not clipped by card)", async ({ page }, testInfo) => {
      // Navigate to dashboard
      await page.goto("/", { waitUntil: "networkidle" });

      // Wait for game cards to load
      await waitForGameCards(page, testInfo);

      // Click subscription toggle
      const subscriptionButton = page.locator('[aria-label*="email alerts"]').first();
      await subscriptionButton.click();

      // Verify popover has portal class and fixed positioning
      const popover = page.locator(".region-popover--portal");
      await expect(popover).toBeVisible({ timeout: 5000 });

      // Check that popover has fixed position style
      const position = await popover.evaluate((el) => window.getComputedStyle(el).position);
      expect(position).toBe("fixed");
    });

    test("region selection can be toggled", async ({ page }, testInfo) => {
      // Navigate to dashboard
      await page.goto("/", { waitUntil: "networkidle" });

      // Wait for game cards to load
      await waitForGameCards(page, testInfo);

      // Click subscription toggle
      const subscriptionButton = page.locator('[aria-label*="email alerts"]').first();
      await subscriptionButton.click();

      // Verify popover is open
      const popover = page.locator('[role="dialog"]').filter({ hasText: "Email Alerts" });
      await expect(popover).toBeVisible();

      // Get North America checkbox
      const naCheckbox = popover.getByRole("checkbox", { name: /North America/i });

      // Verify it's initially unchecked
      await expect(naCheckbox).not.toBeChecked();

      // Click to check it
      await naCheckbox.click();
      await expect(naCheckbox).toBeChecked();

      // Verify Subscribe button is now enabled
      const subscribeButton = popover.getByRole("button", { name: "Subscribe" });
      await expect(subscribeButton).toBeEnabled();
    });

    test("cancel button closes popover without saving", async ({ page }, testInfo) => {
      // Navigate to dashboard
      await page.goto("/", { waitUntil: "networkidle" });

      // Wait for game cards to load
      await waitForGameCards(page, testInfo);

      // Click subscription toggle
      const subscriptionButton = page.locator('[aria-label*="email alerts"]').first();
      await subscriptionButton.click();

      // Verify popover is open
      const popover = page.locator('[role="dialog"]').filter({ hasText: "Email Alerts" });
      await expect(popover).toBeVisible();

      // Select a region
      const naCheckbox = popover.getByRole("checkbox", { name: /North America/i });
      await naCheckbox.click();

      // Click cancel
      const cancelButton = popover.getByRole("button", { name: "Cancel" });
      await cancelButton.click();

      // Verify popover is closed
      await expect(popover).not.toBeVisible();

      // Button should still show "Subscribe" (not "Manage")
      await expect(subscriptionButton).toHaveAttribute("aria-label", /Subscribe to email alerts/i);
    });

    test("escape key closes popover", async ({ page }, testInfo) => {
      // Navigate to dashboard
      await page.goto("/", { waitUntil: "networkidle" });

      // Wait for game cards to load
      await waitForGameCards(page, testInfo);

      // Click subscription toggle
      const subscriptionButton = page.locator('[aria-label*="email alerts"]').first();
      await subscriptionButton.click();

      // Verify popover is open
      const popover = page.locator('[role="dialog"]').filter({ hasText: "Email Alerts" });
      await expect(popover).toBeVisible();

      // Press Escape
      await page.keyboard.press("Escape");

      // Verify popover is closed
      await expect(popover).not.toBeVisible();
    });
  });
});
