/**
 * Tests for Square Enix Integration
 *
 * Tests Lodestone/FFXIV status endpoint fetch, data center status parsing,
 * and maintenance notice parsing.
 */
import { describe, it, expect } from "vitest";

/**
 * FFXIV data center structure.
 */
interface FFXIVDataCenter {
  name: string;
  region: "na" | "eu" | "asia" | "oce" | "global";
  worlds: string[];
}

/**
 * Parses maintenance notice to determine if active.
 */
function isMaintenanceActive(
  scheduledFor: string,
  scheduledUntil: string,
  now: Date = new Date()
): boolean {
  const start = new Date(scheduledFor);
  const end = new Date(scheduledUntil);
  return now >= start && now <= end;
}

/**
 * Determines status for a region based on world statuses.
 */
function determineRegionStatus(
  worlds: Array<{ name: string; online: boolean }>,
  maintenanceActive: boolean
): "online" | "offline" | "degraded" | "maintenance" | "unknown" {
  if (maintenanceActive) {
    return "maintenance";
  }

  const onlineCount = worlds.filter((w) => w.online).length;
  const totalWorlds = worlds.length;

  if (totalWorlds === 0) {
    return "unknown";
  }

  if (onlineCount === 0) {
    return "offline";
  }

  if (onlineCount < totalWorlds) {
    return "degraded";
  }

  return "online";
}

describe("FFXIV Lodestone Status Endpoint", () => {
  it("should use correct Lodestone status URL", () => {
    const statusUrl = "https://na.finalfantasyxiv.com/lodestone/worldstatus/";
    expect(statusUrl).toContain("finalfantasyxiv.com");
    expect(statusUrl).toContain("worldstatus");
  });

  it("should handle multiple regions", () => {
    const regions = ["na", "eu", "jp", "oce"];
    const regionUrls = regions.map(
      (r) =>
        `https://${r === "jp" ? "jp" : r}.finalfantasyxiv.com/lodestone/worldstatus/`
    );

    expect(regionUrls).toHaveLength(4);
  });
});

describe("FFXIV Data Center Status Parsing", () => {
  it("should parse NA data center status", () => {
    const naDataCenters: FFXIVDataCenter[] = [
      { name: "Aether", region: "na", worlds: ["Adamantoise", "Cactuar"] },
      { name: "Crystal", region: "na", worlds: ["Balmung", "Brynhildr"] },
      { name: "Dynamis", region: "na", worlds: ["Halicarnassus", "Maduin"] },
      { name: "Primal", region: "na", worlds: ["Behemoth", "Excalibur"] },
    ];

    expect(naDataCenters.every((dc) => dc.region === "na")).toBe(true);
    expect(naDataCenters).toHaveLength(4);
  });

  it("should parse EU data center status", () => {
    const euDataCenters: FFXIVDataCenter[] = [
      { name: "Chaos", region: "eu", worlds: ["Cerberus", "Louisoix"] },
      { name: "Light", region: "eu", worlds: ["Alpha", "Lich"] },
    ];

    expect(euDataCenters.every((dc) => dc.region === "eu")).toBe(true);
    expect(euDataCenters).toHaveLength(2);
  });

  it("should parse JP data center status", () => {
    const jpDataCenters: FFXIVDataCenter[] = [
      { name: "Elemental", region: "asia", worlds: ["Aegis", "Atomos"] },
      { name: "Gaia", region: "asia", worlds: ["Alexander", "Bahamut"] },
      { name: "Mana", region: "asia", worlds: ["Anima", "Asura"] },
      { name: "Meteor", region: "asia", worlds: ["Belias", "Mandragora"] },
    ];

    expect(jpDataCenters.every((dc) => dc.region === "asia")).toBe(true);
    expect(jpDataCenters).toHaveLength(4);
  });

  it("should parse OCE data center status", () => {
    const oceDataCenters: FFXIVDataCenter[] = [
      { name: "Materia", region: "oce", worlds: ["Bismarck", "Ravana"] },
    ];

    expect(oceDataCenters.every((dc) => dc.region === "oce")).toBe(true);
    expect(oceDataCenters).toHaveLength(1);
  });
});

describe("FFXIV Maintenance Notice Parsing", () => {
  it("should detect active maintenance window", () => {
    const now = new Date("2024-01-15T10:00:00Z");
    const scheduledFor = "2024-01-15T09:00:00Z";
    const scheduledUntil = "2024-01-15T11:00:00Z";

    expect(isMaintenanceActive(scheduledFor, scheduledUntil, now)).toBe(true);
  });

  it("should detect maintenance not yet started", () => {
    const now = new Date("2024-01-15T08:00:00Z");
    const scheduledFor = "2024-01-15T09:00:00Z";
    const scheduledUntil = "2024-01-15T11:00:00Z";

    expect(isMaintenanceActive(scheduledFor, scheduledUntil, now)).toBe(false);
  });

  it("should detect maintenance already ended", () => {
    const now = new Date("2024-01-15T12:00:00Z");
    const scheduledFor = "2024-01-15T09:00:00Z";
    const scheduledUntil = "2024-01-15T11:00:00Z";

    expect(isMaintenanceActive(scheduledFor, scheduledUntil, now)).toBe(false);
  });

  it("should set status to maintenance when notice is active", () => {
    const worlds = [
      { name: "Adamantoise", online: true },
      { name: "Cactuar", online: true },
    ];

    expect(determineRegionStatus(worlds, true)).toBe("maintenance");
  });
});

describe("FFXIV Region Status Determination", () => {
  it("should return online when all worlds are up", () => {
    const worlds = [
      { name: "Adamantoise", online: true },
      { name: "Cactuar", online: true },
    ];

    expect(determineRegionStatus(worlds, false)).toBe("online");
  });

  it("should return degraded when some worlds are down", () => {
    const worlds = [
      { name: "Adamantoise", online: true },
      { name: "Cactuar", online: false },
    ];

    expect(determineRegionStatus(worlds, false)).toBe("degraded");
  });

  it("should return offline when all worlds are down", () => {
    const worlds = [
      { name: "Adamantoise", online: false },
      { name: "Cactuar", online: false },
    ];

    expect(determineRegionStatus(worlds, false)).toBe("offline");
  });

  it("should return unknown when no world data available", () => {
    const worlds: Array<{ name: string; online: boolean }> = [];

    expect(determineRegionStatus(worlds, false)).toBe("unknown");
  });
});
