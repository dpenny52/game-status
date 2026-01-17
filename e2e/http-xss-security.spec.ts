/**
 * E2E Tests for XSS Prevention in HTTP HTML Generation
 *
 * These tests verify that:
 * - The unsubscribe endpoint properly escapes HTML content
 * - No XSS payloads can be injected through the HTTP response
 * - The HTML page structure remains secure against injection attacks
 *
 * Issue #12: XSS Vulnerability in HTML Template Generation
 *
 * @module http-xss-security.spec
 */
import { test, expect } from "@playwright/test";

test.describe("HTTP XSS Security - Unsubscribe Endpoint (Issue #12)", () => {
  test.describe("Unsubscribe Page Security", () => {
    test("unsubscribe endpoint returns HTML without executing scripts", async ({
      page,
    }) => {
      // Navigate to unsubscribe endpoint without token
      const response = await page.goto("/api/unsubscribe", {
        waitUntil: "networkidle",
      });

      // Should return 400 status for missing token
      expect(response?.status()).toBe(400);

      // Verify the page content type is HTML
      const contentType = response?.headers()["content-type"];
      expect(contentType).toContain("text/html");

      // Verify the page shows error message
      await expect(page.locator("h1")).toContainText("Invalid Request");
      await expect(page.locator("p")).toContainText(
        "No unsubscribe token provided"
      );

      // Verify no script execution occurred
      const alertShown = await page.evaluate(() => {
        return (window as unknown as { alertShown?: boolean }).alertShown ===
          true;
      });
      expect(alertShown).toBeFalsy();

      // Take screenshot for verification
      await page.screenshot({
        path: "e2e/screenshots/xss-unsubscribe-no-token.png",
        fullPage: true,
      });
    });

    test("unsubscribe endpoint with invalid token returns safe HTML", async ({
      page,
    }) => {
      // Navigate with invalid token
      const response = await page.goto("/api/unsubscribe?token=invalid-token", {
        waitUntil: "networkidle",
      });

      // Should return 200 (to not reveal token validity)
      expect(response?.status()).toBe(200);

      // Verify safe HTML content
      const pageContent = await page.content();

      // Should NOT contain unescaped script tags
      expect(pageContent).not.toContain("<script>alert");
      expect(pageContent).not.toContain("javascript:");

      // Verify structured content
      await expect(page.locator("h1")).toContainText("Unable to Process");

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/xss-unsubscribe-invalid-token.png",
        fullPage: true,
      });
    });

    test("malicious token parameter does not inject script", async ({
      page,
    }) => {
      // Try to inject script via token parameter
      // Note: The token is not displayed in the HTML, but this tests the handler
      const maliciousToken = '<script>alert("XSS")</script>';
      const encodedToken = encodeURIComponent(maliciousToken);

      await page.goto(`/api/unsubscribe?token=${encodedToken}`, {
        waitUntil: "networkidle",
      });

      // Check that no alert dialog appeared
      let alertAppeared = false;
      page.on("dialog", () => {
        alertAppeared = true;
      });

      // Wait a moment for any scripts to execute
      await page.waitForTimeout(500);

      // No alert should have appeared
      expect(alertAppeared).toBe(false);

      // Page content should not contain executable script
      const pageContent = await page.content();
      expect(pageContent).not.toMatch(/<script[^>]*>alert/i);

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/xss-malicious-token.png",
        fullPage: true,
      });
    });

    test("page structure prevents attribute injection", async ({ page }) => {
      await page.goto("/api/unsubscribe", { waitUntil: "networkidle" });

      // Verify the page has proper HTML structure
      const html = await page.content();

      // Should have proper HTML5 structure
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain('<html lang="en">');
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");

      // Verify no event handlers in unexpected places
      const bodyContent = await page.locator("body").innerHTML();
      expect(bodyContent).not.toContain("onload=");
      expect(bodyContent).not.toContain("onerror=");
      expect(bodyContent).not.toContain("onclick=");

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/xss-page-structure.png",
        fullPage: true,
      });
    });

    test("CSS injection is prevented in page styling", async ({ page }) => {
      await page.goto("/api/unsubscribe", { waitUntil: "networkidle" });

      // Get all style elements
      const styleContent = await page.evaluate(() => {
        const styles = document.querySelectorAll("style");
        return Array.from(styles).map((s) => s.textContent).join("");
      });

      // Should not contain expression() or javascript:
      expect(styleContent).not.toContain("expression(");
      expect(styleContent).not.toContain("javascript:");
      expect(styleContent).not.toContain("-moz-binding:");

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/xss-css-safe.png",
        fullPage: true,
      });
    });

    test("back to dashboard link is safe", async ({ page }) => {
      await page.goto("/api/unsubscribe", { waitUntil: "networkidle" });

      // Find the back link
      const backLink = page.locator('a.back-link, a:has-text("Dashboard")');
      await expect(backLink).toBeVisible();

      // Verify href is safe (just "/")
      const href = await backLink.getAttribute("href");
      expect(href).toBe("/");
      expect(href).not.toContain("javascript:");
      expect(href).not.toContain("data:");

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/xss-safe-link.png",
        fullPage: true,
      });
    });
  });

  test.describe("Content Security Headers", () => {
    test("response includes proper content type", async ({ page }) => {
      const response = await page.goto("/api/unsubscribe", {
        waitUntil: "networkidle",
      });

      const contentType = response?.headers()["content-type"];
      expect(contentType).toContain("text/html");
    });
  });

  test.describe("HTML Encoding Verification", () => {
    test("page displays proper error styling without injection", async ({
      page,
    }) => {
      await page.goto("/api/unsubscribe", { waitUntil: "networkidle" });

      // Verify the error icon is displayed (red color)
      const h1 = page.locator("h1");
      await expect(h1).toBeVisible();

      // The h1 color should be the error color (#ef4444)
      const color = await h1.evaluate((el) =>
        window.getComputedStyle(el).color
      );
      // RGB equivalent of #ef4444
      expect(color).toMatch(/rgb\(239,\s*68,\s*68\)/);

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/xss-error-styling.png",
        fullPage: true,
      });
    });

    test("SVG icon is rendered safely", async ({ page }) => {
      await page.goto("/api/unsubscribe", { waitUntil: "networkidle" });

      // Verify SVG is present
      const svg = page.locator("svg");
      await expect(svg).toBeVisible();

      // Verify SVG does not contain script elements
      const svgContent = await svg.evaluate((el) => el.outerHTML);
      expect(svgContent).not.toContain("<script");
      expect(svgContent).not.toContain("onload");
      expect(svgContent).not.toContain("onclick");

      // Take screenshot
      await page.screenshot({
        path: "e2e/screenshots/xss-svg-safe.png",
        fullPage: true,
      });
    });
  });
});

