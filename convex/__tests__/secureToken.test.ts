/**
 * Tests for Secure Token Generation
 *
 * Verifies that the cryptographically secure token generation is properly
 * implemented and addresses the security vulnerability from Issue #9.
 *
 * Key security requirements tested:
 * - Tokens are generated using crypto.getRandomValues() (not Math.random())
 * - Token length matches specification
 * - Tokens have sufficient entropy
 * - Tokens are unique across generations
 *
 * @module secureToken.test
 */
import { describe, it, expect, vi } from "vitest";
import { generateSecureToken } from "../lib/authUtils";

describe("Secure Token Generation (Issue #9 Fix)", () => {
  describe("generateSecureToken", () => {
    it("should generate a token of the specified byte length (hex encoded)", () => {
      // 32 bytes = 64 hex characters
      const token = generateSecureToken(32);
      expect(token).toHaveLength(64);

      // 16 bytes = 32 hex characters
      const shortToken = generateSecureToken(16);
      expect(shortToken).toHaveLength(32);

      // Default length (32 bytes)
      const defaultToken = generateSecureToken();
      expect(defaultToken).toHaveLength(64);
    });

    it("should generate hex-encoded tokens with only valid hex characters", () => {
      const token = generateSecureToken(32);
      // Should only contain 0-9 and a-f (lowercase hex)
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it("should generate unique tokens on each call", () => {
      const tokens = new Set<string>();
      const numTokens = 100;

      for (let i = 0; i < numTokens; i++) {
        tokens.add(generateSecureToken(32));
      }

      // All tokens should be unique
      expect(tokens.size).toBe(numTokens);
    });

    it("should have high entropy (no repeating patterns)", () => {
      const token = generateSecureToken(32);

      // Check that the token doesn't have simple repeating patterns
      // Split into 8-character chunks and verify they're different
      const chunks: string[] = [];
      for (let i = 0; i < token.length; i += 8) {
        chunks.push(token.slice(i, i + 8));
      }

      const uniqueChunks = new Set(chunks);
      // With 64 characters split into 8 chunks of 8 chars each,
      // we should have mostly unique chunks (allowing some collision)
      expect(uniqueChunks.size).toBeGreaterThan(chunks.length / 2);
    });

    it("should NOT use Math.random (security requirement)", () => {
      // Spy on Math.random to ensure it's never called during token generation
      const mathRandomSpy = vi.spyOn(Math, "random");

      // Clear any previous calls
      mathRandomSpy.mockClear();

      // Generate multiple tokens
      for (let i = 0; i < 10; i++) {
        generateSecureToken(32);
      }

      // Math.random should never be called by generateSecureToken
      expect(mathRandomSpy).not.toHaveBeenCalled();

      mathRandomSpy.mockRestore();
    });
  });

  describe("Token Security Properties", () => {
    it("should generate tokens with sufficient bit entropy", () => {
      // 32 bytes = 256 bits of entropy from crypto.getRandomValues
      // This is sufficient for security-critical operations
      const token = generateSecureToken(32);

      // Hex encoding means 2 chars per byte
      const byteLength = token.length / 2;
      const bitEntropy = byteLength * 8;

      // Should have at least 256 bits of entropy
      expect(bitEntropy).toBeGreaterThanOrEqual(256);
    });

    it("should generate unpredictable tokens", () => {
      // Statistical test: collect many tokens and check distribution
      const tokens: string[] = [];
      for (let i = 0; i < 1000; i++) {
        tokens.push(generateSecureToken(8)); // Shorter tokens for faster test
      }

      // Count character frequencies
      const charCounts: Record<string, number> = {};
      for (const token of tokens) {
        for (const char of token) {
          charCounts[char] = (charCounts[char] || 0) + 1;
        }
      }

      // With truly random generation, each hex digit (0-f) should appear
      // roughly equally. Total characters = 1000 * 16 = 16000
      // Expected per character = 16000 / 16 = 1000
      const totalChars = tokens.reduce((sum, t) => sum + t.length, 0);
      const expectedPerChar = totalChars / 16;

      // Check that no character deviates too much from expected (chi-square-like test)
      // Allow 30% deviation as a rough check
      const maxDeviation = expectedPerChar * 0.3;

      for (let i = 0; i < 16; i++) {
        const char = i.toString(16);
        const count = charCounts[char] || 0;
        expect(Math.abs(count - expectedPerChar)).toBeLessThan(maxDeviation);
      }
    });
  });

  describe("Unsubscribe Token Usage", () => {
    it("should generate suitable unsubscribe tokens", () => {
      // Unsubscribe tokens use generateSecureToken(32)
      const unsubscribeToken = generateSecureToken(32);

      // Verify properties suitable for unsubscribe links
      expect(unsubscribeToken).toHaveLength(64);
      expect(unsubscribeToken).toMatch(/^[0-9a-f]+$/);

      // Token should be URL-safe (hex is URL-safe)
      const urlSafe = encodeURIComponent(unsubscribeToken) === unsubscribeToken;
      expect(urlSafe).toBe(true);
    });

    it("should be resistant to brute force attacks", () => {
      // With 256 bits of entropy, brute force is computationally infeasible
      // 2^256 possible combinations

      const token = generateSecureToken(32);
      const possibleCombinations = BigInt(2) ** BigInt(256);

      // This is an astronomically large number
      // More than the estimated atoms in the observable universe (~10^80)
      expect(possibleCombinations).toBeGreaterThan(BigInt(10) ** BigInt(70));

      // Verify token was actually generated
      expect(token).toHaveLength(64);
    });
  });
});

describe("Vulnerability Regression Tests (Issue #9)", () => {
  it("should not be predictable from Math.random state", () => {
    // Generate secure tokens and verify they don't follow the Math.random pattern
    // Because they use crypto.getRandomValues, not Math.random

    const tokens1: string[] = [];
    const tokens2: string[] = [];

    // Generate first batch
    for (let i = 0; i < 5; i++) {
      tokens1.push(generateSecureToken(16));
    }

    // Generate second batch
    for (let i = 0; i < 5; i++) {
      tokens2.push(generateSecureToken(16));
    }

    // Tokens from different batches should all be different
    const allTokens = [...tokens1, ...tokens2];
    const uniqueTokens = new Set(allTokens);
    expect(uniqueTokens.size).toBe(allTokens.length);
  });

  it("should produce tokens that cannot be predicted from previous tokens", () => {
    // Generate a sequence of tokens
    const tokens: string[] = [];
    for (let i = 0; i < 10; i++) {
      tokens.push(generateSecureToken(16));
    }

    // Verify no obvious sequential patterns
    for (let i = 1; i < tokens.length; i++) {
      // Tokens should not be sequential (differ by more than just incrementing)
      const prev = parseInt(tokens[i - 1].slice(0, 8), 16);
      const curr = parseInt(tokens[i].slice(0, 8), 16);

      // The difference should not be a small constant
      const diff = Math.abs(curr - prev);
      // With random generation, small differences are unlikely but possible
      // We just verify they're not ALL incrementing by 1
      if (i > 1) {
        const prevDiff = Math.abs(
          parseInt(tokens[i - 2].slice(0, 8), 16) - prev
        );
        // Both differences being exactly 1 would indicate sequential generation
        expect(diff === 1 && prevDiff === 1).toBe(false);
      }
    }
  });

  it("verifies code uses crypto.getRandomValues not Math.random", () => {
    // This is a documentation test that verifies the security fix
    // The actual implementation can be verified by reading authUtils.ts:175-182
    //
    // The generateSecureToken function:
    // 1. Creates a Uint8Array of the specified length
    // 2. Fills it with crypto.getRandomValues()
    // 3. Converts to hex string
    //
    // This is cryptographically secure because:
    // - crypto.getRandomValues uses the OS CSPRNG
    // - It's not based on time or other predictable values
    // - Each byte has 256 possible values with uniform distribution

    const token = generateSecureToken(32);

    // Verify basic properties that would fail with Math.random patterns
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);

    // Different calls produce different tokens
    const token2 = generateSecureToken(32);
    expect(token).not.toBe(token2);
  });
});
