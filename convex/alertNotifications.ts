/**
 * Alert Notifications Module
 *
 * Handles the processing and sending of email notifications when game servers
 * transition from offline to online status.
 *
 * @module alertNotifications
 */

import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { regionValidator } from "./schema";
import type { Id } from "./_generated/dataModel";
import type { Region } from "./schema";
import { generateSecureToken, hashToken } from "./lib/authUtils";
import { escapeHtml, sanitizeUrl } from "./lib/htmlUtils";
import { internal } from "./_generated/api";

/**
 * Constants for alert notification configuration.
 */
export const ALERT_CONSTANTS = {
  /** Cooldown period in milliseconds (30 minutes) */
  COOLDOWN_MS: 30 * 60 * 1000,
  /** Maximum retry attempts for email sending */
  MAX_RETRY_ATTEMPTS: 3,
  /** Base retry delay in milliseconds (1 second) */
  BASE_RETRY_DELAY_MS: 1000,
} as const;

/**
 * Internal query to get game details by ID.
 */
export const getGameById = internalQuery({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    return await ctx.db.get(gameId);
  },
});

/**
 * Internal query to get user details by ID.
 */
export const getUserById = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

/**
 * Internal query to get eligible subscriptions for alert processing.
 *
 * Returns subscriptions that:
 * - Match the game+region
 * - Are active (isActive === true)
 * - Are outside the 30-minute cooldown window
 */
export const getEligibleSubscriptions = internalQuery({
  args: {
    gameId: v.id("games"),
    region: regionValidator,
  },
  handler: async (ctx, { gameId, region }) => {
    const now = Date.now();
    const cooldownThreshold = now - ALERT_CONSTANTS.COOLDOWN_MS;

    // Query subscriptions by gameId, then filter by region
    // Note: Convex compound indexes use .eq chaining within the same query builder
    const allSubscriptions = await ctx.db
      .query("alertSubscriptions")
      .withIndex("by_gameId_region", (q) => q.eq("gameId", gameId))
      .collect();

    // Filter by region and active status, and check cooldown
    return allSubscriptions.filter((sub) => {
      // Filter by region
      if (sub.region !== region) return false;
      // Filter by active status
      if (!sub.isActive) return false;

      // Allow if never sent or outside cooldown window
      const lastSent = sub.lastAlertSentAt;
      if (lastSent === undefined || lastSent === null) return true;
      return (lastSent as number) < cooldownThreshold;
    });
  },
});

/**
 * Updates the lastAlertSentAt timestamp for a subscription.
 * Called after an alert email send is initiated (not after success).
 */
export const updateLastAlertSent = internalMutation({
  args: {
    subscriptionId: v.id("alertSubscriptions"),
  },
  handler: async (ctx, { subscriptionId }) => {
    await ctx.db.patch(subscriptionId, {
      lastAlertSentAt: Date.now(),
    });
  },
});

/**
 * Regenerates the unsubscribe token for a subscription.
 * Called before sending an alert email to provide a fresh unsubscribe link.
 *
 * Issue #14: Returns the plaintext token for email inclusion while storing
 * only the hash in the database. This also rotates tokens with each email,
 * limiting the window of exposure if a token is compromised.
 */
