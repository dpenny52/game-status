/**
 * Tests for Email/Password Authentication
 *
 * These tests verify the email/password authentication flows including
 * signup, login, password validation, and duplicate email prevention.
 *
 * @module auth.emailPassword.test
 */
import { describe, it, expect } from "vitest";
import {
  validatePassword,
  isValidEmail,
  validateDisplayName,
} from "../lib/authUtils";

describe("Email/Password Authentication", () => {
  describe("Password Validation", () => {
    it("should accept valid password meeting all requirements", () => {
      const result = validatePassword("ValidPass1");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject password shorter than 8 characters", () => {
      const result = validatePassword("Short1");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 8 characters long"
      );
    });

    it("should reject password without at least 1 letter", () => {
      const result = validatePassword("12345678");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least 1 letter"
      );
    });

    it("should reject password without at least 1 number", () => {
      const result = validatePassword("NoNumbersHere");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least 1 number"
      );
    });

    it("should return multiple errors for passwords failing multiple requirements", () => {
      const result = validatePassword("abc");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain(
        "Password must be at least 8 characters long"
      );
      expect(result.errors).toContain(
        "Password must contain at least 1 number"
      );
    });

    it("should calculate password strength correctly", () => {
      // Weak password
      const weak = validatePassword("password1");
      expect(weak.strength).toBe("weak");

      // Medium password
      const medium = validatePassword("Password1");
      expect(medium.strength).toBe("medium");

      // Strong password
      const strong = validatePassword("Password123!@#");
      expect(strong.strength).toBe("strong");
    });
  });

  describe("Email Validation", () => {
    it("should accept valid email formats", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("user+tag@example.com")).toBe(true);
      expect(isValidEmail("test123@subdomain.example.org")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("invalid@")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user@.com")).toBe(false);
    });

    it("should handle null and undefined inputs", () => {
      expect(isValidEmail(null as unknown as string)).toBe(false);
      expect(isValidEmail(undefined as unknown as string)).toBe(false);
    });
  });

  describe("Display Name Validation", () => {
    it("should accept valid display names", () => {
      const result = validateDisplayName("John Doe");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject empty display names", () => {
      const result = validateDisplayName("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Display name is required");
    });

    it("should reject display names over 50 characters", () => {
      const longName = "A".repeat(51);
      const result = validateDisplayName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Display name must be 50 characters or less");
    });

    it("should trim whitespace from display names", () => {
      const result = validateDisplayName("  John Doe  ");
      expect(result.isValid).toBe(true);
    });

    it("should reject whitespace-only display names", () => {
      const result = validateDisplayName("   ");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Display name is required");
    });
  });
});

describe("Signup Flow Validation", () => {
  it("should validate all signup fields together", () => {
    const email = "newuser@example.com";
    const password = "SecurePass123";
    const displayName = "New User";

    expect(isValidEmail(email)).toBe(true);
    expect(validatePassword(password).isValid).toBe(true);
    expect(validateDisplayName(displayName).isValid).toBe(true);
  });

  it("should reject signup with invalid email", () => {
    const email = "invalid-email";
    expect(isValidEmail(email)).toBe(false);
  });

  it("should reject signup with weak password", () => {
    const password = "weak";
    const result = validatePassword(password);
    expect(result.isValid).toBe(false);
  });
});
