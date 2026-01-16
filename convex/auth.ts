/**
 * Authentication Queries and Mutations
 *
 * Provides the backend authentication API including:
 * - User registration (signup)
 * - User login with email/password
 * - Session management
 * - Password reset
 * - Magic link authentication
 * - OAuth callback handling
 *
 * @module auth
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  validatePassword,
  isValidEmail,
  validateDisplayName,
  generateSecureToken,
  isTokenExpired,
  AUTH_CONSTANTS,
} from "./lib/authUtils";

/**
 * Get the currently authenticated user.
 *
 * Returns null if no user is authenticated.
 * This query is reactive and will update when auth state changes.
 *
 * @returns The current user document or null
 *
 * @example
 * ```typescript
 * const user = useQuery(api.auth.getCurrentUser);
 * if (user) {
 *   console.log("Logged in as:", user.displayName);
 * }
 * ```
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Look up user by email from the identity
    const email = identity.email;
    if (!email) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    return user;
  },
});

/**
 * Check if the current request is authenticated.
 *
 * @returns True if the user is authenticated
 */
export const isAuthenticated = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  },
});

/**
 * Sign up a new user with email and password.
 *
 * Creates a new user record after validating:
 * - Email format and uniqueness
 * - Password requirements (min 8 chars, 1 letter, 1 number)
 * - Display name is not empty
 *
 * @param email - User's email address
 * @param password - User's password (will be hashed)
 * @param displayName - User's display name
 * @returns The created user ID
 * @throws Error if validation fails or email already exists
 */
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password, displayName } = args;

    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user with this email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existingUser) {
      throw new Error("An account with this email already exists");
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(". "));
    }

    // Validate display name
    const displayNameValidation = validateDisplayName(displayName);
    if (!displayNameValidation.isValid) {
      throw new Error(displayNameValidation.error!);
    }

    // Create the user record
    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email: normalizedEmail,
      displayName: displayName.trim(),
      isEmailVerified: false,
      updatedAt: now,
    });

    // Store password hash in authCredentials table
    // Note: In production, use proper password hashing (bcrypt, argon2)
    await ctx.db.insert("authCredentials", {
      userId,
      passwordHash: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });

    return { userId };
  },
});

/**
 * Log in a user with email and password.
 *
 * Validates credentials and returns session information.
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns User information on successful login
 * @throws Error if credentials are invalid
 */
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const { email, password } = args;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Get stored credentials
    const credentials = await ctx.db
      .query("authCredentials")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!credentials) {
      throw new Error("Invalid email or password");
    }

    // Verify password - cast passwordHash to string since we know the schema type
    const storedHash = credentials.passwordHash as string;
    const isValidPassword = await verifyPassword(password, storedHash);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    return {
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        isEmailVerified: user.isEmailVerified,
        providerType: user.providerType,
        providerId: user.providerId,
      },
    };
  },
});

/**
 * Update user's display name.
 *
 * Requires authentication. Users can only update their own display name.
 * The userId is derived from the authenticated identity to prevent IDOR attacks.
 *
 * @param displayName - New display name
 * @returns Updated user data
 * @throws Error if not authenticated or user not found
 */
export const updateDisplayName = mutation({
  args: {
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const { displayName } = args;

    // Require authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("Authentication required");
    }

    // Get the current authenticated user from the database
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Validate display name
    const validation = validateDisplayName(displayName);
    if (!validation.isValid) {
      throw new Error(validation.error!);
    }

    // Update user record - userId is derived from auth, not from client
    await ctx.db.patch(user._id, {
      displayName: displayName.trim(),
      updatedAt: Date.now(),
    });

    const updatedUser = await ctx.db.get(user._id);
    return updatedUser;
  },
});

/**
 * Request a magic link for passwordless authentication.
 *
 * Generates a secure token and stores it for verification.
 * In production, this would trigger an email send.
 *
 * @param email - Email address to send magic link to
 * @returns Confirmation that the link was sent
 */
