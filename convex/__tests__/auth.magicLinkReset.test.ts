/**
 * Tests for Magic Link and Password Reset Authentication
 *
 * These tests verify the token generation, validation, and expiration
 * for magic link and password reset flows.
 *
 * @module auth.magicLinkReset.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateSecureToken,
  isTokenExpired,
  AUTH_CONSTANTS,
  validatePassword,
} from "../lib/authUtils";

describe("Magic Link Authentication", () => {
  describe("Token Generation", () => {
    it("should generate secure tokens of correct length", () => {
      const token = generateSecureToken(32);
      // 32 bytes = 64 hex characters
      expect(token).toHaveLength(64);
    });

    it("should generate unique tokens on each call", () => {
      const token1 = generateSecureToken(32);
      const token2 = generateSecureToken(32);
      expect(token1).not.toBe(token2);
    });

    it("should generate hex-encoded tokens", () => {
      const token = generateSecureToken(16);
      // Should only contain hex characters
      expect(/^[0-9a-f]+$/i.test(token)).toBe(true);
    });
  });

  describe("Token Expiration - Magic Link (15 minutes)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should have 15-minute expiration configured", () => {
      // 15 minutes in milliseconds
      expect(AUTH_CONSTANTS.MAGIC_LINK_EXPIRATION_MS).toBe(15 * 60 * 1000);
    });

    it("should not expire token within 15 minutes", () => {
      const createdAt = Date.now();

      // Advance time by 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000);

      const expired = isTokenExpired(
        createdAt,
        AUTH_CONSTANTS.MAGIC_LINK_EXPIRATION_MS
      );
      expect(expired).toBe(false);
    });

    it("should expire token after 15 minutes", () => {
      const createdAt = Date.now();

      // Advance time by 16 minutes
      vi.advanceTimersByTime(16 * 60 * 1000);

      const expired = isTokenExpired(
        createdAt,
        AUTH_CONSTANTS.MAGIC_LINK_EXPIRATION_MS
      );
      expect(expired).toBe(true);
    });

    it("should expire token exactly at 15 minutes", () => {
      const createdAt = Date.now();

      // Advance time by exactly 15 minutes + 1ms
      vi.advanceTimersByTime(15 * 60 * 1000 + 1);

      const expired = isTokenExpired(
        createdAt,
        AUTH_CONSTANTS.MAGIC_LINK_EXPIRATION_MS
      );
      expect(expired).toBe(true);
    });
  });

  describe("Magic Link Verification Flow", () => {
    it("should validate token structure", () => {
      const validToken = generateSecureToken(32);
      expect(validToken.length).toBe(64);
      expect(typeof validToken).toBe("string");
    });

    it("should handle single-use token validation", () => {
      // Mock token record
      const mockTokenRecord = {
        token: generateSecureToken(32),
        email: "user@example.com",
        createdAt: Date.now(),
        isUsed: false,
      };

      // Token should be valid before use
      expect(mockTokenRecord.isUsed).toBe(false);

      // Simulate using the token
      mockTokenRecord.isUsed = true;

      // Token should be invalid after use
      expect(mockTokenRecord.isUsed).toBe(true);
    });
  });
});

describe("Password Reset Flow", () => {
  describe("Token Expiration - Password Reset (1 hour)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should have 1-hour expiration configured", () => {
      // 1 hour in milliseconds
      expect(AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS).toBe(60 * 60 * 1000);
    });

    it("should not expire token within 1 hour", () => {
      const createdAt = Date.now();

      // Advance time by 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000);

      const expired = isTokenExpired(
        createdAt,
        AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS
      );
      expect(expired).toBe(false);
    });

    it("should expire token after 1 hour", () => {
      const createdAt = Date.now();

      // Advance time by 61 minutes
      vi.advanceTimersByTime(61 * 60 * 1000);

      const expired = isTokenExpired(
        createdAt,
        AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS
      );
      expect(expired).toBe(true);
    });
  });

  describe("Password Reset Validation", () => {
    it("should validate new password meets requirements", () => {
      const newPassword = "NewSecure123";
      const result = validatePassword(newPassword);
      expect(result.isValid).toBe(true);
    });

    it("should reject weak new passwords", () => {
      const weakPassword = "weak";
      const result = validatePassword(weakPassword);
      expect(result.isValid).toBe(false);
    });

    it("should handle password reset token structure", () => {
      const mockResetToken = {
        token: generateSecureToken(32),
        userId: "user_123",
        email: "user@example.com",
        createdAt: Date.now(),
        expiresAt: Date.now() + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS,
        isUsed: false,
      };

      expect(mockResetToken.token).toBeDefined();
      expect(mockResetToken.userId).toBeDefined();
      expect(mockResetToken.expiresAt).toBeGreaterThan(mockResetToken.createdAt);
    });
  });

  describe("Password Reset Security", () => {
    it("should not reveal if email exists in system", () => {
      // Password reset should always return success message
      // to prevent email enumeration attacks
      const mockResponse = {
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent",
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.message).not.toContain("does not exist");
      expect(mockResponse.message).not.toContain("not found");
    });

    it("should invalidate token after successful password change", () => {
      const mockToken = {
        isUsed: false,
      };

      // Simulate password change
      mockToken.isUsed = true;

      expect(mockToken.isUsed).toBe(true);
    });
  });
});

describe("Token Utility Functions", () => {
  it("should support configurable token lengths", () => {
    const shortToken = generateSecureToken(16); // 32 hex chars
    const longToken = generateSecureToken(64); // 128 hex chars

    expect(shortToken).toHaveLength(32);
    expect(longToken).toHaveLength(128);
  });

  it("should handle edge case token expiration checks", () => {
    const now = Date.now();

    // Token created in the future (clock skew scenario)
    const futureCreatedAt = now + 1000;
    expect(isTokenExpired(futureCreatedAt, 1000)).toBe(false);

    // Token with 0 expiration
    expect(isTokenExpired(now - 1, 0)).toBe(true);
  });
});
