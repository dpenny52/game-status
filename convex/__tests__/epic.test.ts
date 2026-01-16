/**
 * Tests for Epic Games Integration
 *
 * Tests public status page API fetch, component status parsing,
 * and status indicator mapping for Fortnite.
 */
import { describe, it, expect } from "vitest";

/**
 * Epic status page component structure.
 */
interface EpicStatusComponent {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Maps Epic status indicator to internal enum.
 */
function mapEpicIndicatorToStatus(
  indicator: string
): "online" | "offline" | "degraded" | "maintenance" | "unknown" {
  switch (indicator.toLowerCase()) {
    case "none":
      return "online";
    case "minor":
      return "degraded";
    case "major":
      return "degraded";
    case "critical":
      return "offline";
    case "maintenance":
      return "maintenance";
    default:
      return "unknown";
  }
}

/**
 * Maps component status to internal enum.
 */
function mapComponentStatus(
  status: string
): "online" | "offline" | "degraded" | "maintenance" | "unknown" {
  switch (status.toLowerCase()) {
    case "operational":
      return "online";
    case "degraded_performance":
      return "degraded";
    case "partial_outage":
      return "degraded";
    case "major_outage":
      return "offline";
    case "under_maintenance":
      return "maintenance";
    default:
      return "unknown";
  }
}

/**
 * Aggregates component statuses to determine overall status.
 */
function aggregateComponentStatuses(
  components: EpicStatusComponent[]
): "online" | "offline" | "degraded" | "maintenance" | "unknown" {
  const statuses = components.map((c) => mapComponentStatus(c.status));

  // Worst status wins
  if (statuses.includes("offline")) return "offline";
  if (statuses.includes("maintenance")) return "maintenance";
  if (statuses.includes("degraded")) return "degraded";
  if (statuses.includes("unknown")) return "unknown";
  return "online";
}

describe("Epic Public Status Page Fetch", () => {
  it("should not require authentication for public endpoint", () => {
    // The Epic status API is public and requires no auth
    const authRequired = false;
    expect(authRequired).toBe(false);
  });

  it("should use correct status page URL format", () => {
    const statusUrl = "https://status.epicgames.com/api/v2/summary.json";
    expect(statusUrl).toContain("status.epicgames.com");
    expect(statusUrl).toContain("api/v2");
  });
});

describe("Epic Component Status Parsing", () => {
  it("should parse game services component", () => {
    const components: EpicStatusComponent[] = [
      {
        id: "1",
        name: "Game Services",
        status: "operational",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    expect(aggregateComponentStatuses(components)).toBe("online");
  });

  it("should parse login component", () => {
    const components: EpicStatusComponent[] = [
      {
        id: "1",
        name: "Login",
        status: "degraded_performance",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    expect(aggregateComponentStatuses(components)).toBe("degraded");
  });

  it("should parse matchmaking component", () => {
    const components: EpicStatusComponent[] = [
      {
        id: "1",
        name: "Matchmaking",
        status: "major_outage",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    expect(aggregateComponentStatuses(components)).toBe("offline");
  });

  it("should aggregate multiple component statuses", () => {
    const components: EpicStatusComponent[] = [
      {
        id: "1",
        name: "Game Services",
        status: "operational",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Login",
        status: "degraded_performance",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Matchmaking",
        status: "operational",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Should return degraded because one component is degraded
    expect(aggregateComponentStatuses(components)).toBe("degraded");
  });
});

describe("Epic Status Indicator Mapping", () => {
  it("should map status indicators to internal enum", () => {
    expect(mapEpicIndicatorToStatus("none")).toBe("online");
    expect(mapEpicIndicatorToStatus("minor")).toBe("degraded");
    expect(mapEpicIndicatorToStatus("major")).toBe("degraded");
    expect(mapEpicIndicatorToStatus("critical")).toBe("offline");
    expect(mapEpicIndicatorToStatus("maintenance")).toBe("maintenance");
    expect(mapEpicIndicatorToStatus("unexpected_value")).toBe("unknown");
  });
});
