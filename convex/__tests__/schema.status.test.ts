/**
 * Tests for Server Status Tables Schema
 *
 * These tests verify that the serverStatusRecords and statusHistory tables
 * correctly validate documents with proper types, foreign key references,
 * and enum validators.
 */
import { describe, it, expect } from "vitest";
import schema from "../schema";
import {
  statusValidator,
  regionValidator,
  Status,
  Region,
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
 * Helper function to get table fields from schema.
 */
function getTableFields(tableName: string): Record<string, unknown> | null {
  const tableDefinition = (schema as { tables: Record<string, { validator: { fields: Record<string, unknown> } }> }).tables[tableName];
  if (!tableDefinition?.validator?.fields) {
    return null;
  }
  return tableDefinition.validator.fields;
}

/**
 * Helper function to get table indexes from schema.
 */
function getTableIndexes(tableName: string): Array<{ indexDescriptor: string; fields: string[] }> | null {
  const tableDefinition = (schema as { tables: Record<string, { indexes: Array<{ indexDescriptor: string; fields: string[] }> }> }).tables[tableName];
  if (!tableDefinition?.indexes) {
    return null;
  }
  return tableDefinition.indexes;
}

/**
 * Helper function to check if a field validator is a specific kind.
 */
function isValidatorKind(validator: unknown, kind: string): boolean {
  return (validator as { kind: string })?.kind === kind;
}

/**
 * Helper function to check if a field is optional.
 */
function isOptionalValidator(validator: unknown): boolean {
  return (validator as { isOptional: string })?.isOptional === "optional";
}

/**
 * Helper function to check if a validator is a foreign key reference (v.id).
 */
function isIdValidator(validator: unknown, tableName: string): boolean {
  const v = validator as { kind: string; tableName?: string };
  return v?.kind === "id" && v?.tableName === tableName;
}

describe("ServerStatusRecords Table Schema", () => {
  it("should accept valid status document with game reference", () => {
    const fields = getTableFields("serverStatusRecords");

    expect(fields).not.toBeNull();
    expect(fields).toHaveProperty("gameId");
    expect(fields).toHaveProperty("status");
    expect(fields).toHaveProperty("region");
    expect(fields).toHaveProperty("lastCheckedAt");
    expect(fields).toHaveProperty("statusChangedAt");
    expect(fields).toHaveProperty("statusMessage");
    expect(fields).toHaveProperty("updatedAt");
  });

  it("should validate status field uses status enum validator", () => {
    const validStatuses: Status[] = ["online", "offline", "degraded", "maintenance", "unknown"];

    validStatuses.forEach((status) => {
      expect(
        isValidForUnionValidator(statusValidator as unknown as ConvexUnionValidator, status)
      ).toBe(true);
    });

    // Invalid status values should be rejected
    const invalidStatuses = ["active", "down", "running", "stopped"];
    invalidStatuses.forEach((status) => {
      expect(
        isValidForUnionValidator(statusValidator as unknown as ConvexUnionValidator, status)
      ).toBe(false);
    });
  });

  it("should validate region field uses region enum validator", () => {
    const validRegions: Region[] = ["na", "eu", "asia", "oce", "global"];

    validRegions.forEach((region) => {
      expect(
        isValidForUnionValidator(regionValidator as unknown as ConvexUnionValidator, region)
      ).toBe(true);
    });

    // Invalid region values should be rejected
    const invalidRegions = ["us", "europe", "australia", "worldwide"];
    invalidRegions.forEach((region) => {
      expect(
        isValidForUnionValidator(regionValidator as unknown as ConvexUnionValidator, region)
      ).toBe(false);
    });
  });

  it("should validate gameId as foreign key reference to games table", () => {
    const fields = getTableFields("serverStatusRecords");

    expect(fields).not.toBeNull();
    const gameIdValidator = fields!.gameId;
    expect(isIdValidator(gameIdValidator, "games")).toBe(true);
  });

  it("should define optional statusMessage field", () => {
    const fields = getTableFields("serverStatusRecords");

    expect(fields).not.toBeNull();
    const statusMessageValidator = fields!.statusMessage;
    expect(isOptionalValidator(statusMessageValidator)).toBe(true);
  });
});

describe("ServerStatusRecords Table Indexes", () => {
  it("should have indexes for gameId, region, and compound [gameId, region]", () => {
    const indexes = getTableIndexes("serverStatusRecords");

    expect(indexes).not.toBeNull();
    expect(indexes!.length).toBeGreaterThanOrEqual(3);

    // Check for gameId index
    const gameIdIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_gameId" ||
               (idx.fields.length === 1 && idx.fields[0] === "gameId")
    );
    expect(gameIdIndex).toBeDefined();

    // Check for region index
    const regionIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_region" ||
               (idx.fields.length === 1 && idx.fields[0] === "region")
    );
    expect(regionIndex).toBeDefined();

    // Check for compound gameId + region index
    const compoundIndex = indexes!.find(
      (idx) => idx.fields.includes("gameId") && idx.fields.includes("region") && idx.fields.length === 2
    );
    expect(compoundIndex).toBeDefined();
  });
});

describe("StatusHistory Table Schema", () => {
  it("should accept valid history document with previous and new status", () => {
    const fields = getTableFields("statusHistory");

    expect(fields).not.toBeNull();
    expect(fields).toHaveProperty("gameId");
    expect(fields).toHaveProperty("previousStatus");
    expect(fields).toHaveProperty("newStatus");
    expect(fields).toHaveProperty("timestamp");
    expect(fields).toHaveProperty("isArchived");
  });

  it("should validate gameId as foreign key reference to games table", () => {
    const fields = getTableFields("statusHistory");

    expect(fields).not.toBeNull();
    const gameIdValidator = fields!.gameId;
    expect(isIdValidator(gameIdValidator, "games")).toBe(true);
  });

  it("should define optional isArchived field for data retention", () => {
    const fields = getTableFields("statusHistory");

    expect(fields).not.toBeNull();
    const isArchivedValidator = fields!.isArchived;
    expect(isOptionalValidator(isArchivedValidator)).toBe(true);
  });
});

describe("StatusHistory Table Indexes", () => {
  it("should have indexes for gameId and timestamp", () => {
    const indexes = getTableIndexes("statusHistory");

    expect(indexes).not.toBeNull();
    expect(indexes!.length).toBeGreaterThanOrEqual(2);

    // Check for gameId index
    const gameIdIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_gameId" || idx.fields.includes("gameId")
    );
    expect(gameIdIndex).toBeDefined();

    // Check for timestamp index
    const timestampIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_timestamp" || idx.fields.includes("timestamp")
    );
    expect(timestampIndex).toBeDefined();
  });
});
