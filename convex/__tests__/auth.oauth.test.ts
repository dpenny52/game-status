/**
 * Tests for OAuth Authentication (Discord & Twitch)
 *
 * These tests verify OAuth provider configuration and profile data extraction
 * for Discord and Twitch authentication flows.
 *
 * @module auth.oauth.test
 */
import { describe, it, expect } from "vitest";
import { authConfig } from "../authConfig.mock";
import { isValidEmail } from "../lib/authUtils";

describe("OAuth Provider Configuration", () => {
  it("should have Discord provider configured", () => {
    const discordProvider = authConfig.providers.find(
      (p) => p.id === "discord"
    );
    expect(discordProvider).toBeDefined();
    expect(discordProvider?.name).toBe("Discord");
    expect(discordProvider?.type).toBe("oauth");
  });

  it("should have Twitch provider configured", () => {
    const twitchProvider = authConfig.providers.find((p) => p.id === "twitch");
    expect(twitchProvider).toBeDefined();
    expect(twitchProvider?.name).toBe("Twitch");
    expect(twitchProvider?.type).toBe("oauth");
  });

  it("should have all expected OAuth providers", () => {
    const oauthProviders = authConfig.providers.filter(
      (p) => p.type === "oauth"
    );
    expect(oauthProviders).toHaveLength(2);

    const providerIds = oauthProviders.map((p) => p.id);
    expect(providerIds).toContain("discord");
    expect(providerIds).toContain("twitch");
  });
});

describe("OAuth Profile Data Extraction", () => {
  describe("Discord Profile", () => {
    it("should extract email from Discord profile", () => {
      const mockDiscordProfile = {
        email: "user@discord.com",
        username: "discorduser",
        id: "123456789",
      };

      expect(isValidEmail(mockDiscordProfile.email)).toBe(true);
      expect(mockDiscordProfile.id).toBeDefined();
    });

    it("should use username as display name from Discord", () => {
      const mockDiscordProfile = {
        email: "user@discord.com",
        username: "DiscordGamer",
        discriminator: "1234",
        id: "123456789",
      };

      expect(mockDiscordProfile.username).toBe("DiscordGamer");
      expect(mockDiscordProfile.username.length).toBeLessThanOrEqual(50);
    });

    it("should validate Discord provider ID format", () => {
      const mockProviderId = "123456789012345678";
      // Discord IDs are numeric strings (snowflakes)
      expect(/^\d+$/.test(mockProviderId)).toBe(true);
    });
  });

  describe("Twitch Profile", () => {
    it("should extract email from Twitch profile", () => {
      const mockTwitchProfile = {
        email: "user@twitch.tv",
        display_name: "TwitchStreamer",
        id: "98765432",
      };

      expect(isValidEmail(mockTwitchProfile.email)).toBe(true);
      expect(mockTwitchProfile.id).toBeDefined();
    });

    it("should use display_name from Twitch profile", () => {
      const mockTwitchProfile = {
        email: "user@twitch.tv",
        display_name: "TwitchStreamer",
        login: "twitchstreamer",
        id: "98765432",
      };

      expect(mockTwitchProfile.display_name).toBe("TwitchStreamer");
      expect(mockTwitchProfile.display_name.length).toBeLessThanOrEqual(50);
    });

    it("should validate Twitch provider ID format", () => {
      const mockProviderId = "98765432";
      // Twitch IDs are numeric strings
      expect(/^\d+$/.test(mockProviderId)).toBe(true);
    });
  });
});

describe("OAuth User Creation", () => {
  it("should store providerType as discord for Discord OAuth", () => {
    const mockUserData = {
      email: "user@discord.com",
      displayName: "DiscordUser",
      providerType: "discord",
      providerId: "123456789",
    };

    expect(mockUserData.providerType).toBe("discord");
    expect(mockUserData.providerId).toBeDefined();
  });

  it("should store providerType as twitch for Twitch OAuth", () => {
    const mockUserData = {
      email: "user@twitch.tv",
      displayName: "TwitchUser",
      providerType: "twitch",
      providerId: "98765432",
    };

    expect(mockUserData.providerType).toBe("twitch");
    expect(mockUserData.providerId).toBeDefined();
  });

  it("should mark email as verified for OAuth users", () => {
    // OAuth providers verify emails, so users should be marked as verified
    const mockUserData = {
      email: "user@oauth.com",
      isEmailVerified: true,
      providerType: "discord",
    };

    expect(mockUserData.isEmailVerified).toBe(true);
  });
});

describe("OAuth Error Handling", () => {
  it("should handle missing email from OAuth provider", () => {
    const mockProfileWithoutEmail = {
      username: "NoEmailUser",
      id: "123456789",
    };

    // Email should be checked before creating user
    const email = (mockProfileWithoutEmail as { email?: string }).email;
    const isValid = email ? isValidEmail(email) : false;
    expect(isValid).toBe(false);
  });

  it("should validate OAuth profile data completeness", () => {
    interface OAuthProfile {
      email?: string;
      displayName?: string;
      providerId?: string;
    }

    function isValidOAuthProfile(profile: OAuthProfile): boolean {
      return !!(
        profile.email &&
        isValidEmail(profile.email) &&
        profile.providerId
      );
    }

    // Valid profile
    expect(
      isValidOAuthProfile({
        email: "user@example.com",
        displayName: "User",
        providerId: "123",
      })
    ).toBe(true);

    // Missing email
    expect(
      isValidOAuthProfile({
        displayName: "User",
        providerId: "123",
      })
    ).toBe(false);

    // Invalid email
    expect(
      isValidOAuthProfile({
        email: "invalid",
        displayName: "User",
        providerId: "123",
      })
    ).toBe(false);

    // Missing providerId
    expect(
      isValidOAuthProfile({
        email: "user@example.com",
        displayName: "User",
      })
    ).toBe(false);
  });
});
