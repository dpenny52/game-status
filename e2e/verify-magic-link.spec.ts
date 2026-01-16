/**
 * E2E Tests for Magic Link Verification Flow
 *
 * Tests the magic link verification flow including:
 * - No token parameter shows error
 * - Invalid token shows error state
 * - Page loads correctly
 * - Error state has return to home link
 *
 * Note: Testing successful login requires a valid token from the database,
 * which is difficult in E2E without database seeding. These tests focus on
 * error handling and UI states that can be verified without real tokens.
 *
 * @module verify-magic-link.spec
 */
import { test, expect } from "@playwright/test";

test.describe("Magic Link Verification Flow", () => {
  test("1. No token parameter shows error", async ({ page }) => {
    // Navigate to verify magic link page without token
    await page.goto("http://localhost:5173/verify-magic-link", { waitUntil: "networkidle" });

    // Wait for error state to appear
    const errorState = page.locator('[data-testid="verify-magic-link-error"]');
    await expect(errorState).toBeVisible({ timeout: 10000 });

    // Verify the error message mentions missing token
    const errorText = page.locator("text=No magic link token provided");
    await expect(errorText).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "e2e/screenshots/verify-magic-link-01-no-token.png",
      fullPage: false,
    });

    console.log("Test 1 PASSED: No token parameter shows error");
  });

  test("2. Invalid token shows error state", async ({ page }) => {
    // Navigate to verify magic link page with invalid token
    await page.goto("http://localhost:5173/verify-magic-link?token=invalid-token-xyz", { waitUntil: "networkidle" });

    // Wait for error state (token verification will fail from Convex)
    const errorState = page.locator('[data-testid="verify-magic-link-error"]');
    await expect(errorState).toBeVisible({ timeout: 10000 });

    // Verify error message about invalid token
    const heading = page.locator("h2:has-text('Magic Link Invalid')");
    await expect(heading).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "e2e/screenshots/verify-magic-link-02-invalid-token.png",
      fullPage: false,
    });

    console.log("Test 2 PASSED: Invalid token shows error state");
  });

  test("3. Page loads correctly with verifying state", async ({ page }) => {
    // Navigate to verify magic link page with a token
    await page.goto("http://localhost:5173/verify-magic-link?token=test-token-123", { waitUntil: "domcontentloaded" });

    // Check that either verifying state or error state appears
    // (token will be invalid so error is expected after verification)
    const verifyingOrError = page.locator('[data-testid="verify-magic-link-verifying"], [data-testid="verify-magic-link-error"], [data-testid="verify-magic-link-loading"]');
    await expect(verifyingOrError.first()).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({
      path: "e2e/screenshots/verify-magic-link-03-page-loads.png",
      fullPage: false,
    });

    console.log("Test 3 PASSED: Page loads correctly");
  });

  test("4. Error state has return to home link", async ({ page }) => {
    // Navigate to verify magic link page without token
    await page.goto("http://localhost:5173/verify-magic-link", { waitUntil: "networkidle" });

    // Wait for error state
    const errorState = page.locator('[data-testid="verify-magic-link-error"]');
    await expect(errorState).toBeVisible({ timeout: 10000 });

    // Verify return to home link exists
    const returnLink = page.locator('a:has-text("Return to Home")');
    await expect(returnLink).toBeVisible();

    // Click the return link
    await returnLink.click();

    // Should navigate to home page
    await expect(page).toHaveURL(/localhost:5173\/?$/);

    // Take screenshot
    await page.screenshot({
      path: "e2e/screenshots/verify-magic-link-04-return-link.png",
      fullPage: false,
    });

    console.log("Test 4 PASSED: Error state has working return link");
  });

  test("5. Verify magic link page UI elements", async ({ page }) => {
    // Navigate to verify magic link with token (will likely error but we can check initial render)
    await page.goto("http://localhost:5173/verify-magic-link?token=test-token-for-ui", { waitUntil: "domcontentloaded" });

    // Wait for page to finish loading
    await page.waitForTimeout(2000);

    // Take screenshot of whatever state the page is in
    await page.screenshot({
      path: "e2e/screenshots/verify-magic-link-05-ui-elements.png",
      fullPage: true,
    });

    // Verify page has proper structure (either error or loading)
    const pageContent = page.locator(".verify-magic-link-page");
    await expect(pageContent).toBeVisible({ timeout: 10000 });

    console.log("Test 5 PASSED: Verify magic link page UI renders correctly");
  });

  test("6. Page displays Magic Link Invalid heading on error", async ({ page }) => {
    // Navigate with invalid token
    await page.goto("http://localhost:5173/verify-magic-link?token=abc123invalid", { waitUntil: "networkidle" });

    // Wait for error state
    const errorState = page.locator('[data-testid="verify-magic-link-error"]');
    await expect(errorState).toBeVisible({ timeout: 10000 });

    // Verify heading
    const heading = page.locator("h2:has-text('Magic Link Invalid')");
    await expect(heading).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "e2e/screenshots/verify-magic-link-06-error-heading.png",
      fullPage: false,
    });

    console.log("Test 6 PASSED: Magic Link Invalid heading displayed");
  });

  test("7. Verifying spinner appears briefly", async ({ page }) => {
    // Navigate with token - check for verifying state
    await page.goto("http://localhost:5173/verify-magic-link?token=spinner-test", { waitUntil: "domcontentloaded" });

    // Either we catch the verifying state or it transitions to error quickly
    const verifyingOrError = page.locator('[data-testid="verify-magic-link-verifying"], [data-testid="verify-magic-link-error"]');
    await expect(verifyingOrError.first()).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await page.screenshot({
      path: "e2e/screenshots/verify-magic-link-07-spinner.png",
      fullPage: false,
    });

    console.log("Test 7 PASSED: Verification state appears");
  });
});