export const regenerateUnsubscribeToken = internalMutation({
  args: {
    subscriptionId: v.id("alertSubscriptions"),
  },
  handler: async (ctx, { subscriptionId }) => {
    const subscription = await ctx.db.get(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Generate new token and hash (Issue #14)
    const unsubscribeToken = generateSecureToken(32);
    const unsubscribeTokenHash = await hashToken(unsubscribeToken);

    // Update subscription with new hash
    await ctx.db.patch(subscriptionId, {
      unsubscribeTokenHash,
    });

    // Return plaintext token for email
    return { unsubscribeToken };
  },
});

/**
 * Creates a new alert subscription with a generated unsubscribe token.
 * Returns both the subscription ID and the plaintext token for email sending.
 *
 * Issue #14: The token is stored as a SHA-256 hash; the plaintext is returned
 * for inclusion in email unsubscribe links.
 */
export const createSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    gameId: v.id("games"),
    region: regionValidator,
  },
  handler: async (ctx, { userId, gameId, region }) => {
    // Check for existing subscription by querying with the compound index
    const existingSubscriptions = await ctx.db
      .query("alertSubscriptions")
      .withIndex("by_userId_gameId_region", (q) => q.eq("userId", userId))
      .collect();

    const existing = existingSubscriptions.find(
      (sub) => sub.gameId === gameId && sub.region === region
    );

    if (existing) {
      throw new Error("Subscription already exists for this game and region");
    }

    // Generate unique unsubscribe token and hash it (Issue #14)
    const unsubscribeToken = generateSecureToken(32);
    const unsubscribeTokenHash = await hashToken(unsubscribeToken);

    // Create subscription with hashed token
    const subscriptionId = await ctx.db.insert("alertSubscriptions", {
      userId,
      gameId,
      region,
      isActive: true,
      unsubscribeTokenHash,
      createdAt: Date.now(),
    });

    // Return both ID and plaintext token (token is needed for email links)
    return { subscriptionId, unsubscribeToken };
  },
});

/**
 * Deactivates a subscription using the unsubscribe token.
 * Used by the one-click unsubscribe endpoint.
 *
 * Issue #14: The provided plaintext token is hashed before lookup,
 * as only hashes are stored in the database.
 */
export const deactivateByToken = internalMutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    // Hash the provided token to look up the stored hash (Issue #14)
    const tokenHash = await hashToken(token);

    const subscription = await ctx.db
      .query("alertSubscriptions")
      .withIndex("by_unsubscribeTokenHash", (q) => q.eq("unsubscribeTokenHash", tokenHash))
      .first();

    if (!subscription) {
      return { success: false, reason: "invalid_token" };
    }

    if (!subscription.isActive) {
      return { success: true, reason: "already_unsubscribed" };
    }

    const subscriptionId = subscription._id as Id<"alertSubscriptions">;
    await ctx.db.patch(subscriptionId, {
      isActive: false,
    });

    return { success: true, reason: "unsubscribed" };
  },
});

/**
 * Toggles the active state of a subscription.
 * Used by the notification preferences UI.
 */
