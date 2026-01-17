# Convex Library Agent Notes

## Overview

The `convex/lib/` directory contains shared utility functions used across the Convex backend.

## Utilities

### authUtils.ts
- `generateSecureToken(length)` - Cryptographically secure token generation using `crypto.getRandomValues()`
- `validatePassword()` - Password validation with strength indicators
- `calculatePasswordStrength()` - Password strength calculation
- `isValidEmail()` - Email format validation
- `validateDisplayName()` - Display name validation (max 50 chars)
- `isTokenExpired()` - Check if a token has expired

### htmlUtils.ts (Added for Issue #13)
- `escapeHtml(text)` - Escapes HTML special characters to prevent XSS
  - Characters escaped: `& < > " ' / \` =`
  - Returns empty string for non-string inputs
- `escapeHtmlAttribute(value)` - Alias for escapeHtml (clearer intent for attributes)
- `isSafeUrl(url)` - Validates URLs against dangerous protocols
  - Blocks: javascript:, data:, vbscript:, file:
  - Returns false for empty/invalid strings
- `sanitizeUrl(url)` - Returns empty string for unsafe URLs, escapes safe URLs

### fetchUtils.ts
- Utilities for HTTP fetch operations with retry logic

### retry.ts
- Exponential backoff retry logic for failed operations

### logger.ts
- Logging utilities for Convex functions

### transitionDetection.ts
- Utilities for detecting game server status transitions

## Key Learnings

1. **HTML Escaping Security**: When interpolating dynamic content into HTML (emails, HTTP responses), always use `escapeHtml()`. The key is that escaping breaks HTML tag structure (`<img` becomes `&lt;img`), making payloads non-executable even if the text content is preserved.

2. **URL Safety**: Always use `isSafeUrl()` to validate URLs before using them in `href` attributes. Dangerous protocols like `javascript:` can execute arbitrary code.

3. **Token Generation**: Always use `generateSecureToken()` instead of `Math.random()` for security-sensitive tokens. The CSPRNG-based approach provides 256 bits of entropy.

4. **Convex Runtime**: The `Buffer` class is NOT available in Convex runtime. Use `btoa()` for base64 encoding.
