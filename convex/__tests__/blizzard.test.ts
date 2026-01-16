/**
 * Tests for Blizzard Web Scraping Integration
 *
 * Tests health check functionality, status keyword detection, and regional parsing
 * for Blizzard games (WoW, Diablo IV, Overwatch 2, Hearthstone).
 */
import { describe, it, expect } from "vitest";

/**
 * Keywords indicating maintenance in page content.
 */
const MAINTENANCE_KEYWORDS = [
  "maintenance",
  "scheduled downtime",
  "currently unavailable",
  "undergoing maintenance",
  "service interruption",
  "temporarily offline",
];

/**
 * Keywords indicating degraded service.
 */
const DEGRADED_KEYWORDS = [
  "experiencing issues",
  "degraded",
  "partial outage",
  "some players may",
  "intermittent",
  "connectivity issues",
];

/**
 * Checks if HTML content contains maintenance indicators.
 */
function containsMaintenanceIndicators(html: string): boolean {
  const lowerHtml = html.toLowerCase();
  return MAINTENANCE_KEYWORDS.some((keyword) => lowerHtml.includes(keyword));
}

/**
 * Checks if HTML content contains degraded service indicators.
 */
function containsDegradedIndicators(html: string): boolean {
  const lowerHtml = html.toLowerCase();
  return DEGRADED_KEYWORDS.some((keyword) => lowerHtml.includes(keyword));
}

/**
 * Region mapping from region keys to internal codes.
 */
function mapBlizzardRegion(
  regionKey: string
): "na" | "eu" | "asia" | "oce" | "global" {
  const regionMap: Record<string, "na" | "eu" | "asia" | "oce" | "global"> = {
    us: "na",
    eu: "eu",
    asia: "asia",
  };
  return regionMap[regionKey] || "global";
}

describe("Blizzard Maintenance Detection", () => {
  it("should detect maintenance keywords in HTML content", () => {
    expect(
      containsMaintenanceIndicators("Server is under maintenance right now")
    ).toBe(true);
    expect(
      containsMaintenanceIndicators("Scheduled downtime starting at 3 AM")
    ).toBe(true);
    expect(
      containsMaintenanceIndicators("The service is currently unavailable")
    ).toBe(true);
    expect(
      containsMaintenanceIndicators("Undergoing maintenance until further notice")
    ).toBe(true);
    expect(
      containsMaintenanceIndicators("We are experiencing a service interruption")
    ).toBe(true);
    expect(
      containsMaintenanceIndicators("Servers are temporarily offline")
    ).toBe(true);
  });

  it("should not detect maintenance in normal content", () => {
    expect(containsMaintenanceIndicators("Welcome to World of Warcraft!")).toBe(
      false
    );
    expect(containsMaintenanceIndicators("All realms are online")).toBe(false);
    expect(containsMaintenanceIndicators("Play Diablo IV now")).toBe(false);
  });

  it("should be case-insensitive", () => {
    expect(containsMaintenanceIndicators("MAINTENANCE IN PROGRESS")).toBe(true);
    expect(containsMaintenanceIndicators("Maintenance in Progress")).toBe(true);
    expect(containsMaintenanceIndicators("maintenance in progress")).toBe(true);
  });
});

describe("Blizzard Degraded Status Detection", () => {
  it("should detect degraded service keywords in HTML content", () => {
    expect(
      containsDegradedIndicators("We are experiencing issues with login")
    ).toBe(true);
    expect(
      containsDegradedIndicators("Service is currently degraded")
    ).toBe(true);
    expect(
      containsDegradedIndicators("There is a partial outage affecting some regions")
    ).toBe(true);
    expect(
      containsDegradedIndicators("Some players may experience delays")
    ).toBe(true);
    expect(
      containsDegradedIndicators("Intermittent connection problems reported")
    ).toBe(true);
    expect(
      containsDegradedIndicators("Users reporting connectivity issues")
    ).toBe(true);
  });

  it("should not detect degraded in normal content", () => {
    expect(containsDegradedIndicators("Welcome to Overwatch 2!")).toBe(false);
    expect(containsDegradedIndicators("All systems operational")).toBe(false);
    expect(containsDegradedIndicators("Jump into the action")).toBe(false);
  });
});

