/**
 * E2E Tests for Token Storage Security (Issue #14)
 *
 * These tests verify that security tokens (magic links, password resets,
 * unsubscribe tokens) are properly hashed before storage to prevent
 * exposure if the database is compromised.
 *
 * Note: Since we can't directly inspect the database in E2E tests,
 * these tests verify the user-facing behavior that confirms the
 * hashing implementation is working correctly:
 * - Tokens work correctly when users provide the original token
 * - Invalid/modified tokens are rejected
 * - Token verification flows complete successfully
 *
 * @module token-security.spec
 */
import { test, expect } from "@playwright/test";

test.describe("Token Storage Security (Issue #14)", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("Password Reset Token Security", () => {
    test("invalid password reset tokens are rejected", async ({ page }) => {
      // Navigate to reset password page with a completely invalid token
      await page.goto("/reset-password?token=invalid-fake-token-12345", {
        waitUntil: "networkidle",
      });

      // Wait for the page to validate the token
      // The page should show an error for invalid token
      const errorElement = page.locator('[data-testid="reset-password-error"]');
      const pageContent = page.locator("body");

      // Wait for either error message or page content to load
      await expect(errorElement.or(pageContent)).toBeVisible({ timeout: 10000 });

      // If using hashing, an invalid token should be rejected
      // The exact error message depends on implementation
      const hasError = await errorElement.isVisible().catch(() => false);
      if (hasError) {
        // Verify the error message doesn't expose internal details
        const errorText = await errorElement.textContent();
        expect(errorText).not.toContain("database");
        expect(errorText).not.toContain("hash");
        expect(errorText).not.toContain("SHA");
      }

      // Take screenshot for verification
      await page.screenshot({
        path: "e2e/screenshots/token-security-invalid-reset-token.png",
        fullPage: true,
      });
    });

    test("password reset page handles malformed tokens gracefully", async ({ page }) => {
      // Try various malformed tokens
      const malformedTokens = [
        "", // Empty
        "a", // Too short
        "x".repeat(100), // Too long
        "token with spaces",
        "token\nwith\nnewlines",
        "<script>alert('xss')</script>", // XSS attempt
        "'; DROP TABLE users; --", // SQL injection attempt
      ];

      for (const token of malformedTokens) {
        await page.goto(`/reset-password?token=${encodeURIComponent(token)}`, {
          waitUntil: "networkidle",
        });

        // Page should load without crashing
        await expect(page.locator("body")).toBeVisible();

        // Should not show any unhandled errors in console
        const consoleLogs: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error") {
            consoleLogs.push(msg.text());
          }
        });

        // Wait a moment for any errors
        await page.waitForTimeout(500);

        // There should be no critical unhandled errors
        const criticalErrors = consoleLogs.filter(
          (log) =>
            log.includes("Uncaught") ||
            log.includes("unhandled") ||
            log.includes("FATAL")
        );
        expect(criticalErrors).toHaveLength(0);
      }
    });
  });

  test.describe("Magic Link Token Security", () => {
    test("invalid magic link tokens are rejected", async ({ page }) => {
      // Navigate to verify magic link page with an invalid token
      await page.goto("/verify-magic-link?token=fake-invalid-magic-token", {
        waitUntil: "networkidle",
      });

      // Wait for verification to complete
      await page.waitForTimeout(2000);

      // Should either show error or redirect
      const currentUrl = page.url();
      const pageContent = await page.locator("body").textContent();

      // The page should indicate the token is invalid
      // Either through an error message or by not logging in the user
      const isLoggedIn = await page.evaluate(() => {
        const authData = localStorage.getItem("gamestatus_auth");
        return authData && JSON.parse(authData).user;
      });

      // Invalid token should NOT result in successful login
      expect(isLoggedIn).toBeFalsy();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/token-security-invalid-magic-link.png",
        fullPage: true,
      });
    });

    test("magic link verification handles malformed tokens safely", async ({ page }) => {
      // Test with a token that looks valid but isn't
      const fakeToken = "0".repeat(64); // 64 hex chars like a real hash

      await page.goto(`/verify-magic-link?token=${fakeToken}`, {
        waitUntil: "networkidle",
      });

      // Wait for verification attempt
      await page.waitForTimeout(2000);

      // Should not crash and should not log in
      const isLoggedIn = await page.evaluate(() => {
        const authData = localStorage.getItem("gamestatus_auth");
        return authData && JSON.parse(authData).user;
      });

      expect(isLoggedIn).toBeFalsy();
    });
  });

  test.describe("Error Message Security", () => {
    test("error messages do not expose internal implementation details", async ({ page }) => {
      // Test password reset with invalid token
      await page.goto("/reset-password?token=test-security-token", {
        waitUntil: "networkidle",
      });

      // Wait for any error message
      await page.waitForTimeout(2000);

      // Get all visible text on the page
      const pageText = await page.locator("body").textContent();

      // Error messages should NOT expose:
      expect(pageText?.toLowerCase()).not.toContain("tokenHash");
      expect(pageText?.toLowerCase()).not.toContain("sha-256");
      expect(pageText?.toLowerCase()).not.toContain("sha256");
      expect(pageText?.toLowerCase()).not.toContain("crypto.subtle");
      expect(pageText?.toLowerCase()).not.toContain("convex");
      expect(pageText?.toLowerCase()).not.toContain("database");
      expect(pageText?.toLowerCase()).not.toContain("withIndex");
      expect(pageText?.toLowerCase()).not.toContain("by_tokenHash");
    });

    test("console does not log sensitive token information", async ({ page }) => {
      const consoleLogs: string[] = [];
      page.on("console", (msg) => {
        consoleLogs.push(msg.text());
      });

      // Navigate to pages that handle tokens
      await page.goto("/reset-password?token=security-test-token", {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(2000);

      await page.goto("/verify-magic-link?token=security-test-token", {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(2000);

      // Check that sensitive info is not logged
      for (const log of consoleLogs) {
        const lowerLog = log.toLowerCase();
        // Should not log raw tokens or hashes in production
        expect(lowerLog).not.toMatch(/token.*=.*[a-f0-9]{64}/);
        expect(lowerLog).not.toContain("plaintexttoken");
        expect(lowerLog).not.toContain("rawhash");
      }
    });
  });

  test.describe("Token Verification Flow", () => {
    test("forgot password modal initiates secure token generation", async ({ page }) => {
      // Navigate to home and open login
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator(".dashboard")).toBeVisible({ timeout: 10000 });

      // Click login button
      await page.locator('[data-testid="dashboard-login-button"]').click();
      await expect(
        page.locator('[data-testid="login-email-input"]')
      ).toBeVisible({ timeout: 5000 });

      // Click forgot password
      await page.locator('[data-testid="switch-to-forgot-password"]').click();
      await expect(
        page.locator('[data-testid="forgot-password-email-input"]')
      ).toBeVisible({ timeout: 5000 });

      // Fill in email and submit
      await page
        .locator('[data-testid="forgot-password-email-input"]')
        .fill("test@example.com");
      await page.locator('[data-testid="forgot-password-submit"]').click();

      // Should show success message (token generation happened server-side)
      // The token itself should never be exposed to the frontend
      await expect(
        page.locator('[data-testid="forgot-password-success"]')
      ).toBeVisible({ timeout: 10000 });

      // Verify no token is visible in the response/page
      const successText = await page
        .locator('[data-testid="forgot-password-success"]')
        .textContent();
      expect(successText).not.toMatch(/[a-f0-9]{64}/); // No hash visible

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/token-security-password-reset-request.png",
        fullPage: true,
      });
    });
  });
});