export const toggleSubscription = internalMutation({
  args: {
    subscriptionId: v.id("alertSubscriptions"),
    isActive: v.boolean(),
  },
  handler: async (ctx, { subscriptionId, isActive }) => {
    const subscription = await ctx.db.get(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(subscriptionId, {
      isActive,
    });

    return { success: true };
  },
});

/**
 * Deletes a subscription entirely.
 * Used when a user removes a subscription from the UI.
 */
export const deleteSubscription = internalMutation({
  args: {
    subscriptionId: v.id("alertSubscriptions"),
  },
  handler: async (ctx, { subscriptionId }) => {
    const subscription = await ctx.db.get(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.delete(subscriptionId);

    return { success: true };
  },
});

/**
 * Processes alerts for a game+region that transitioned from offline to online.
 *
 * This internal action:
 * 1. Queries all active subscriptions for the game+region
 * 2. Filters out subscriptions within the 30-minute cooldown window
 * 3. Regenerates unsubscribe tokens for each subscription (Issue #14)
 * 4. Dispatches email sending for each eligible subscription
 */
export const processAlerts = internalAction({
  args: {
    gameId: v.id("games"),
    region: regionValidator,
  },
  handler: async (ctx, { gameId, region }) => {
    console.log(`[INFO] Processing alerts for game ${gameId}, region ${region}`);

    // Get game details
    const game = await ctx.runQuery(internal.alertNotifications.getGameById, { gameId });
    if (!game) {
      console.error(`[ERROR] Game not found: ${gameId}`);
      return;
    }

    // Get eligible subscriptions (active and outside cooldown window)
    const eligibleSubscriptions = await ctx.runQuery(
      internal.alertNotifications.getEligibleSubscriptions,
      { gameId, region }
    );

    console.log(`[INFO] Found ${eligibleSubscriptions.length} eligible subscriptions for ${game.displayName}/${region}`);

    // Process each eligible subscription
    for (const subscription of eligibleSubscriptions) {
      // Get user email
      const userId = subscription.userId as Id<"users">;
      const user = await ctx.runQuery(internal.alertNotifications.getUserById, {
        userId,
      });

      if (!user) {
        console.warn(`[WARN] User not found for subscription ${subscription._id}`);
        continue;
      }

      // Regenerate unsubscribe token for this email (Issue #14: rotate tokens)
      // This returns a fresh plaintext token while storing only the hash
      const { unsubscribeToken } = await ctx.runMutation(
        internal.alertNotifications.regenerateUnsubscribeToken,
        { subscriptionId: subscription._id as Id<"alertSubscriptions"> }
      );

      // Schedule email sending with the fresh plaintext token
      await ctx.scheduler.runAfter(0, internal.alertNotifications.sendAlertEmail, {
        subscriptionId: subscription._id as Id<"alertSubscriptions">,
        userEmail: user.email as string,
        gameName: game.displayName as string,
        region,
        unsubscribeToken,
        attemptNumber: 0,
      });
    }
  },
});

/**
 * Sends an alert email via Resend API.
 *
 * Implements exponential backoff retry logic:
 * - Attempt 1: immediate
 * - Attempt 2: 1 second delay
 * - Attempt 3: 2 seconds delay
 * - Attempt 4: 4 seconds delay (max)
 */
export const sendAlertEmail = internalAction({
  args: {
    subscriptionId: v.id("alertSubscriptions"),
    userEmail: v.string(),
    gameName: v.string(),
    region: regionValidator,
    unsubscribeToken: v.string(),
    attemptNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const { subscriptionId, userEmail, gameName, region, unsubscribeToken, attemptNumber } = args;

    console.log(
      `[INFO] Sending alert email to ${userEmail} for ${gameName}/${region} (attempt ${attemptNumber + 1})`
    );

    try {
      // Get Resend API key from environment
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.error("[ERROR] RESEND_API_KEY environment variable not set");
        return;
      }

      // Build email content
      // Escape all user-controlled/dynamic content to prevent XSS (Issue #13)
      const safeGameName = escapeHtml(gameName);
      const safeRegion = escapeHtml(region.toUpperCase());
      const subject = `${gameName} is back online - ${region.toUpperCase()}`;
      const timestamp = new Date().toISOString();
      const baseUrl = process.env.CONVEX_SITE_URL || "";
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
      const dashboardUrl = sanitizeUrl(baseUrl) || "#";

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">${safeGameName} is back online!</h2>
          <p>The ${safeGameName} servers in the <strong>${safeRegion}</strong> region are now online.</p>
          <p style="color: #666;">Status changed at: ${escapeHtml(timestamp)}</p>
          <p>
            <a href="${dashboardUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
              View Dashboard
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            You received this email because you subscribed to alerts for ${safeGameName}.
            <a href="${escapeHtml(unsubscribeUrl)}" style="color: #6366f1;">Unsubscribe</a>
          </p>
        </div>
      `;

      // Send via Resend API
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "GameStatus Alerts <alerts@gamestatus.app>",
          to: userEmail,
          subject,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error: ${response.status} - ${errorText}`);
      }

      console.log(`[INFO] Alert email sent successfully to ${userEmail}`);

      // Update lastAlertSentAt
      await ctx.runMutation(internal.alertNotifications.updateLastAlertSent, {
        subscriptionId,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[ERROR] Failed to send alert email: ${errorMessage}`);

      // Retry with exponential backoff if attempts remaining
      if (attemptNumber + 1 < ALERT_CONSTANTS.MAX_RETRY_ATTEMPTS) {
        const delayMs = ALERT_CONSTANTS.BASE_RETRY_DELAY_MS * Math.pow(2, attemptNumber);
        console.log(`[INFO] Scheduling retry in ${delayMs}ms (attempt ${attemptNumber + 2})`);

        await ctx.scheduler.runAfter(delayMs, internal.alertNotifications.sendAlertEmail, {
          subscriptionId,
          userEmail,
          gameName,
          region,
          unsubscribeToken,
          attemptNumber: attemptNumber + 1,
        });
      } else {
        console.error(`[ERROR] Max retry attempts exhausted for subscription ${subscriptionId}`);
      }
    }
  },
});
