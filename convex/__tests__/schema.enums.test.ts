/**
 * Tests for Schema Enum Validators
 *
 * These tests verify that the status, region, and platform enum validators
 * correctly accept valid values and reject invalid values.
 */
import { describe, it, expect } from "vitest";
import {
  statusValidator,
  regionValidator,
  platformValidator,
  Status,
  Region,
  Platform,
} from "../schema";

/**
 * Type definition for Convex union validator structure.
 */
interface ConvexLiteralValidator {
  isOptional: string;
  isConvexValidator: boolean;
  value: unknown;
  kind: "literal";
}

interface ConvexUnionValidator {
  isOptional: string;
  isConvexValidator: boolean;
  members: ConvexLiteralValidator[];
  kind: "union";
}

/**
 * Helper function to check if a value is valid for a Convex union validator.
 * Convex validators use `kind` to identify the type and `members` for union types.
 */
function isValidForUnionValidator(
  validator: ConvexUnionValidator,
  value: unknown
): boolean {
  if (validator.kind !== "union") {
    return false;
  }
  return validator.members.some(
    (member) => member.kind === "literal" && member.value === value
  );
}

describe("Status Enum Validator", () => {
  const validStatusValues: Status[] = [
    "online",
    "offline",
    "degraded",
    "maintenance",
    "unknown",
  ];

  it("should accept all valid status values", () => {
    validStatusValues.forEach((status) => {
      expect(
        isValidForUnionValidator(statusValidator as unknown as ConvexUnionValidator, status)
      ).toBe(true);
    });
  });

  it("should reject invalid status values", () => {
    const invalidValues = ["active", "inactive", "down", "up", "", null, undefined, 123];
    invalidValues.forEach((value) => {
      expect(
        isValidForUnionValidator(statusValidator as unknown as ConvexUnionValidator, value)
      ).toBe(false);
    });
  });
});

describe("Region Enum Validator", () => {
  const validRegionValues: Region[] = ["na", "eu", "asia", "oce", "global"];

  it("should accept all valid region values", () => {
    validRegionValues.forEach((region) => {
      expect(
        isValidForUnionValidator(regionValidator as unknown as ConvexUnionValidator, region)
      ).toBe(true);
    });
  });

  it("should reject invalid region values", () => {
    const invalidValues = ["us", "europe", "apac", "australia", "worldwide", "", null];
    invalidValues.forEach((value) => {
      expect(
        isValidForUnionValidator(regionValidator as unknown as ConvexUnionValidator, value)
      ).toBe(false);
    });
  });
});

describe("Platform Enum Validator", () => {
  const validPlatformValues: Platform[] = [
    "blizzard",
    "riot",
    "steam",
    "epic",
    "mojang",
    "squareenix",
  ];

  it("should accept all valid platform values", () => {
    validPlatformValues.forEach((platform) => {
      expect(
        isValidForUnionValidator(platformValidator as unknown as ConvexUnionValidator, platform)
      ).toBe(true);
    });
  });

  it("should reject invalid platform values", () => {
    const invalidValues = ["activision", "ea", "ubisoft", "nintendo", "", null, 42];
    invalidValues.forEach((value) => {
      expect(
        isValidForUnionValidator(platformValidator as unknown as ConvexUnionValidator, value)
      ).toBe(false);
    });
  });
});
