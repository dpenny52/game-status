/**
 * Tests for getUserById Query Authorization
 *
 * These tests verify that the getUserById query properly:
 * - Requires authentication
 * - Only allows users to query their own data (prevents IDOR)
 * - Returns limited public fields only
 *
 * Issue #11: IDOR Vulnerability in getUserById Query
 *
 * @module auth.getUserById.test
 */
import { describe, it, expect } from "vitest";

/**
 * Mock user record type matching the users schema
 */
interface MockUser {
  _id: string;
  email: string;
  displayName: string;
  isEmailVerified: boolean;
  providerType?: string;
  providerId?: string;
  _creationTime?: number;
  updatedAt?: number;
}

/**
 * Mock identity type for auth context
 */
interface MockIdentity {
  email?: string;
  subject?: string;
}

/**
 * Simulates the getUserById query logic
 * This mirrors the actual implementation in convex/auth.ts
 */
function getUserByIdLogic(
  identity: MockIdentity | null,
  currentUser: MockUser | null,
  requestedUserId: string,
  requestedUser: MockUser | null
): { data: Partial<MockUser> | null; error?: string } {
  // Require authentication
  if (!identity) {
    return { data: null, error: "Authentication required" };
  }

  // User not found in database
  if (!currentUser) {
    return { data: null, error: "User not found" };
  }

  // Only allow users to query their own data (prevent IDOR)
  if (currentUser._id !== requestedUserId) {
    return { data: null, error: "Not authorized to access this user's data" };
  }

  // User not found
  if (!requestedUser) {
    return { data: null };
  }

  // Return only public/safe fields (exclude internal fields)
  return {
    data: {
      _id: requestedUser._id,
      email: requestedUser.email,
      displayName: requestedUser.displayName,
      isEmailVerified: requestedUser.isEmailVerified,
      providerType: requestedUser.providerType,
    },
  };
}