export const requestMagicLink = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;

    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate secure token
    const token = generateSecureToken(32);
    const now = Date.now();

    // Store magic link token
    await ctx.db.insert("magicLinkTokens", {
      email: normalizedEmail,
      token,
      createdAt: now,
      expiresAt: now + AUTH_CONSTANTS.MAGIC_LINK_EXPIRATION_MS,
      isUsed: false,
    });

    // In production: Send email with magic link
    // For now, return success (token would be in email)
    return { success: true, message: "Magic link sent to your email" };
  },
});

/**
 * Verify a magic link token and authenticate the user.
 *
 * @param token - The magic link token
 * @returns User information on successful verification
 */
export const verifyMagicLink = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const { token } = args;

    // Find token record
    const tokenRecord = await ctx.db
      .query("magicLinkTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!tokenRecord) {
      throw new Error("Invalid or expired magic link");
    }

    // Check if token is used
    if (tokenRecord.isUsed) {
      throw new Error("This magic link has already been used");
    }

    // Check expiration - cast createdAt to number since we know the schema type
    const createdAtTime = tokenRecord.createdAt as number;
    if (isTokenExpired(createdAtTime, AUTH_CONSTANTS.MAGIC_LINK_EXPIRATION_MS)) {
      throw new Error("Magic link has expired. Please request a new one.");
    }

    // Mark token as used
    const tokenId = tokenRecord._id as Id<"magicLinkTokens">;
    await ctx.db.patch(tokenId, { isUsed: true });

    // Find or create user - cast email to string since we know the schema type
    const tokenEmail = tokenRecord.email as string;
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", tokenEmail))
      .first();

    if (!user) {
      // Create new user for magic link authentication
      const userId = await ctx.db.insert("users", {
        email: tokenEmail,
        displayName: tokenEmail.split("@")[0], // Default display name
        isEmailVerified: true, // Email verified via magic link
        updatedAt: Date.now(),
      });
      user = await ctx.db.get(userId);
    } else {
      // Mark email as verified since they used magic link
      const existingUserId = user._id as Id<"users">;
      await ctx.db.patch(existingUserId, {
        isEmailVerified: true,
        updatedAt: Date.now(),
      });
      user = await ctx.db.get(existingUserId);
    }

    return { user };
  },
});

/**
 * Request a password reset link.
 *
 * Generates a secure token for password reset.
 * In production, this would trigger an email send.
 *
 * @param email - Email address for the account
 * @returns Confirmation that the reset link was sent
 */
export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;

    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists (don't reveal this to prevent enumeration)
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    // Always return success to prevent email enumeration
    // Only create token if user exists
    if (user) {
      const token = generateSecureToken(32);
      const now = Date.now();

      await ctx.db.insert("passwordResetTokens", {
        userId: user._id,
        email: normalizedEmail,
        token,
        createdAt: now,
        expiresAt: now + AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS,
        isUsed: false,
      });

      // In production: Send email with reset link
    }

    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been sent",
    };
  },
});

/**
 * Reset password using a valid reset token.
 *
 * @param token - The password reset token
 * @param newPassword - The new password to set
 * @returns Success confirmation
 */
