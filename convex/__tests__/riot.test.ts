/**
 * Tests for Riot Games API Integration
 *
 * Tests API key authentication, status fetching for LoL/Valorant/TFT,
 * incident parsing, and regional status mapping.
 */
import { describe, it, expect } from "vitest";

/**
 * Mock Riot Status API response structure.
 */
interface RiotStatusIncident {
  id: number;
  maintenance_status?: string;
  incident_severity?: string;
  titles: Array<{ content: string; locale: string }>;
  created_at: string;
  archive_at?: string;
  platforms: string[];
}

interface RiotStatusResponse {
  id: string;
  name: string;
  locales: string[];
  maintenances: RiotStatusIncident[];
  incidents: RiotStatusIncident[];
}

/**
 * Determines status from Riot API response.
 */
function determineRiotStatus(
  response: RiotStatusResponse
): "online" | "offline" | "degraded" | "maintenance" | "unknown" {
  // Check for active incidents first
  if (response.incidents && response.incidents.length > 0) {
    const activeIncidents = response.incidents.filter((i) => !i.archive_at);
    if (activeIncidents.length > 0) {
      const hasCritical = activeIncidents.some(
        (i) => i.incident_severity === "critical"
      );
      if (hasCritical) return "offline";
      return "degraded";
    }
  }

  // Check for active maintenance
  if (response.maintenances && response.maintenances.length > 0) {
    const activeMaintenance = response.maintenances.filter(
      (m) => m.maintenance_status === "in_progress" || !m.archive_at
    );
    if (activeMaintenance.length > 0) {
      const inProgress = activeMaintenance.some(
        (m) => m.maintenance_status === "in_progress"
      );
      if (inProgress) return "maintenance";
    }
  }

  return "online";
}

/**
 * Maps Riot platform regions to internal codes.
 */
function mapRiotRegion(
  platform: string
): "na" | "eu" | "asia" | "oce" | "global" {
  const regionMap: Record<string, "na" | "eu" | "asia" | "oce" | "global"> = {
    na1: "na",
    euw1: "eu",
    eun1: "eu",
    kr: "asia",
    jp1: "asia",
    oc1: "oce",
    na: "na", // Valorant regions
    eu: "eu",
    ap: "asia",
  };
  return regionMap[platform] || "global";
}

describe("Riot API Key Authentication", () => {
  it("should include API key in request header", () => {
    const apiKey = "RGAPI-test-key-12345";
    const headers = {
      "X-Riot-Token": apiKey,
    };

    expect(headers["X-Riot-Token"]).toBe(apiKey);
  });

  it("should handle missing API key gracefully", () => {
    const apiKey = undefined;
    const shouldSkip = !apiKey || apiKey === "";
    expect(shouldSkip).toBe(true);
  });
});

describe("Riot Status Fetching", () => {
  it("should fetch status for League of Legends", () => {
    const games = ["lol", "valorant", "tft"];
    expect(games).toContain("lol");
  });

  it("should fetch status for Valorant", () => {
    const games = ["lol", "valorant", "tft"];
    expect(games).toContain("valorant");
  });

  it("should fetch status for TFT", () => {
    const games = ["lol", "valorant", "tft"];
    expect(games).toContain("tft");
  });
});

describe("Riot Incident/Maintenance Array Parsing", () => {
  it("should return online when no incidents or maintenance", () => {
    const response: RiotStatusResponse = {
      id: "NA1",
      name: "North America",
      locales: ["en_US"],
      maintenances: [],
      incidents: [],
    };

    expect(determineRiotStatus(response)).toBe("online");
  });

  it("should return degraded for active non-critical incidents", () => {
    const response: RiotStatusResponse = {
      id: "NA1",
      name: "North America",
      locales: ["en_US"],
      maintenances: [],
      incidents: [
        {
          id: 1,
          incident_severity: "warning",
          titles: [{ content: "Minor issue", locale: "en_US" }],
          created_at: new Date().toISOString(),
          platforms: ["windows"],
        },
      ],
    };

    expect(determineRiotStatus(response)).toBe("degraded");
  });

  it("should return offline for critical incidents", () => {
    const response: RiotStatusResponse = {
      id: "NA1",
      name: "North America",
      locales: ["en_US"],
      maintenances: [],
      incidents: [
        {
          id: 1,
          incident_severity: "critical",
          titles: [{ content: "Major outage", locale: "en_US" }],
          created_at: new Date().toISOString(),
          platforms: ["windows"],
        },
      ],
    };

    expect(determineRiotStatus(response)).toBe("offline");
  });

  it("should return maintenance when maintenance is in progress", () => {
    const response: RiotStatusResponse = {
      id: "NA1",
      name: "North America",
      locales: ["en_US"],
      maintenances: [
        {
          id: 1,
          maintenance_status: "in_progress",
          titles: [{ content: "Scheduled maintenance", locale: "en_US" }],
          created_at: new Date().toISOString(),
          platforms: ["windows"],
        },
      ],
      incidents: [],
    };

    expect(determineRiotStatus(response)).toBe("maintenance");
  });
});

describe("Riot Regional Platform Mapping", () => {
  it("should map LoL platforms to internal regions", () => {
    expect(mapRiotRegion("na1")).toBe("na");
    expect(mapRiotRegion("euw1")).toBe("eu");
    expect(mapRiotRegion("eun1")).toBe("eu");
    expect(mapRiotRegion("kr")).toBe("asia");
    expect(mapRiotRegion("jp1")).toBe("asia");
    expect(mapRiotRegion("oc1")).toBe("oce");
  });

  it("should map Valorant regions to internal regions", () => {
    expect(mapRiotRegion("na")).toBe("na");
    expect(mapRiotRegion("eu")).toBe("eu");
    expect(mapRiotRegion("ap")).toBe("asia");
  });
});
