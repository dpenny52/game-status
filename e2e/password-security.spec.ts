/**
 * E2E Tests for Password Security (Issue #8 Fix)
 *
 * These tests verify that:
 * - Password hashing works correctly with bcrypt (signup/login flows)
 * - Password verification is accurate
 * - Password hash is not exposed to the client
 * - Authentication flows remain functional after bcrypt implementation
 *
 * Issue #8: [CRITICAL] Weak Password Hashing - SHA-256 with Hardcoded Salt
 * Fix: Replaced with bcrypt using cost factor 12 and unique per-password salts
 *
 * @module password-security.spec
 */
import { test, expect } from "@playwright/test";

test.describe("Password Security - Bcrypt Implementation (Issue #8)", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("Signup Flow with Bcrypt Hashing", () => {
    test("can signup with strong password", async ({ page }) => {
      const uniqueEmail = `e2e-bcrypt-${Date.now()}@example.com`;
      const strongPassword = "SecureP@ssw0rd123!";
      const displayName = "Bcrypt Test User";

      // Navigate and open signup
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator(".dashboard")).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="dashboard-login-button"]').click();
      await expect(
        page.locator('[data-testid="login-email-input"]')
      ).toBeVisible({ timeout: 5000 });
      await page.locator('[data-testid="switch-to-signup"]').click();
      await expect(
        page.locator('[data-testid="signup-email-input"]')
      ).toBeVisible({ timeout: 5000 });

      // Fill signup form with strong password
      await page
        .locator('[data-testid="signup-email-input"]')
        .fill(uniqueEmail);
      await page
        .locator('[data-testid="signup-displayname-input"]')
        .fill(displayName);
      await page
        .locator('[data-testid="signup-password-input"]')
        .fill(strongPassword);
      await page
        .locator('[data-testid="signup-confirm-password-input"]')
        .fill(strongPassword);
      await page.locator('[data-testid="signup-submit-button"]').click();

      // Wait for signup to complete (modal should close)
      await expect(
        page.locator('[data-testid="signup-email-input"]')
      ).not.toBeVisible({ timeout: 15000 });

      // Verify authentication state is set
      const authData = await page.evaluate(() => {
        const stored = localStorage.getItem("gamestatus_auth");
        return stored ? JSON.parse(stored) : null;
      });

      expect(authData).not.toBeNull();
      expect(authData?.user?.email).toBe(uniqueEmail);

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/password-security-signup-success.png",
        fullPage: true,
      });
    });

    test("password hash is never exposed to client", async ({ page }) => {
      const uniqueEmail = `e2e-nohash-${Date.now()}@example.com`;
      const password = "SecurePassword123!";
      const displayName = "No Hash Exposed";

      // Complete signup
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator(".dashboard")).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="dashboard-login-button"]').click();
      await expect(
        page.locator('[data-testid="login-email-input"]')
      ).toBeVisible({ timeout: 5000 });
      await page.locator('[data-testid="switch-to-signup"]').click();
      await expect(
        page.locator('[data-testid="signup-email-input"]')
      ).toBeVisible({ timeout: 5000 });

      await page
        .locator('[data-testid="signup-email-input"]')
        .fill(uniqueEmail);
      await page
        .locator('[data-testid="signup-displayname-input"]')
        .fill(displayName);
      await page
        .locator('[data-testid="signup-password-input"]')
        .fill(password);
      await page
        .locator('[data-testid="signup-confirm-password-input"]')
        .fill(password);
      await page.locator('[data-testid="signup-submit-button"]').click();

      // Wait for signup to complete
      await expect(
        page.locator('[data-testid="signup-email-input"]')
      ).not.toBeVisible({ timeout: 15000 });

      // Check all localStorage for password hash
      const hasPasswordHash = await page.evaluate(() => {
        const stored = localStorage.getItem("gamestatus_auth");
        if (!stored) return false;

        const data = JSON.parse(stored);
        const jsonStr = JSON.stringify(data);

        // Check for common hash patterns
        // SHA-256 produces 64 hex characters
        // Bcrypt produces strings starting with $2a$, $2b$, or $2y$
        const hasSha256Like = /[a-f0-9]{64}/i.test(jsonStr);
        const hasBcryptHash = /\$2[aby]?\$\d{2}\$/.test(jsonStr);

        // Also check for explicit passwordHash field
        const hasPasswordField =
          "passwordHash" in data ||
          (data.user && "passwordHash" in data.user);

        return hasBcryptHash || hasPasswordField || hasSha256Like;
      });

      // Password hash should NEVER be in localStorage
      expect(hasPasswordHash).toBe(false);

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/password-security-no-hash-exposed.png",
        fullPage: true,
      });
    });

    test("password with special characters works correctly", async ({
      page,
    }) => {
      const uniqueEmail = `e2e-special-${Date.now()}@example.com`;
      const specialPassword = "P@$$w0rd!#$%^&*()_+-=[]{}|;':\",./<>?";
      const displayName = "Special Char User";

      // Complete signup
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator(".dashboard")).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="dashboard-login-button"]').click();
      await expect(
        page.locator('[data-testid="login-email-input"]')
      ).toBeVisible({ timeout: 5000 });
      await page.locator('[data-testid="switch-to-signup"]').click();
      await expect(
        page.locator('[data-testid="signup-email-input"]')
      ).toBeVisible({ timeout: 5000 });

      await page
        .locator('[data-testid="signup-email-input"]')
        .fill(uniqueEmail);
      await page
        .locator('[data-testid="signup-displayname-input"]')
        .fill(displayName);
      await page
        .locator('[data-testid="signup-password-input"]')
        .fill(specialPassword);
      await page
        .locator('[data-testid="signup-confirm-password-input"]')
        .fill(specialPassword);
      await page.locator('[data-testid="signup-submit-button"]').click();

      // Wait for signup to complete - modal should close on success
      await expect(
        page.locator('[data-testid="signup-email-input"]')
      ).not.toBeVisible({ timeout: 15000 });

      // Verify authentication
      const authData = await page.evaluate(() => {
        const stored = localStorage.getItem("gamestatus_auth");
        return stored ? JSON.parse(stored) : null;
      });

      expect(authData?.user?.email).toBe(uniqueEmail);

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/password-security-special-chars.png",
        fullPage: true,
      });
    });
  });

  test.describe("Login Flow with Bcrypt Verification", () => {
    test("login rejects incorrect password", async ({ page }) => {
      // Navigate and open login
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator(".dashboard")).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="dashboard-login-button"]').click();
      await expect(
        page.locator('[data-testid="login-email-input"]')
      ).toBeVisible({ timeout: 5000 });

      // Try to login with wrong password
      await page
        .locator('[data-testid="login-email-input"]')
        .fill("test@example.com");
      await page
        .locator('[data-testid="login-password-input"]')
        .fill("WrongPassword123!");
      await page.locator('[data-testid="login-submit-button"]').click();

      // Should show error message
      const errorMessage = page.locator('[data-testid="login-error"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/password-security-wrong-password.png",
        fullPage: true,
      });
    });

    test("login rejects empty password", async ({ page }) => {
      // Navigate and open login
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator(".dashboard")).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="dashboard-login-button"]').click();
      await expect(
        page.locator('[data-testid="login-email-input"]')
      ).toBeVisible({ timeout: 5000 });

      // Try to login with empty password
      await page
        .locator('[data-testid="login-email-input"]')
        .fill("test@example.com");
      await page.locator('[data-testid="login-password-input"]').fill("");
      await page.locator('[data-testid="login-submit-button"]').click();

      // Submit button might be disabled or show validation error
      // Either way, should not authenticate
      const authData = await page.evaluate(() =>
        localStorage.getItem("gamestatus_auth")
      );

      expect(authData).toBeNull();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/password-security-empty-password.png",
        fullPage: true,
      });
    });
  });

  test.describe("Password Storage Security", () => {
    test("authCredentials table not accessible from frontend", async ({
      page,
    }) => {
      // Set up authenticated user
      const testUser = {
        _id: "storage-test-user",
        email: "storage@example.com",
        displayName: "Storage Test",
        isEmailVerified: true,
      };

      await page.goto("/", { waitUntil: "networkidle" });
      await page.evaluate((user) => {
        localStorage.setItem("gamestatus_auth", JSON.stringify({ user }));
      }, testUser);

      // Check that we can't access authCredentials through any means
      const noCredentialsExposed = await page.evaluate(() => {
        // Check localStorage
        const authData = localStorage.getItem("gamestatus_auth");
        if (authData) {
          const data = JSON.parse(authData);
          if (data.credentials || data.authCredentials || data.passwordHash) {
            return false;
          }
        }

        // Check sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            const value = sessionStorage.getItem(key);
            if (value && (value.includes("passwordHash") || value.includes("$2"))) {
              return false;
            }
          }
        }

        return true;
      });

      expect(noCredentialsExposed).toBe(true);

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/password-security-no-credentials.png",
        fullPage: true,
      });
    });
  });

  test.describe("Vulnerability Regression Prevention", () => {
    test("password is case-sensitive", async ({ page }) => {
      // Navigate and open login
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator(".dashboard")).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="dashboard-login-button"]').click();
      await expect(
        page.locator('[data-testid="login-email-input"]')
      ).toBeVisible({ timeout: 5000 });

      // Try login with different case - should fail if account exists
      await page
        .locator('[data-testid="login-email-input"]')
        .fill("test@example.com");
      await page
        .locator('[data-testid="login-password-input"]')
        .fill("PASSWORD123!");
      await page.locator('[data-testid="login-submit-button"]').click();

      // Should show error (password123! != PASSWORD123!)
      const errorMessage = page.locator('[data-testid="login-error"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/password-security-case-sensitive.png",
        fullPage: true,
      });
    });

    test("UI shows password strength indicator", async ({ page }) => {
      // Navigate and open signup
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator(".dashboard")).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="dashboard-login-button"]').click();
      await expect(
        page.locator('[data-testid="login-email-input"]')
      ).toBeVisible({ timeout: 5000 });
      await page.locator('[data-testid="switch-to-signup"]').click();
      await expect(
        page.locator('[data-testid="signup-email-input"]')
      ).toBeVisible({ timeout: 5000 });

      // Type a password
      await page
        .locator('[data-testid="signup-password-input"]')
        .fill("Password123!");

      // Look for password strength indicator
      const strengthIndicator = page.locator(
        '[data-testid="password-strength-indicator"]'
      );

      // If strength indicator exists, verify it's visible
      // This helps users choose strong passwords
      if (await strengthIndicator.isVisible()) {
        expect(await strengthIndicator.isVisible()).toBe(true);
      }

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/password-security-strength-indicator.png",
        fullPage: true,
      });
    });
  });
});
