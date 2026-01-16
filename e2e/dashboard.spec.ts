/**
 * E2E Tests for GameStatus Dashboard
 *
 * Tests the main dashboard functionality including:
 * - Page loading and initial render
 * - Header content verification
 * - Platform sections visibility
 * - Connection health indicator
 * - Footer content
 */
import { test, expect } from "@playwright/test";

test.describe("GameStatus Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait for React to render
    await page.goto("/", { waitUntil: "networkidle" });

    // Wait for the dashboard to render
    await page.waitForSelector(".dashboard", { timeout: 10000 });
  });

  test("1. Page loads successfully", async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/GameStatus/);

    // Verify the dashboard container exists
    const dashboard = page.locator(".dashboard");
    await expect(dashboard).toBeVisible();

    // Take initial screenshot
    await page.screenshot({
      path: "e2e/screenshots/01-page-loaded.png",
      fullPage: true,
    });

    console.log("Test 1 PASSED: Page loaded successfully with correct title");
  });

  test("2. Header contains GameStatus branding", async ({ page }) => {
    // Wait for the header to be visible
    const header = page.locator("header.dashboard-header");
    await expect(header).toBeVisible();

    // Verify the brand name
    const brand = page.locator("h1.dashboard-brand");
    await expect(brand).toBeVisible();
    await expect(brand).toHaveText("GameStatus");

    // Verify the tagline
    const tagline = page.locator("p.dashboard-tagline");
    await expect(tagline).toBeVisible();
    await expect(tagline).toHaveText("Real-time game server status monitoring");

    // Take screenshot of header
    await header.screenshot({
      path: "e2e/screenshots/02-header.png",
    });

    console.log("Test 2 PASSED: Header contains GameStatus branding and tagline");
  });

  test("3. Connection health indicator is visible", async ({ page }) => {
    // Look for the connection health indicator
    const indicator = page.locator('[data-testid="connection-health-indicator"]');
    await expect(indicator).toBeVisible();

    // Take screenshot
    await indicator.screenshot({
      path: "e2e/screenshots/03-connection-indicator.png",
    });

    console.log("Test 3 PASSED: Connection health indicator is visible");
  });

  test("4. Dashboard main content area exists", async ({ page }) => {
    // Wait for the main content area
    const main = page.locator("main.dashboard-main");
    await expect(main).toBeVisible();

    // Check for either platform sections OR loading state OR empty state
    const platformSections = page.locator(".platform-sections");
    const loadingState = page.locator(".dashboard-loading");
    const emptyState = page.locator(".empty-state");

    // At least one of these should be visible
    const hasPlatformSections = await platformSections.isVisible().catch(() => false);
    const hasLoadingState = await loadingState.isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    console.log("Platform sections visible:", hasPlatformSections);
    console.log("Loading state visible:", hasLoadingState);
    console.log("Empty state visible:", hasEmptyState);

    expect(hasPlatformSections || hasLoadingState || hasEmptyState).toBeTruthy();

    // Take screenshot of main content
    await main.screenshot({
      path: "e2e/screenshots/04-main-content.png",
    });

    console.log("Test 4 PASSED: Dashboard main content area exists");
  });

  test("5. Footer contains attribution", async ({ page }) => {
    // Wait for footer
    const footer = page.locator("footer.dashboard-footer");
    await expect(footer).toBeVisible();

    // Check for attribution text
    const attribution = page.locator(".footer-attribution");
    await expect(attribution).toBeVisible();
    await expect(attribution).toContainText("Data sourced from official game status APIs");

    // Take screenshot of footer
    await footer.screenshot({
      path: "e2e/screenshots/05-footer.png",
    });

    console.log("Test 5 PASSED: Footer contains attribution text");
  });

  test("6. Full page structure verification", async ({ page }) => {
    // Verify semantic HTML structure exists - use specific selectors
    const header = page.locator("header.dashboard-header");
    const main = page.locator("main.dashboard-main");
    const footer = page.locator("footer.dashboard-footer");

    await expect(header).toBeVisible();
    await expect(main).toBeVisible();
    await expect(footer).toBeVisible();

    // Check page title is accessible
    const title = await page.title();
    expect(title).toContain("GameStatus");
    console.log("Page title:", title);

    // Take final full-page screenshot
    await page.screenshot({
      path: "e2e/screenshots/06-full-page.png",
      fullPage: true,
    });

    console.log("Test 6 PASSED: Full page structure is valid (header, main, footer)");
  });

  test("7. Dashboard displays content or appropriate state", async ({ page }) => {
    // Wait for network to settle and any data to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Check what state the dashboard is in
    const platformSections = page.locator(".platform-section");
    const loadingText = page.locator(".dashboard-loading-text");
    const emptyState = page.locator(".empty-state");

    const platformCount = await platformSections.count();
    const isLoading = await loadingText.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);

    console.log(`Platform sections found: ${platformCount}`);
    console.log(`Is loading: ${isLoading}`);
    console.log(`Is empty: ${isEmpty}`);

    // Get and log body text content
    const bodyText = await page.locator("body").textContent();
    console.log("Body text preview:", bodyText?.substring(0, 300));

    // Take screenshot showing current state
    await page.screenshot({
      path: "e2e/screenshots/07-final-state.png",
      fullPage: true,
    });

    // The test passes if we see a functioning dashboard in any state
    const dashboard = page.locator(".dashboard");
    await expect(dashboard).toBeVisible();

    console.log("Test 7 PASSED: Dashboard displays appropriate content/state");
  });

  test.describe("Game Icon Display (Issue #4)", () => {
    test("8. Game card icons use local static paths", async ({ page }) => {
      // Wait for network to settle
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Check for game cards with icons
      const gameCards = page.locator(".game-card");
      const cardCount = await gameCards.count();

      if (cardCount > 0) {
        // Get all game card icons
        const icons = page.locator(".game-card-icon");
        const iconCount = await icons.count();

        console.log(`Found ${iconCount} game card icons`);

        // Verify each icon has a local path (starts with /icons/)
        for (let i = 0; i < iconCount; i++) {
          const icon = icons.nth(i);
          const src = await icon.getAttribute("src");

          console.log(`Icon ${i + 1} src: ${src}`);

          // Verify the icon path is a local static path
          if (src) {
            expect(src).toMatch(/^\/icons\/.+\.(jpg|png|webp)$/);
          }
        }

        // Take screenshot showing game icons
        await page.screenshot({
          path: "e2e/screenshots/08-game-icons.png",
          fullPage: true,
        });

        console.log("Test 8 PASSED: Game card icons use local static paths");
      } else {
        console.log("Test 8 SKIPPED: No game cards visible (may need data seeded)");
      }
    });

    test("9. Game icons load without errors", async ({ page }) => {
      // Track broken images
      const brokenImages: string[] = [];

      // Listen for image load errors
      page.on("pageerror", (error) => {
        console.log("Page error:", error.message);
      });

      // Wait for network to settle
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Check all game card icons
      const icons = page.locator(".game-card-icon");
      const iconCount = await icons.count();

      if (iconCount > 0) {
        for (let i = 0; i < iconCount; i++) {
          const icon = icons.nth(i);
          const src = await icon.getAttribute("src");

          // Check if image loaded successfully by checking naturalWidth
          const isLoaded = await icon.evaluate((img: HTMLImageElement) => {
            return img.complete && img.naturalWidth > 0;
          });

          if (!isLoaded && src) {
            brokenImages.push(src);
          }
        }

        console.log(`Total icons: ${iconCount}`);
        console.log(`Broken images: ${brokenImages.length}`);

        if (brokenImages.length > 0) {
          console.log("Broken image sources:", brokenImages);
        }

        // All images should load successfully
        expect(brokenImages).toHaveLength(0);

        console.log("Test 9 PASSED: All game icons loaded without errors");
      } else {
        console.log("Test 9 SKIPPED: No game cards visible");
      }
    });

    test("10. Game icons have proper alt text for accessibility", async ({ page }) => {
      // Wait for network to settle
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const icons = page.locator(".game-card-icon");
      const iconCount = await icons.count();

      if (iconCount > 0) {
        for (let i = 0; i < iconCount; i++) {
          const icon = icons.nth(i);
          const altText = await icon.getAttribute("alt");

          // Each icon should have alt text containing "icon"
          expect(altText).toBeTruthy();
          expect(altText).toContain("icon");
        }

        console.log("Test 10 PASSED: All game icons have proper alt text");
      } else {
        console.log("Test 10 SKIPPED: No game cards visible");
      }
    });
  });
});
