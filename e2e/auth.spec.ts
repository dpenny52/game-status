/**
 * E2E Tests for Authentication
 *
 * Tests the authentication flows including:
 * - Login with valid credentials
 * - Login with invalid credentials shows error
 * - Signup flow
 * - Logout flow
 * - Magic link flow
 * - Forgot password flow
 *
 * @module auth.spec
 */
import { test, expect } from "@playwright/test";

// Test user credentials for signup tests - use unique email to avoid conflicts
const SIGNUP_USER = {
  email: `e2e-signup-${Date.now()}@example.com`,
  password: "TestPassword123!",
  displayName: "E2E Test User",
};

test.describe("Authentication Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh state
    await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("Login Flow", () => {
    test("opens login modal from settings page", async ({ page }) => {
      // Navigate to settings page (has Sign In button when unauthenticated)
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Wait for unauthenticated state
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });

      // Click the login button
      const loginButton = page.locator('[data-testid="settings-login-button"]');
      await expect(loginButton).toBeVisible();
      await loginButton.click();

      // Verify login modal appears with email and password fields
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="login-password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-submit-button"]')).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-login-modal.png",
        fullPage: false,
      });
    });

    test("shows error for invalid credentials", async ({ page }) => {
      // Navigate to settings page
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Wait for unauthenticated state and click login
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="settings-login-button"]').click();

      // Wait for login modal
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });

      // Fill in invalid credentials
      await page.locator('[data-testid="login-email-input"]').fill("invalid@example.com");
      await page.locator('[data-testid="login-password-input"]').fill("wrongpassword123");

      // Submit
      await page.locator('[data-testid="login-submit-button"]').click();

      // Wait for error message
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible({ timeout: 5000 });

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-login-error.png",
        fullPage: false,
      });
    });

    test("login form has forgot password link", async ({ page }) => {
      // Navigate to settings page
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Wait for unauthenticated state and click login
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="settings-login-button"]').click();

      // Wait for login modal
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });

      // Verify forgot password link is visible
      const forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
      await expect(forgotPasswordLink).toBeVisible();
    });
  });

  test.describe("Signup Flow", () => {
    test("opens signup modal from login modal", async ({ page }) => {
      // Navigate to settings page
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Wait for unauthenticated state and click login
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="settings-login-button"]').click();

      // Wait for login modal
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });

      // Click switch to signup
      await page.locator('[data-testid="switch-to-signup"]').click();

      // Verify signup modal appears
      await expect(page.locator('[data-testid="signup-email-input"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="signup-displayname-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="signup-password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="signup-confirm-password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="signup-submit-button"]')).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-signup-modal.png",
        fullPage: false,
      });
    });

    test("signup form validates password requirements", async ({ page }) => {
      // Navigate to settings page
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Open signup modal
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="settings-login-button"]').click();
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });
      await page.locator('[data-testid="switch-to-signup"]').click();
      await expect(page.locator('[data-testid="signup-email-input"]')).toBeVisible({ timeout: 5000 });

      // Fill in form with weak password
      await page.locator('[data-testid="signup-email-input"]').fill(SIGNUP_USER.email);
      await page.locator('[data-testid="signup-displayname-input"]').fill(SIGNUP_USER.displayName);
      await page.locator('[data-testid="signup-password-input"]').fill("weak");
      await page.locator('[data-testid="signup-confirm-password-input"]').fill("weak");

      // Submit and expect validation error
      await page.locator('[data-testid="signup-submit-button"]').click();

      // Look for error message about password requirements
      const errorElements = page.locator('.form-error, [role="alert"]');
      await expect(errorElements.first()).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Magic Link Flow", () => {
    test("shows magic link option in login modal", async ({ page }) => {
      // Navigate to settings page
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Open login modal
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="settings-login-button"]').click();

      // Wait for login modal
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });

      // Verify magic link option is visible
      const magicLinkOption = page.locator('[data-testid="magic-link-option"]');
      await expect(magicLinkOption).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-magic-link-option.png",
        fullPage: false,
      });
    });

    test("clicking magic link option shows email form", async ({ page }) => {
      // Navigate to settings page
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Open login modal
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="settings-login-button"]').click();
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });

      // Click magic link option
      await page.locator('[data-testid="magic-link-option"]').click();

      // Verify magic link email form appears
      await expect(page.locator('[data-testid="magic-link-email-input"]')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('[data-testid="magic-link-submit"]')).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-magic-link-form.png",
        fullPage: false,
      });
    });

    test("submitting magic link request shows confirmation", async ({ page }) => {
      // Navigate to settings page
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Open login modal and switch to magic link
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="settings-login-button"]').click();
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });
      await page.locator('[data-testid="magic-link-option"]').click();
      await expect(page.locator('[data-testid="magic-link-email-input"]')).toBeVisible({ timeout: 3000 });

      // Fill in email and submit
      await page.locator('[data-testid="magic-link-email-input"]').fill("test@example.com");
      await page.locator('[data-testid="magic-link-submit"]').click();

      // Wait for confirmation message
      await expect(page.locator('[data-testid="magic-link-sent"]')).toBeVisible({ timeout: 10000 });

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-magic-link-confirmation.png",
        fullPage: false,
      });
    });
  });

  test.describe("Forgot Password Flow", () => {
    test("clicking forgot password opens forgot password form", async ({ page }) => {
      // Navigate to settings page
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Open login modal
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="settings-login-button"]').click();
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });

      // Click forgot password link
      await page.locator('[data-testid="forgot-password-link"]').click();

      // Verify forgot password form appears
      await expect(page.locator('[data-testid="forgot-password-email-input"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="forgot-password-submit"]')).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-forgot-password-form.png",
        fullPage: false,
      });
    });

    test("forgot password form pre-fills email from login form", async ({ page }) => {
      // Navigate to settings page
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Open login modal
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="settings-login-button"]').click();
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });

      // Enter email in login form
      const testEmail = "prefilled@example.com";
      await page.locator('[data-testid="login-email-input"]').fill(testEmail);

      // Click forgot password link
      await page.locator('[data-testid="forgot-password-link"]').click();

      // Verify email is pre-filled
      const forgotPasswordInput = page.locator('[data-testid="forgot-password-email-input"]');
      await expect(forgotPasswordInput).toBeVisible({ timeout: 5000 });
      await expect(forgotPasswordInput).toHaveValue(testEmail);

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-forgot-password-prefilled.png",
        fullPage: false,
      });
    });

    test("submitting forgot password shows success message", async ({ page }) => {
      // Navigate to settings page
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Open login modal and go to forgot password
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="settings-login-button"]').click();
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });
      await page.locator('[data-testid="forgot-password-link"]').click();
      await expect(page.locator('[data-testid="forgot-password-email-input"]')).toBeVisible({ timeout: 5000 });

      // Fill in email and submit
      await page.locator('[data-testid="forgot-password-email-input"]').fill("test@example.com");
      await page.locator('[data-testid="forgot-password-submit"]').click();

      // Wait for success message
      await expect(page.locator('[data-testid="forgot-password-success"]')).toBeVisible({ timeout: 10000 });

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-forgot-password-success.png",
        fullPage: false,
      });
    });

    test("can navigate back to login from forgot password", async ({ page }) => {
      // Navigate to settings page
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Open login modal and go to forgot password
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });
      await page.locator('[data-testid="settings-login-button"]').click();
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });
      await page.locator('[data-testid="forgot-password-link"]').click();
      await expect(page.locator('[data-testid="forgot-password-email-input"]')).toBeVisible({ timeout: 5000 });

      // Click back to login
      await page.locator('[data-testid="forgot-password-back-link"]').click();

      // Verify back at login form
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-back-to-login.png",
        fullPage: false,
      });
    });
  });

  test.describe("Logout Flow", () => {
    test("logout button is visible for authenticated users", async ({ page }) => {
      // Set up authenticated state via localStorage
      await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
      await page.evaluate(() => {
        const mockUser = {
          _id: "test-user-id",
          email: "test@example.com",
          displayName: "Test User",
          isEmailVerified: true,
        };
        localStorage.setItem("gamestatus_auth", JSON.stringify({ user: mockUser }));
      });

      // Navigate to settings
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Wait for settings page (authenticated state)
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Verify logout button is visible
      const logoutButton = page.locator('[data-testid="settings-logout-button"]');
      await expect(logoutButton).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-logout-button.png",
        fullPage: true,
      });
    });

    test("logout clears user state", async ({ page }) => {
      // Set up authenticated state via localStorage
      await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
      await page.evaluate(() => {
        const mockUser = {
          _id: "test-user-id",
          email: "test@example.com",
          displayName: "Test User",
          isEmailVerified: true,
        };
        localStorage.setItem("gamestatus_auth", JSON.stringify({ user: mockUser }));
      });

      // Navigate to settings
      await page.goto("http://localhost:5173/settings", { waitUntil: "networkidle" });

      // Wait for settings page (authenticated state)
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Click logout button
      await page.locator('[data-testid="settings-logout-button"]').click();

      // Wait for confirmation dialog and confirm
      await expect(page.locator('[data-testid="settings-confirm-logout"]')).toBeVisible({ timeout: 3000 });
      await page.locator('[data-testid="settings-confirm-logout"]').click();

      // Wait for logout to complete - should show unauthenticated state
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });

      // Verify localStorage is cleared
      const authState = await page.evaluate(() => localStorage.getItem("gamestatus_auth"));
      expect(authState).toBeNull();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-logout-complete.png",
        fullPage: true,
      });
    });
  });

  test.describe("Dashboard Access", () => {
    test("dashboard is accessible without authentication", async ({ page }) => {
      // Navigate to dashboard
      await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

      // Verify dashboard loads
      await expect(page.locator(".dashboard")).toBeVisible({ timeout: 10000 });
      await expect(page.locator(".dashboard-header")).toBeVisible();
      await expect(page.locator(".dashboard-brand")).toHaveText("GameStatus");

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/auth-dashboard-unauthenticated.png",
        fullPage: true,
      });
    });
  });
});
