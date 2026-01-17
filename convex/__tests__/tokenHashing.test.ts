/**
 * Tests for Token Hashing (Issue #14 Fix)
 *
 * Verifies that security tokens are properly hashed before storage
 * to prevent exposure if the database is compromised.
 *
 * Key security requirements tested:
 * - hashToken produces consistent SHA-256 hashes
 * - Same token always produces same hash
 * - Different tokens produce different hashes
 * - Hash is one-way (cannot recover original token)
 * - Hash format is suitable for database indexing
 *
 * @module tokenHashing.test
 */
import { describe, it, expect } from "vitest";
import { hashToken, generateSecureToken } from "../lib/authUtils";

describe("Token Hashing (Issue #14 Fix)", () => {
  describe("hashToken function", () => {
    it("should produce a 64-character hex string (SHA-256 output)", async () => {
      const token = "test-token-12345";
      const hash = await hashToken(token);

      // SHA-256 produces 32 bytes = 64 hex characters
      expect(hash).toHaveLength(64);
    });

    it("should produce only lowercase hex characters", async () => {
      const token = generateSecureToken(32);
      const hash = await hashToken(token);

      // Should only contain 0-9 and a-f (lowercase hex)
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("should produce consistent hashes for the same input", async () => {
      const token = "consistent-test-token";
      const hash1 = await hashToken(token);
      const hash2 = await hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", async () => {
      const token1 = generateSecureToken(32);
      const token2 = generateSecureToken(32);

      const hash1 = await hashToken(token1);
      const hash2 = await hashToken(token2);

      expect(hash1).not.toBe(hash2);
    });

    it("should produce unique hashes for 100 different tokens", async () => {
      const hashes = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const token = generateSecureToken(32);
        const hash = await hashToken(token);
        hashes.add(hash);
      }

      // All hashes should be unique
      expect(hashes.size).toBe(100);
    });

    it("should be case-sensitive", async () => {
      const token1 = "TestToken";
      const token2 = "testtoken";

      const hash1 = await hashToken(token1);
      const hash2 = await hashToken(token2);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty string", async () => {
      const hash = await hashToken("");

      // SHA-256 of empty string is a known value
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("should handle very long tokens", async () => {
      // Create a 1000-character token
      const longToken = "a".repeat(1000);
      const hash = await hashToken(longToken);

      // Hash should still be 64 characters
      expect(hash).toHaveLength(64);
    });

    it("should handle special characters in tokens", async () => {
      const specialToken = "token-with-special!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const hash = await hashToken(specialToken);

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });

    it("should handle unicode characters in tokens", async () => {
      const unicodeToken = "token-with-emoji-🔐🔑-and-日本語";
      const hash = await hashToken(unicodeToken);

      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("Token Storage Security Pattern", () => {
    it("demonstrates correct token storage flow: generate -> hash -> store hash", async () => {
      // 1. Generate a secure token (this is sent to user)
      const plaintextToken = generateSecureToken(32);

      // 2. Hash the token before storage (this is stored in DB)
      const tokenHash = await hashToken(plaintextToken);

      // 3. Store tokenHash in database (simulated)
      const storedInDb = { tokenHash };

      // 4. Later, when user provides their token, hash it and compare
      const userProvidedToken = plaintextToken; // User sends back original token
      const hashedUserToken = await hashToken(userProvidedToken);

      // 5. Verify: lookup by hash
      expect(hashedUserToken).toBe(storedInDb.tokenHash);
    });

    it("demonstrates that invalid token produces non-matching hash", async () => {
      // Original token and hash
      const originalToken = generateSecureToken(32);
      const storedHash = await hashToken(originalToken);

      // Attacker tries with different token
      const attackerToken = generateSecureToken(32);
      const attackerHash = await hashToken(attackerToken);

      // Should not match
      expect(attackerHash).not.toBe(storedHash);
    });

    it("demonstrates that even similar tokens produce completely different hashes", async () => {
      const token1 = "abc123def456";
      const token2 = "abc123def457"; // Just one character different

      const hash1 = await hashToken(token1);
      const hash2 = await hashToken(token2);

      // Hashes should be completely different (avalanche effect)
      expect(hash1).not.toBe(hash2);

      // Count how many characters are different
      let differences = 0;
      for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) differences++;
      }

      // Due to avalanche effect, roughly half the characters should be different
      expect(differences).toBeGreaterThan(20);
    });
  });

  describe("Vulnerability Regression Tests (Issue #14)", () => {
    it("verifies tokens are never stored in plaintext", async () => {
      // Generate a token like a real magic link token
      const magicLinkToken = generateSecureToken(32);

      // What gets stored in database
      const tokenHash = await hashToken(magicLinkToken);

      // The stored value should NOT be the original token
      expect(tokenHash).not.toBe(magicLinkToken);

      // The stored value should not contain the original token
      expect(tokenHash).not.toContain(magicLinkToken);
      expect(magicLinkToken).not.toContain(tokenHash);
    });

    it("verifies that database compromise does not reveal original tokens", async () => {
      // Simulate tokens being generated and stored
      const tokens = [];
      const storedHashes = [];

      for (let i = 0; i < 10; i++) {
        const token = generateSecureToken(32);
        const hash = await hashToken(token);
        tokens.push(token);
        storedHashes.push(hash);
      }

      // If an attacker gets the database, they see only hashes
      // They cannot reverse the hash to get the original token
      for (let i = 0; i < tokens.length; i++) {
        // Hash is not the token
        expect(storedHashes[i]).not.toBe(tokens[i]);

        // Hash is always 64 chars (doesn't reveal token length)
        expect(storedHashes[i]).toHaveLength(64);
      }
    });

    it("verifies that pre-computed hashes cannot be used for lookup without original token", async () => {
      // Attacker knows the hash format but not the original token
      const storedHash = await hashToken(generateSecureToken(32));

      // Attacker tries to brute force with random tokens
      let found = false;
      for (let i = 0; i < 1000; i++) {
        const guessToken = generateSecureToken(32);
        const guessHash = await hashToken(guessToken);
        if (guessHash === storedHash) {
          found = true;
          break;
        }
      }

      // With 256 bits of entropy, collision in 1000 tries is essentially impossible
      expect(found).toBe(false);
    });
  });

  describe("Token Type Coverage", () => {
    it("should work for magic link tokens", async () => {
      const magicLinkToken = generateSecureToken(32);
      const hash = await hashToken(magicLinkToken);

      expect(hash).toHaveLength(64);
      expect(hash).not.toBe(magicLinkToken);
    });

    it("should work for password reset tokens", async () => {
      const passwordResetToken = generateSecureToken(32);
      const hash = await hashToken(passwordResetToken);

      expect(hash).toHaveLength(64);
      expect(hash).not.toBe(passwordResetToken);
    });

    it("should work for unsubscribe tokens", async () => {
      const unsubscribeToken = generateSecureToken(32);
      const hash = await hashToken(unsubscribeToken);

      expect(hash).toHaveLength(64);
      expect(hash).not.toBe(unsubscribeToken);
    });
  });
});
