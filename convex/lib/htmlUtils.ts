/**
 * HTML Utility Functions
 *
 * Provides HTML escaping and sanitization utilities to prevent XSS attacks
 * when generating HTML content (e.g., email templates).
 *
 * @module htmlUtils
 */

/**
 * HTML entity map for escaping special characters.
 * These characters have special meaning in HTML and must be escaped
 * to prevent XSS attacks when interpolating user-controlled content.
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
} as const;

/**
 * Regular expression matching characters that need HTML escaping.
 */
const HTML_ESCAPE_REGEX = /[&<>"'`=/]/g;

/**
 * Escapes HTML special characters in a string to prevent XSS attacks.
 *
 * This function converts the following characters to their HTML entity equivalents:
 * - & → &amp;
 * - < → &lt;
 * - > → &gt;
 * - " → &quot;
 * - ' → &#x27;
 * - / → &#x2F;
 * - ` → &#x60;
 * - = → &#x3D;
 *
 * @param text - The string to escape
 * @returns The escaped string safe for HTML interpolation
 *
 * @example
 * ```typescript
 * const gameName = '<script>alert("XSS")</script>';
 * const safeHtml = `<h1>${escapeHtml(gameName)}</h1>`;
 * // Result: <h1>&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;</h1>
 * ```
 */
export function escapeHtml(text: string): string {
  if (typeof text !== "string") {
    return "";
  }

  return text.replace(HTML_ESCAPE_REGEX, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Escapes a string for safe use in HTML attribute values.
 *
 * This is an alias for escapeHtml since the same escaping rules apply.
 * Using this function makes the intent clearer when escaping attribute values.
 *
 * @param value - The attribute value to escape
 * @returns The escaped string safe for use in HTML attributes
 *
 * @example
 * ```typescript
 * const userInput = '" onclick="alert(1)"';
 * const safeAttr = `<input value="${escapeHtmlAttribute(userInput)}">`;
 * // Result: <input value="&quot; onclick=&quot;alert(1)&quot;">
 * ```
 */
export function escapeHtmlAttribute(value: string): string {
  return escapeHtml(value);
}

/**
 * Validates that a URL is safe for use in HTML (no javascript: protocol, etc.).
 *
 * @param url - The URL to validate
 * @returns True if the URL is safe for HTML use
 *
 * @example
 * ```typescript
 * isSafeUrl("https://example.com"); // true
 * isSafeUrl("javascript:alert(1)"); // false
 * isSafeUrl("data:text/html,..."); // false
 * ```
 */
export function isSafeUrl(url: string): boolean {
  if (typeof url !== "string" || !url.trim()) {
    return false;
  }

  const trimmedUrl = url.trim().toLowerCase();

  // Disallow dangerous protocols
  const dangerousProtocols = [
    "javascript:",
    "data:",
    "vbscript:",
    "file:",
  ];

  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitizes a URL for safe use in HTML href attributes.
 * Returns an empty string if the URL is not safe.
 *
 * @param url - The URL to sanitize
 * @returns The sanitized URL or empty string if unsafe
 *
 * @example
 * ```typescript
 * sanitizeUrl("https://example.com"); // "https://example.com"
 * sanitizeUrl("javascript:alert(1)"); // ""
 * ```
 */
export function sanitizeUrl(url: string): string {
  if (!isSafeUrl(url)) {
    return "";
  }
  return escapeHtmlAttribute(url);
}