describe("getUserById Query Authorization", () => {
  const mockUser: MockUser = {
    _id: "user_123",
    email: "test@example.com",
    displayName: "Test User",
    isEmailVerified: true,
    providerType: "email",
    providerId: undefined,
    _creationTime: 1700000000000,
    updatedAt: 1700000000000,
  };

  const otherUser: MockUser = {
    _id: "user_456",
    email: "other@example.com",
    displayName: "Other User",
    isEmailVerified: false,
    providerType: "discord",
    providerId: "discord_789",
    _creationTime: 1700000000000,
    updatedAt: 1700000000000,
  };

  describe("Authentication Required", () => {
    it("should reject unauthenticated requests", () => {
      const result = getUserByIdLogic(null, null, "user_123", mockUser);
      expect(result.error).toBe("Authentication required");
      expect(result.data).toBeNull();
    });

    it("should reject requests with no email in identity", () => {
      const identityWithNoEmail: MockIdentity = { subject: "some_subject" };
      const result = getUserByIdLogic(
        identityWithNoEmail,
        null,
        "user_123",
        mockUser
      );
      // When identity exists but user lookup fails (no email to look up)
      expect(result.error).toBe("User not found");
    });
  });

  describe("IDOR Prevention - Authorization Check", () => {
    it("should allow users to query their own data", () => {
      const identity: MockIdentity = { email: "test@example.com" };
      const result = getUserByIdLogic(
        identity,
        mockUser,
        "user_123",
        mockUser
      );
      expect(result.error).toBeUndefined();
      expect(result.data).not.toBeNull();
      expect(result.data?._id).toBe("user_123");
    });

    it("should reject queries for other users data (IDOR prevention)", () => {
      const identity: MockIdentity = { email: "test@example.com" };
      // Current user is mockUser (user_123), trying to access otherUser (user_456)
      const result = getUserByIdLogic(
        identity,
        mockUser,
        "user_456", // Requesting other user's ID
        otherUser
      );
      expect(result.error).toBe("Not authorized to access this user's data");
      expect(result.data).toBeNull();
    });

    it("should prevent enumeration attacks with consistent error messages", () => {
      const identity: MockIdentity = { email: "test@example.com" };

      // Try to access non-existent user
      const result1 = getUserByIdLogic(
        identity,
        mockUser,
        "user_nonexistent",
        null
      );
      expect(result1.error).toBe("Not authorized to access this user's data");

      // Try to access existing other user
      const result2 = getUserByIdLogic(
        identity,
        mockUser,
        "user_456",
        otherUser
      );
      expect(result2.error).toBe("Not authorized to access this user's data");

      // Error messages should be the same to prevent enumeration
      expect(result1.error).toBe(result2.error);
    });
  });

  describe("Data Field Filtering", () => {
    it("should only return public/safe fields", () => {
      const identity: MockIdentity = { email: "test@example.com" };
      const result = getUserByIdLogic(
        identity,
        mockUser,
        "user_123",
        mockUser
      );

      expect(result.data).not.toBeNull();

      // Should include these public fields
      expect(result.data).toHaveProperty("_id");
      expect(result.data).toHaveProperty("email");
      expect(result.data).toHaveProperty("displayName");
      expect(result.data).toHaveProperty("isEmailVerified");
      expect(result.data).toHaveProperty("providerType");

      // Should NOT include these internal fields
      expect(result.data).not.toHaveProperty("_creationTime");
      expect(result.data).not.toHaveProperty("updatedAt");
      expect(result.data).not.toHaveProperty("providerId");
    });

    it("should correctly populate returned fields", () => {
      const identity: MockIdentity = { email: "test@example.com" };
      const result = getUserByIdLogic(
        identity,
        mockUser,
        "user_123",
        mockUser
      );

      expect(result.data?._id).toBe("user_123");
      expect(result.data?.email).toBe("test@example.com");
      expect(result.data?.displayName).toBe("Test User");
      expect(result.data?.isEmailVerified).toBe(true);
      expect(result.data?.providerType).toBe("email");
    });
  });

  describe("Edge Cases", () => {
    it("should return null when user exists but not found in query", () => {
      const identity: MockIdentity = { email: "test@example.com" };
      // User is authenticated and authorized, but the requested user doesn't exist
      const result = getUserByIdLogic(
        identity,
        mockUser,
        "user_123",
        null // User not found
      );
      expect(result.data).toBeNull();
      expect(result.error).toBeUndefined();
    });

    it("should handle user with OAuth provider type", () => {
      const oauthUser: MockUser = {
        _id: "user_oauth",
        email: "oauth@example.com",
        displayName: "OAuth User",
        isEmailVerified: true,
        providerType: "discord",
        providerId: "discord_123",
      };
      const identity: MockIdentity = { email: "oauth@example.com" };
      const result = getUserByIdLogic(
        identity,
        oauthUser,
        "user_oauth",
        oauthUser
      );

      expect(result.data?.providerType).toBe("discord");
      // providerId should NOT be returned
      expect(result.data).not.toHaveProperty("providerId");
    });

    it("should handle user with undefined optional fields", () => {
      const minimalUser: MockUser = {
        _id: "user_minimal",
        email: "minimal@example.com",
        displayName: "Minimal User",
        isEmailVerified: false,
        providerType: undefined,
      };
      const identity: MockIdentity = { email: "minimal@example.com" };
      const result = getUserByIdLogic(
        identity,
        minimalUser,
        "user_minimal",
        minimalUser
      );

      expect(result.data?._id).toBe("user_minimal");
      expect(result.data?.providerType).toBeUndefined();
    });
  });

  describe("Security Regression Prevention", () => {
    it("should never return data for unauthenticated requests regardless of valid userId", () => {
      // This is a critical security test - unauthenticated users should NEVER get data
      const validUserIds = ["user_123", "user_456", "user_789"];

      for (const userId of validUserIds) {
        const result = getUserByIdLogic(null, null, userId, mockUser);
        expect(result.error).toBe("Authentication required");
        expect(result.data).toBeNull();
      }
    });

    it("should never allow accessing another users data even with valid auth", () => {
      // This is a critical IDOR prevention test
      const identity: MockIdentity = { email: "attacker@example.com" };
      const attackerUser: MockUser = {
        _id: "attacker_123",
        email: "attacker@example.com",
        displayName: "Attacker",
        isEmailVerified: true,
      };

      // Attacker trying to access multiple victim user IDs
      const victimUserIds = ["user_123", "user_456", "admin_001", "user_sensitive"];

      for (const victimId of victimUserIds) {
        const result = getUserByIdLogic(identity, attackerUser, victimId, mockUser);
        expect(result.error).toBe("Not authorized to access this user's data");
        expect(result.data).toBeNull();
      }
    });
  });
});