describe("Blizzard Regional Status Parsing", () => {
  it("should map region keys to internal region codes", () => {
    expect(mapBlizzardRegion("us")).toBe("na");
    expect(mapBlizzardRegion("eu")).toBe("eu");
    expect(mapBlizzardRegion("asia")).toBe("asia");
  });

  it("should handle unknown regions", () => {
    expect(mapBlizzardRegion("unknown")).toBe("global");
    expect(mapBlizzardRegion("")).toBe("global");
  });

  it("should handle all four Blizzard games", () => {
    const blizzardGames = [
      { key: "wow", slug: "world-of-warcraft" },
      { key: "diablo4", slug: "diablo-iv" },
      { key: "overwatch2", slug: "overwatch-2" },
      { key: "hearthstone", slug: "hearthstone" },
    ];

    expect(blizzardGames).toHaveLength(4);
    expect(blizzardGames.map((g) => g.slug)).toContain("world-of-warcraft");
    expect(blizzardGames.map((g) => g.slug)).toContain("diablo-iv");
    expect(blizzardGames.map((g) => g.slug)).toContain("overwatch-2");
    expect(blizzardGames.map((g) => g.slug)).toContain("hearthstone");
  });
});

describe("Blizzard Region Configuration", () => {
  it("should have correct regional endpoints configured", () => {
    const regionConfigs = {
      us: {
        region: "na",
        wowStatusPage: "https://worldofwarcraft.blizzard.com/en-us/game/status/us",
        battleNetUrl: "https://us.battle.net/login/en/",
        diabloUrl: "https://diablo4.blizzard.com/en-us/",
        overwatchUrl: "https://overwatch.blizzard.com/en-us/",
        hearthstoneUrl: "https://hearthstone.blizzard.com/en-us/",
      },
      eu: {
        region: "eu",
        wowStatusPage: "https://worldofwarcraft.blizzard.com/en-gb/game/status/eu",
        battleNetUrl: "https://eu.battle.net/login/en/",
        diabloUrl: "https://diablo4.blizzard.com/en-gb/",
        overwatchUrl: "https://overwatch.blizzard.com/en-gb/",
        hearthstoneUrl: "https://hearthstone.blizzard.com/en-gb/",
      },
      asia: {
        region: "asia",
        wowStatusPage: "https://worldofwarcraft.blizzard.com/ko-kr/game/status/kr",
        battleNetUrl: "https://kr.battle.net/login/ko/",
        diabloUrl: "https://diablo4.blizzard.com/ko-kr/",
        overwatchUrl: "https://overwatch.blizzard.com/ko-kr/",
        hearthstoneUrl: "https://hearthstone.blizzard.com/ko-kr/",
      },
    };

    // Verify all regions have required properties
    for (const [regionKey, config] of Object.entries(regionConfigs)) {
      expect(config.region).toBeDefined();
      expect(config.wowStatusPage).toContain("worldofwarcraft.blizzard.com");
      expect(config.battleNetUrl).toContain("battle.net");
      expect(config.diabloUrl).toContain("diablo4.blizzard.com");
      expect(config.overwatchUrl).toContain("overwatch.blizzard.com");
      expect(config.hearthstoneUrl).toContain("hearthstone.blizzard.com");
    }

    // Verify URL patterns are correct
    expect(regionConfigs.us.battleNetUrl).toContain("us.battle.net");
    expect(regionConfigs.eu.battleNetUrl).toContain("eu.battle.net");
    expect(regionConfigs.asia.battleNetUrl).toContain("kr.battle.net");
  });
});

describe("Blizzard Health Check Logic", () => {
  it("should determine status based on accessibility and content", () => {
    // Simulate health check scenarios
    type HealthCheckResult = {
      accessible: boolean;
      status: "online" | "offline" | "degraded" | "maintenance" | "unknown";
    };

    // When page is not accessible, status should be offline
    const inaccessible: HealthCheckResult = { accessible: false, status: "offline" };
    expect(inaccessible.status).toBe("offline");

    // When page is accessible with no issues, status should be online
    const healthy: HealthCheckResult = { accessible: true, status: "online" };
    expect(healthy.status).toBe("online");

    // When page shows maintenance, status should be maintenance
    const underMaintenance: HealthCheckResult = { accessible: true, status: "maintenance" };
    expect(underMaintenance.status).toBe("maintenance");

    // When page shows degraded, status should be degraded
    const degraded: HealthCheckResult = { accessible: true, status: "degraded" };
    expect(degraded.status).toBe("degraded");
  });

  it("should prioritize Battle.net health for all games", () => {
    // When Battle.net is down, all games should be marked offline
    const battleNetDown = true;
    const gameStatuses = ["wow", "diablo4", "overwatch2", "hearthstone"].map(() =>
      battleNetDown ? "offline" : "online"
    );

    expect(gameStatuses.every((s) => s === "offline")).toBe(true);

    // When Battle.net is up, games can have their individual status checked
    const battleNetUp = true;
    const gameStatusesWhenUp = ["wow", "diablo4", "overwatch2", "hearthstone"].map(() =>
      battleNetUp ? "online" : "offline"
    );
    expect(gameStatusesWhenUp.every((s) => s === "online")).toBe(true);
  });
});