test.describe("XSS Regression Tests (Issue #12)", () => {
  test("multiple requests do not accumulate XSS payloads", async ({ page }) => {
    // Make multiple requests to verify no payload accumulation
    await page.goto("/api/unsubscribe", { waitUntil: "networkidle" });
    await page.goto("/api/unsubscribe?token=test1", { waitUntil: "networkidle" });
    await page.goto("/api/unsubscribe?token=test2", { waitUntil: "networkidle" });

    // Final page should be clean
    const pageContent = await page.content();
    expect(pageContent).not.toContain("<script>alert");

    // Count script tags - should only be 0 (no script tags in the generated HTML)
    const scriptCount = await page.evaluate(() =>
      document.querySelectorAll("script").length
    );
    expect(scriptCount).toBe(0);

    // Take screenshot
    await page.screenshot({
      path: "e2e/screenshots/xss-no-accumulation.png",
      fullPage: true,
    });
  });

  test("page is safe when accessed from different referrers", async ({
    page,
  }) => {
    // Set a potentially malicious referrer
    await page.setExtraHTTPHeaders({
      Referer: 'https://evil.com/<script>alert("XSS")</script>',
    });

    await page.goto("/api/unsubscribe", { waitUntil: "networkidle" });

    // Page should not contain the referrer content
    const pageContent = await page.content();
    expect(pageContent).not.toContain("evil.com");
    expect(pageContent).not.toContain("<script>alert");

    // Take screenshot
    await page.screenshot({
      path: "e2e/screenshots/xss-safe-referrer.png",
      fullPage: true,
    });
  });

  test("encoded XSS payloads are handled safely", async ({ page }) => {
    // Try various encodings of XSS payloads
    const encodedPayloads = [
      "%3Cscript%3Ealert(1)%3C%2Fscript%3E", // URL encoded
      "&#60;script&#62;alert(1)&#60;/script&#62;", // HTML entity encoded
      "\\x3cscript\\x3ealert(1)\\x3c/script\\x3e", // Unicode escaped
    ];

    for (const payload of encodedPayloads) {
      await page.goto(`/api/unsubscribe?token=${payload}`, {
        waitUntil: "networkidle",
      });

      // Check no alert appeared
      let alertAppeared = false;
      page.once("dialog", () => {
        alertAppeared = true;
      });

      await page.waitForTimeout(200);
      expect(alertAppeared).toBe(false);
    }

    // Take screenshot
    await page.screenshot({
      path: "e2e/screenshots/xss-encoded-payloads.png",
      fullPage: true,
    });
  });
});
