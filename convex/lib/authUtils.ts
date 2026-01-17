/**
 * Authentication Utility Functions
 *
 * Provides validation helpers and constants for the authentication system.
 * These utilities are used by both backend mutations and frontend components.
 *
 * @module authUtils
 */

/**
 * Authentication constants for session and token management.
 */
export const AUTH_CONSTANTS = {
  /** Session duration in milliseconds (90 days) */
  SESSION_DURATION_MS: 90 * 24 * 60 * 60 * 1000,

  /** Magic link token expiration in milliseconds (15 minutes) */
  MAGIC_LINK_EXPIRATION_MS: 15 * 60 * 1000,

  /** Password reset token expiration in milliseconds (1 hour) */
  PASSWORD_RESET_EXPIRATION_MS: 60 * 60 * 1000,

  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
} as const;

/**
 * Result type for password validation.
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
}

/**
 * Validates a password against security requirements.
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 letter (a-z or A-Z)
 * - At least 1 number (0-9)
 *
 * @param password - The password to validate
 * @returns Validation result with errors and strength indicator
 *
 * @example
 * ```typescript
 * const result = validatePassword("Password123");
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < AUTH_CONSTANTS.MIN_PASSWORD_LENGTH) {
    errors.push(
      `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters long`
    );
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Password must contain at least 1 letter");
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least 1 number");
  }

  // Calculate password strength
  const strength = calculatePasswordStrength(password);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Calculates password strength based on complexity.
 *
 * Strength levels:
 * - Weak: Meets minimum requirements only
 * - Medium: Has mixed case or special characters
 * - Strong: Has all of: length >= 12, mixed case, numbers, special chars
 *
 * @param password - The password to evaluate
 * @returns Password strength level
 */
export function calculatePasswordStrength(
  password: string
): "weak" | "medium" | "strong" {
  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Complexity scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Determine strength
  if (score >= 6) return "strong";
  if (score >= 4) return "medium";
  return "weak";
}

/**
 * Validates email format using a standard regex pattern.
 *
 * @param email - The email address to validate
 * @returns True if the email format is valid
 *
 * @example
 * ```typescript
 * if (!isValidEmail(email)) {
 *   throw new Error("Invalid email format");
 * }
 * ```
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  // Standard email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates display name requirements.
 *
 * Requirements:
 * - Not empty
 * - Between 1 and 50 characters
 * - No leading/trailing whitespace after trim
 *
 * @param displayName - The display name to validate
 * @returns Validation result with error message if invalid
 */
export function validateDisplayName(displayName: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmed = displayName?.trim() || "";

  if (!trimmed) {
    return { isValid: false, error: "Display name is required" };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: "Display name must be 50 characters or less" };
  }

  return { isValid: true };
}

/**
 * Generates a secure random token for magic links and password resets.
 *
 * @param length - The length of the token in bytes (default: 32)
 * @returns A hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  // In Convex, we use a simple approach with crypto
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Checks if a token has expired based on its creation time.
 *
 * @param createdAt - Timestamp when the token was created
 * @param expirationMs - Token expiration duration in milliseconds
 * @returns True if the token has expired
 */
export function isTokenExpired(
  createdAt: number,
  expirationMs: number
): boolean {
  return Date.now() - createdAt > expirationMs;
}

/**
 * Hashes a token using SHA-256 for secure storage.
 *
 * Security rationale (Issue #14):
 * - Tokens are stored as hashes in the database to prevent exposure
 *   if the database is compromised
 * - SHA-256 is used because tokens are already high-entropy (32 bytes)
 *   so a fast hash is acceptable (unlike passwords which need slow hashes like bcrypt)
 * - The original token is sent to users; the hash is stored in the database
 * - Verification computes hash(providedToken) and compares to stored hash
 *
 * @param token - The plaintext token to hash
 * @returns The SHA-256 hash of the token as a hex string
 */
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
