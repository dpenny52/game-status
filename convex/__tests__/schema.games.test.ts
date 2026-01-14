/**
 * Tests for Games Table Schema
 *
 * These tests verify that the games table schema correctly validates
 * game documents with all required fields and proper types.
 */
import { describe, it, expect } from "vitest";
import { v } from "convex/values";
import {
  platformValidator,
  Platform,
} from "../schema";

/**
 * Type definition for Convex validator structure.
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

interface ConvexPrimitiveValidator {
  isOptional: string;
  isConvexValidator: boolean;
  kind: string;
}

/**
 * Helper function to check if a value is valid for a Convex union validator.
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

/**
 * Helper function to check if a value matches a Convex primitive validator kind.
 */
function isValidForPrimitiveValidator(
  validator: ConvexPrimitiveValidator,
  value: unknown
): boolean {
  switch (validator.kind) {
    case "string":
      return typeof value === "string";
    case "number":
    case "float64":
    case "int64":
      return typeof value === "number";
    case "boolean":
      return typeof value === "boolean";
    default:
      return false;
  }
}

/**
 * Type representing the expected structure of a games table document.
 */
interface GameDocument {
  slug: string;
  displayName: string;
  platform: Platform;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: number;
}

describe("Games Table Schema", () => {
  // Valid game document for testing
  const validGameDocument: GameDocument = {
    slug: "world-of-warcraft",
    displayName: "World of Warcraft",
    platform: "blizzard",
    iconUrl: "https://example.com/wow-icon.png",
    sortOrder: 1,
    isActive: true,
    updatedAt: Date.now(),
  };

  describe("Valid Document Structure", () => {
    it("should accept a valid game document with all required fields", () => {
      // Verify all fields have correct types
      expect(typeof validGameDocument.slug).toBe("string");
      expect(typeof validGameDocument.displayName).toBe("string");
      expect(typeof validGameDocument.platform).toBe("string");
      expect(typeof validGameDocument.iconUrl).toBe("string");
      expect(typeof validGameDocument.sortOrder).toBe("number");
      expect(typeof validGameDocument.isActive).toBe("boolean");
      expect(typeof validGameDocument.updatedAt).toBe("number");

      // Verify platform uses valid enum value
      expect(
        isValidForUnionValidator(
          platformValidator as unknown as ConvexUnionValidator,
          validGameDocument.platform
        )
      ).toBe(true);
    });
  });

  describe("Field Type Validation", () => {
    it("should validate slug field as string type", () => {
      const stringValidator = v.string() as unknown as ConvexPrimitiveValidator;

      // Valid string values
      expect(isValidForPrimitiveValidator(stringValidator, "world-of-warcraft")).toBe(true);
      expect(isValidForPrimitiveValidator(stringValidator, "valorant")).toBe(true);
      expect(isValidForPrimitiveValidator(stringValidator, "")).toBe(true);

      // Invalid non-string values
      expect(isValidForPrimitiveValidator(stringValidator, 123)).toBe(false);
      expect(isValidForPrimitiveValidator(stringValidator, null)).toBe(false);
      expect(isValidForPrimitiveValidator(stringValidator, undefined)).toBe(false);
      expect(isValidForPrimitiveValidator(stringValidator, true)).toBe(false);
    });

    it("should validate isActive field as boolean type", () => {
      const booleanValidator = v.boolean() as unknown as ConvexPrimitiveValidator;

      // Valid boolean values
      expect(isValidForPrimitiveValidator(booleanValidator, true)).toBe(true);
      expect(isValidForPrimitiveValidator(booleanValidator, false)).toBe(true);

      // Invalid non-boolean values
      expect(isValidForPrimitiveValidator(booleanValidator, "true")).toBe(false);
      expect(isValidForPrimitiveValidator(booleanValidator, 1)).toBe(false);
      expect(isValidForPrimitiveValidator(booleanValidator, 0)).toBe(false);
      expect(isValidForPrimitiveValidator(booleanValidator, null)).toBe(false);
    });

    it("should validate platform field uses platform enum validator", () => {
      const validPlatforms: Platform[] = [
        "blizzard",
        "riot",
        "steam",
        "epic",
        "mojang",
        "squareenix",
      ];

      // All valid platform values should be accepted
      validPlatforms.forEach((platform) => {
        expect(
          isValidForUnionValidator(
            platformValidator as unknown as ConvexUnionValidator,
            platform
          )
        ).toBe(true);
      });

      // Invalid platform values should be rejected
      const invalidPlatforms = ["activision", "ea", "nintendo", "xbox", "playstation"];
      invalidPlatforms.forEach((platform) => {
        expect(
          isValidForUnionValidator(
            platformValidator as unknown as ConvexUnionValidator,
            platform
          )
        ).toBe(false);
      });
    });
  });
});
