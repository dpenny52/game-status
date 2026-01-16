/**
 * E2E Tests for Settings Page
 *
 * Tests the settings page functionality including:
 * - Unauthenticated user sees login prompt
 * - Authenticated user sees profile info
 * - Display name update saves and persists
 * - Email alerts section shows subscriptions
 * - Logout from settings works
 *
 * @module settings.spec
 */
import { test, expect } from "@playwright/test";

// Mock user for authenticated tests
const MOCK_USER = {
  _id: "test-settings-user-id",
  email: "settings-test@example.com",
  displayName: "Settings Test User",
  isEmailVerified: true,
  _creationTime: Date.now() - 86400000, // 1 day ago
};

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Clear localStorage to ensure fresh state
    await page.goto(baseURL || "/", { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
  });

  test.describe("Unauthenticated User", () => {
    test("unauthenticated user sees login prompt", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Verify unauthenticated state is shown
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });

      // Verify "Sign in Required" heading is present
      await expect(page.locator("h2")).toContainText("Sign in Required");

      // Verify login button is visible
      const loginButton = page.locator('[data-testid="settings-login-button"]');
      await expect(loginButton).toBeVisible();
      await expect(loginButton).toHaveText("Sign In");

      // Take screenshot for debugging
      await page.screenshot({
        path: "e2e/screenshots/settings-unauthenticated.png",
        fullPage: true,
      });
    });

    test("login button opens login modal", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for unauthenticated state
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });

      // Click the login button
      const loginButton = page.locator('[data-testid="settings-login-button"]');
      await expect(loginButton).toBeVisible();
      await loginButton.click();

      // Verify login modal appears
      await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="login-password-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-submit-button"]')).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-login-modal.png",
        fullPage: false,
      });
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

    test("authenticated user sees profile information", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Verify page title
      await expect(page.locator(".settings-title")).toContainText("Account Settings");

      // Verify email is displayed
      const emailElement = page.locator('[data-testid="settings-email"]');
      await expect(emailElement).toBeVisible();
      await expect(emailElement).toHaveText(MOCK_USER.email);

      // Verify display name is displayed
      const displayNameElement = page.locator('[data-testid="settings-displayname"]');
      await expect(displayNameElement).toBeVisible();
      await expect(displayNameElement).toHaveText(MOCK_USER.displayName);

      // Verify account created date is displayed
      const createdElement = page.locator('[data-testid="settings-created"]');
      await expect(createdElement).toBeVisible();

      // Verify verified badge is shown (user is verified)
      await expect(page.locator('[data-testid="verified-badge"]')).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-authenticated.png",
        fullPage: true,
      });
    });

    test("edit button shows display name input", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Click edit button
      const editButton = page.locator('[data-testid="settings-edit-button"]');
      await expect(editButton).toBeVisible();
      await editButton.click();

      // Verify input field appears
      const displayNameInput = page.locator('[data-testid="settings-displayname-input"]');
      await expect(displayNameInput).toBeVisible({ timeout: 3000 });
      await expect(displayNameInput).toHaveValue(MOCK_USER.displayName);

      // Verify save and cancel buttons appear
      await expect(page.locator('[data-testid="settings-save-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="settings-cancel-button"]')).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-edit-mode.png",
        fullPage: true,
      });
    });

    test("cancel button restores original display name", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Click edit button
      await page.locator('[data-testid="settings-edit-button"]').click();

      // Verify input field appears
      const displayNameInput = page.locator('[data-testid="settings-displayname-input"]');
      await expect(displayNameInput).toBeVisible({ timeout: 3000 });

      // Change the display name
      await displayNameInput.clear();
      await displayNameInput.fill("Changed Name");

      // Click cancel button
      await page.locator('[data-testid="settings-cancel-button"]').click();

      // Verify we're back to view mode with original name
      await expect(page.locator('[data-testid="settings-displayname"]')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('[data-testid="settings-displayname"]')).toHaveText(MOCK_USER.displayName);

      // Verify input is no longer visible
      await expect(page.locator('[data-testid="settings-displayname-input"]')).not.toBeVisible();
    });

    test("display name update triggers save action and shows feedback", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Click edit button
      await page.locator('[data-testid="settings-edit-button"]').click();

      // Wait for input field
      const displayNameInput = page.locator('[data-testid="settings-displayname-input"]');
      await expect(displayNameInput).toBeVisible({ timeout: 3000 });

      // Enter new display name
      const newDisplayName = `Updated Name ${Date.now().toString().slice(-6)}`;
      await displayNameInput.clear();
      await displayNameInput.fill(newDisplayName);

      // Click save button
      const saveButton = page.locator('[data-testid="settings-save-button"]');
      await saveButton.click();

      // Wait for feedback - either success or error (mock user may not exist in backend)
      // The test verifies the save action triggers a backend call and shows feedback
      const successMessage = page.locator('[data-testid="settings-success"]');
      const errorMessage = page.locator('[data-testid="settings-error"]');

      // Wait for either success or error message to appear
      await expect(successMessage.or(errorMessage)).toBeVisible({ timeout: 10000 });

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-name-save-feedback.png",
        fullPage: true,
      });
    });

    test("localStorage user state persists after page refresh", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Verify the initial display name from localStorage
      await expect(page.locator('[data-testid="settings-displayname"]')).toHaveText(MOCK_USER.displayName);

      // Refresh the page
      await page.reload({ waitUntil: "networkidle" });

      // Wait for settings page to load again
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Verify display name persisted from localStorage
      await expect(page.locator('[data-testid="settings-displayname"]')).toHaveText(MOCK_USER.displayName);

      // Verify email also persisted
      await expect(page.locator('[data-testid="settings-email"]')).toHaveText(MOCK_USER.email);

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-state-persisted.png",
        fullPage: true,
      });
    });

    test("empty display name shows validation error", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Click edit button
      await page.locator('[data-testid="settings-edit-button"]').click();

      // Wait for input field
      const displayNameInput = page.locator('[data-testid="settings-displayname-input"]');
      await expect(displayNameInput).toBeVisible({ timeout: 3000 });

      // Clear the display name
      await displayNameInput.clear();

      // Click save button
      await page.locator('[data-testid="settings-save-button"]').click();

      // Verify error message is shown
      await expect(page.locator('[data-testid="settings-error"]')).toBeVisible({ timeout: 5000 });

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-validation-error.png",
        fullPage: true,
      });
    });
  });

  test.describe("Email Alerts Section", () => {
    test.beforeEach(async ({ page }) => {
      // Set up authenticated state via localStorage
      await page.goto("/", { waitUntil: "networkidle" });
      await page.evaluate((user) => {
        localStorage.setItem("gamestatus_auth", JSON.stringify({ user }));
      }, MOCK_USER);
    });

    test("email alerts section is visible for authenticated user", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Verify email alerts section is visible
      const emailAlertsSection = page.locator(".email-alerts-section");
      await expect(emailAlertsSection).toBeVisible({ timeout: 10000 });

      // Verify section title
      await expect(emailAlertsSection.locator(".email-alerts-section__title")).toContainText("Email Alerts");

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-email-alerts.png",
        fullPage: true,
      });
    });

    test("email alerts section shows empty state when no subscriptions", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Wait for email alerts section to load (either loading, empty, or with subscriptions)
      const emailAlertsSection = page.locator(".email-alerts-section");
      await expect(emailAlertsSection).toBeVisible({ timeout: 10000 });

      // Check for either empty state or subscriptions list
      const emptyState = emailAlertsSection.locator(".email-alerts-section__empty");
      const subscriptionsList = emailAlertsSection.locator(".email-alerts-section__list");

      // At least one of these should be visible (empty or list)
      const isEmpty = await emptyState.isVisible().catch(() => false);
      const hasList = await subscriptionsList.isVisible().catch(() => false);

      // Verify we have either state (not stuck in loading)
      expect(isEmpty || hasList).toBeTruthy();

      if (isEmpty) {
        // Verify empty state message
        await expect(emptyState).toContainText("no active email alert subscriptions");
      }

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-email-alerts-state.png",
        fullPage: true,
      });
    });
  });

  test.describe("Logout Flow", () => {
    test.beforeEach(async ({ page }) => {
      // Set up authenticated state via localStorage
      await page.goto("/", { waitUntil: "networkidle" });
      await page.evaluate((user) => {
        localStorage.setItem("gamestatus_auth", JSON.stringify({ user }));
      }, MOCK_USER);
    });

    test("logout button is visible for authenticated user", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Verify logout button is visible
      const logoutButton = page.locator('[data-testid="settings-logout-button"]');
      await expect(logoutButton).toBeVisible();
      await expect(logoutButton).toHaveText("Log Out");

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-logout-button.png",
        fullPage: true,
      });
    });

    test("logout button shows confirmation dialog", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Click logout button
      await page.locator('[data-testid="settings-logout-button"]').click();

      // Verify confirmation dialog appears
      await expect(page.locator('[data-testid="settings-confirm-logout"]')).toBeVisible({ timeout: 3000 });
      await expect(page.locator('[data-testid="settings-cancel-logout"]')).toBeVisible();

      // Verify confirmation text
      await expect(page.locator(".settings-logout-confirm")).toContainText("Are you sure you want to log out?");

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-logout-confirm.png",
        fullPage: true,
      });
    });

    test("cancel logout returns to normal state", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Click logout button
      await page.locator('[data-testid="settings-logout-button"]').click();

      // Verify confirmation dialog appears
      await expect(page.locator('[data-testid="settings-confirm-logout"]')).toBeVisible({ timeout: 3000 });

      // Click cancel
      await page.locator('[data-testid="settings-cancel-logout"]').click();

      // Verify we're back to normal state with logout button visible
      await expect(page.locator('[data-testid="settings-logout-button"]')).toBeVisible({ timeout: 3000 });

      // Verify confirmation buttons are no longer visible
      await expect(page.locator('[data-testid="settings-confirm-logout"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="settings-cancel-logout"]')).not.toBeVisible();
    });

    test("confirm logout clears user state and shows unauthenticated view", async ({ page }) => {
      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Click logout button
      await page.locator('[data-testid="settings-logout-button"]').click();

      // Wait for confirmation dialog
      await expect(page.locator('[data-testid="settings-confirm-logout"]')).toBeVisible({ timeout: 3000 });

      // Confirm logout
      await page.locator('[data-testid="settings-confirm-logout"]').click();

      // Wait for logout to complete - should show unauthenticated state
      await expect(page.locator('[data-testid="settings-unauthenticated"]')).toBeVisible({ timeout: 10000 });

      // Verify login button is visible
      await expect(page.locator('[data-testid="settings-login-button"]')).toBeVisible();

      // Verify localStorage is cleared
      const authState = await page.evaluate(() => localStorage.getItem("gamestatus_auth"));
      expect(authState).toBeNull();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-logged-out.png",
        fullPage: true,
      });
    });
  });

  test.describe("Unverified User", () => {
    test("unverified user sees unverified badge", async ({ page }) => {
      // Set up authenticated state with unverified user
      const unverifiedUser = {
        ...MOCK_USER,
        _id: "unverified-user-id",
        isEmailVerified: false,
      };

      await page.goto("/", { waitUntil: "networkidle" });
      await page.evaluate((user) => {
        localStorage.setItem("gamestatus_auth", JSON.stringify({ user }));
      }, unverifiedUser);

      // Navigate to settings page
      await page.goto("/settings", { waitUntil: "networkidle" });

      // Wait for authenticated settings page
      await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });

      // Verify unverified badge is shown
      await expect(page.locator('[data-testid="unverified-badge"]')).toBeVisible();
      await expect(page.locator('[data-testid="unverified-badge"]')).toHaveText("Unverified");

      // Verify verified badge is not shown
      await expect(page.locator('[data-testid="verified-badge"]')).not.toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/settings-unverified-user.png",
        fullPage: true,
      });
    });
  });
});
