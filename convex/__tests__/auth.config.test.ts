/**
 * Tests for Convex Auth Configuration
 *
 * These tests verify that the auth configuration is properly set up,
 * including providers, session settings, and utility functions.
 *
 * @module auth.config.test
 */
import { describe, it, expect } from "vitest";
import { authConfig } from "../authConfig.mock";
import {
  validatePassword,
  isValidEmail,
  AUTH_CONSTANTS,
} from "../lib/authUtils";

describe("Auth Configuration", () => {
  it("should have auth providers configured", () => {
    expect(authConfig).toBeDefined();
    expect(authConfig.providers).toBeDefined();
    expect(Array.isArray(authConfig.providers)).toBe(true);
  });

  it("should configure session duration to 90 days", () => {
    // 90 days in milliseconds
    const expectedDuration = 90 * 24 * 60 * 60 * 1000;
    expect(AUTH_CONSTANTS.SESSION_DURATION_MS).toBe(expectedDuration);
  });
});

describe("Auth Utility Functions", () => {
  describe("validatePassword", () => {
    it("should return valid for password meeting all requirements", () => {
      const result = validatePassword("Password1");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject password shorter than 8 characters", () => {
      const result = validatePassword("Pass1");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 8 characters long"
      );
    });

    it("should reject password without letters", () => {
      const result = validatePassword("12345678");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least 1 letter"
      );
    });

    it("should reject password without numbers", () => {
      const result = validatePassword("PasswordOnly");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least 1 number"
      );
    });
  });

  describe("isValidEmail", () => {
    it("should return true for valid email formats", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("user+tag@example.com")).toBe(true);
    });

    it("should return false for invalid email formats", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("invalid@")).toBe(false);
      expect(isValidEmail("@domain.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });
});