export const resetPassword = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const { token, newPassword } = args;

    // Find token record
    const tokenRecord = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!tokenRecord) {
      throw new Error("Invalid or expired reset link");
    }

    // Check if token is used
    if (tokenRecord.isUsed) {
      throw new Error("This reset link has already been used");
    }

    // Check expiration - cast createdAt to number since we know the schema type
    const createdAtTime = tokenRecord.createdAt as number;
    if (isTokenExpired(createdAtTime, AUTH_CONSTANTS.PASSWORD_RESET_EXPIRATION_MS)) {
      throw new Error("Reset link has expired. Please request a new one.");
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(". "));
    }

    // Mark token as used
    const resetTokenId = tokenRecord._id as Id<"passwordResetTokens">;
    await ctx.db.patch(resetTokenId, { isUsed: true });

    // Update password - cast userId to Id<"users"> since we know the schema type
    const tokenUserId = tokenRecord.userId as Id<"users">;
    const credentials = await ctx.db
      .query("authCredentials")
      .withIndex("by_userId", (q) => q.eq("userId", tokenUserId))
      .first();

    const now = Date.now();
    const passwordHash = await hashPassword(newPassword);

    if (credentials) {
      const credentialsId = credentials._id as Id<"authCredentials">;
      await ctx.db.patch(credentialsId, {
        passwordHash,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("authCredentials", {
        userId: tokenUserId,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, message: "Password has been reset successfully" };
  },
});

/**
 * Handle OAuth callback and create/update user.
 *
 * @param provider - OAuth provider (discord or twitch)
 * @param profile - Profile data from OAuth provider
 * @returns User information
 */
export const handleOAuthCallback = mutation({
  args: {
    provider: v.union(v.literal("discord"), v.literal("twitch")),
    profile: v.object({
      email: v.string(),
      displayName: v.string(),
      providerId: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const { provider, profile } = args;

    if (!isValidEmail(profile.email)) {
      throw new Error("Invalid email from OAuth provider");
    }

    const normalizedEmail = profile.email.toLowerCase().trim();

    // Find existing user
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    const now = Date.now();

    if (user) {
      // Update existing user with OAuth provider info if not set
      if (!user.providerType) {
        const existingUserId = user._id as Id<"users">;
        await ctx.db.patch(existingUserId, {
          providerType: provider,
          providerId: profile.providerId,
          isEmailVerified: true, // OAuth emails are verified
          updatedAt: now,
        });
      }
      const userIdForGet = user._id as Id<"users">;
      user = await ctx.db.get(userIdForGet);
    } else {
      // Create new user
      const userId = await ctx.db.insert("users", {
        email: normalizedEmail,
        displayName: profile.displayName || normalizedEmail.split("@")[0],
        isEmailVerified: true, // OAuth emails are verified
        providerType: provider,
        providerId: profile.providerId,
        updatedAt: now,
      });
      user = await ctx.db.get(userId);
    }

    return { user };
  },
});

/**
 * Get user by ID.
 *
 * Requires authentication. Users can only query their own data.
 * Returns limited public fields to prevent information disclosure.
 *
 * @param userId - The user ID to look up
 * @returns User document with limited fields or null
 * @throws Error if not authenticated or not authorized
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // Get the current authenticated user
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Only allow users to query their own data (prevent IDOR)
    if (currentUser._id !== args.userId) {
      throw new Error("Not authorized to access this user's data");
    }

    // Get the requested user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Return only public/safe fields (exclude internal fields)
    return {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      isEmailVerified: user.isEmailVerified,
      providerType: user.providerType,
    };
  },
});

/**
 * Validate a password reset token.
 *
 * Checks if the token exists, hasn't been used, and hasn't expired.
 * Used by the ResetPassword page to validate tokens before showing the form.
 *
 * @param token - The password reset token from the URL
 * @returns Validation result with valid flag and optional error message
 *
 * @example
 * ```typescript
 * const result = useQuery(api.auth.validatePasswordResetToken, { token });
 * if (result?.valid) {
 *   // Show password reset form
 * } else {
 *   // Show error: result?.error
 * }
 * ```
 */
export const validatePasswordResetToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const { token } = args;

    // Find token record by token value
    const tokenRecord = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    // Token not found
    if (!tokenRecord) {
      return { valid: false, error: "Invalid or expired reset link" };
    }

    // Token already used
    if (tokenRecord.isUsed) {
      return { valid: false, error: "This reset link has already been used" };
    }

    // Check expiration using expiresAt field
    const expiresAt = tokenRecord.expiresAt as number;
    if (Date.now() > expiresAt) {
      return { valid: false, error: "Reset link has expired. Please request a new one." };
    }

    // Token is valid
    return { valid: true };
  },
});

// Helper functions for password hashing
// Note: In production, use proper libraries like bcrypt or argon2

/**
 * Hash a password for storage.
 * Note: This is a simplified implementation. Use bcrypt/argon2 in production.
 */
async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or argon2
  // For now, use a simple hash (NOT SECURE FOR PRODUCTION)
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "gamestatus_salt_key");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify a password against a stored hash.
 * Note: This is a simplified implementation. Use bcrypt/argon2 in production.
 */
async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
