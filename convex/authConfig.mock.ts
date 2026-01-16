/**
 * Convex Auth Configuration
 *
 * Configures authentication providers and session settings for the application.
 * This file sets up Email/Password, OAuth (Discord, Twitch), and Magic Link providers.
 *
 * @module auth.config
 */

/**
 * Auth configuration object for Convex Auth.
 *
 * Includes:
 * - Email/Password provider for traditional authentication
 * - Discord OAuth provider for social login
 * - Twitch OAuth provider for social login
 * - Magic Link provider for passwordless authentication
 */
export const authConfig = {
  providers: [
    /**
     * Email/Password Provider
     * Handles traditional email and password authentication.
     */
    {
      id: "password",
      name: "Password",
      type: "credentials" as const,
    },

    /**
     * Discord OAuth Provider
     * Enables "Sign in with Discord" functionality.
     *
     * Environment variables required:
     * - DISCORD_CLIENT_ID
     * - DISCORD_CLIENT_SECRET
     */
    {
      id: "discord",
      name: "Discord",
      type: "oauth" as const,
    },

    /**
     * Twitch OAuth Provider
     * Enables "Sign in with Twitch" functionality.
     *
     * Environment variables required:
     * - TWITCH_CLIENT_ID
     * - TWITCH_CLIENT_SECRET
     */
    {
      id: "twitch",
      name: "Twitch",
      type: "oauth" as const,
    },

    /**
     * Magic Link Provider
     * Enables passwordless email authentication.
     */
    {
      id: "magic-link",
      name: "Magic Link",
      type: "email" as const,
    },
  ],
};

export default authConfig;
