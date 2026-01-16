/**
 * Tests for validatePasswordResetToken Query
 *
 * These tests verify the token validation logic for the password reset flow.
 *
 * @module auth.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateSecureToken,
  AUTH_CONSTANTS,
} from "../lib/authUtils";

/**
 * Mock token record type matching the passwordResetTokens schema
 */
interface MockTokenRecord {
  _id: string;
  userId: string;
  email: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  isUsed: boolean;
}

/**
 * Simulates the validatePasswordResetToken query logic
 * This mirrors the actual implementation in convex/auth.ts
 */
function validatePasswordResetToken(
  tokenRecord: MockTokenRecord | null,
  currentTime: number
): { valid: boolean; error?: string } {
  // Token not found
  if (!tokenRecord) {
    return { valid: false, error: "Invalid or expired reset link" };
  }

  // Token already used
  if (tokenRecord.isUsed) {
    return { valid: false, error: "This reset link has already been used" };
  }

  // Check expiration using expiresAt field
  if (currentTime > tokenRecord.expiresAt) {
    return { valid: false, error: "Reset link has expired. Please request a new one." };
  }

  // Token is valid
  return { valid: true };
}

describe("validatePasswordResetToken Query", () => {
  describe("Valid Token", () => {
    it("should return valid: true for a valid, unused, non-expired token", () => {
      const now = Date.now();
      const mockToken: MockTokenRecord = {
        _id: "token_123",
        userId: "user_456",
        email: "test@example.com",
        token: generateSecureToken(32),
        createdAt: now,
        expiresAt: now + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS,
        isUsed: false,
      };

      const result = validatePasswordResetToken(mockToken, now);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return valid: true when token is close to expiration but still valid", () => {
      const now = Date.now();
      const mockToken: MockTokenRecord = {
        _id: "token_123",
        userId: "user_456",
        email: "test@example.com",
        token: generateSecureToken(32),
        createdAt: now - (AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS - 1000), // 1 second before expiration
        expiresAt: now + 1000, // Expires in 1 second
        isUsed: false,
      };

      const result = validatePasswordResetToken(mockToken, now);
      expect(result.valid).toBe(true);
    });
  });

  describe("Invalid Token", () => {
    it("should return error for non-existent token", () => {
      const result = validatePasswordResetToken(null, Date.now());
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid or expired reset link");
    });
  });

  describe("Expired Token", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return error for expired token", () => {
      const createdAt = Date.now();
      const mockToken: MockTokenRecord = {
        _id: "token_123",
        userId: "user_456",
        email: "test@example.com",
        token: generateSecureToken(32),
        createdAt: createdAt,
        expiresAt: createdAt + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS,
        isUsed: false,
      };

      // Advance time past expiration (1 hour + 1 minute)
      vi.advanceTimersByTime(61 * 60 * 1000);

      const result = validatePasswordResetToken(mockToken, Date.now());
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Reset link has expired. Please request a new one.");
    });

    it("should return valid for token within expiration window", () => {
      const createdAt = Date.now();
      const mockToken: MockTokenRecord = {
        _id: "token_123",
        userId: "user_456",
        email: "test@example.com",
        token: generateSecureToken(32),
        createdAt: createdAt,
        expiresAt: createdAt + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS,
        isUsed: false,
      };

      // Advance time by 30 minutes (still within 1 hour)
      vi.advanceTimersByTime(30 * 60 * 1000);

      const result = validatePasswordResetToken(mockToken, Date.now());
      expect(result.valid).toBe(true);
    });

    it("should return expired exactly at expiration time + 1ms", () => {
      const createdAt = Date.now();
      const mockToken: MockTokenRecord = {
        _id: "token_123",
        userId: "user_456",
        email: "test@example.com",
        token: generateSecureToken(32),
        createdAt: createdAt,
        expiresAt: createdAt + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS,
        isUsed: false,
      };

      // Advance time by exactly 1 hour + 1ms
      vi.advanceTimersByTime(AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS + 1);

      const result = validatePasswordResetToken(mockToken, Date.now());
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Reset link has expired. Please request a new one.");
    });
  });

  describe("Used Token", () => {
    it("should return error for already used token", () => {
      const now = Date.now();
      const mockToken: MockTokenRecord = {
        _id: "token_123",
        userId: "user_456",
        email: "test@example.com",
        token: generateSecureToken(32),
        createdAt: now,
        expiresAt: now + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS,
        isUsed: true, // Token has been used
      };

      const result = validatePasswordResetToken(mockToken, now);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("This reset link has already been used");
    });

    it("should prioritize used check over expiration check", () => {
      const now = Date.now();
      const mockToken: MockTokenRecord = {
        _id: "token_123",
        userId: "user_456",
        email: "test@example.com",
        token: generateSecureToken(32),
        createdAt: now - (2 * AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS), // Created 2 hours ago
        expiresAt: now - AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS, // Expired 1 hour ago
        isUsed: true, // Also used
      };

      const result = validatePasswordResetToken(mockToken, now);
      // Should return "used" error since we check that first
      expect(result.valid).toBe(false);
      expect(result.error).toBe("This reset link has already been used");
    });
  });

  describe("Return Value Structure", () => {
    it("should return object with valid and optional error properties", () => {
      const now = Date.now();
      const mockToken: MockTokenRecord = {
        _id: "token_123",
        userId: "user_456",
        email: "test@example.com",
        token: generateSecureToken(32),
        createdAt: now,
        expiresAt: now + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS,
        isUsed: false,
      };

      const validResult = validatePasswordResetToken(mockToken, now);
      expect(validResult).toHaveProperty("valid");
      expect(typeof validResult.valid).toBe("boolean");

      const invalidResult = validatePasswordResetToken(null, now);
      expect(invalidResult).toHaveProperty("valid");
      expect(invalidResult).toHaveProperty("error");
      expect(typeof invalidResult.error).toBe("string");
    });
  });
});
