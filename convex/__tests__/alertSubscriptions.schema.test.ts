/**
 * Tests for Alert Subscriptions Schema Modifications
 *
 * These tests verify that the alertSubscriptions table has been properly
 * modified to support region-specific subscriptions with unsubscribe tokens.
 */
import { describe, it, expect } from "vitest";
import schema from "../schema";

/**
 * Helper function to check if a field exists in a table definition.
 * Convex table definitions store field validators in a structured format.
 */
function getTableFields(tableName: string): Record<string, unknown> | null {
  const tableDefinition = (schema as unknown as { tables: Record<string, { validator: { fields: Record<string, unknown> } }> }).tables[tableName];
  if (!tableDefinition?.validator?.fields) {
    return null;
  }
  return tableDefinition.validator.fields;
}

/**
 * Helper function to check if a table has an index defined.
 */
function getTableIndexes(tableName: string): Array<{ indexDescriptor: string; fields: string[] }> | null {
  const tableDefinition = (schema as unknown as { tables: Record<string, { indexes: Array<{ indexDescriptor: string; fields: string[] }> }> }).tables[tableName];
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

describe("Alert Subscriptions Schema - Region Support", () => {
  it("should have region field as required string", () => {
    const fields = getTableFields("alertSubscriptions");

    expect(fields).not.toBeNull();
    expect(fields).toHaveProperty("region");

    // Region should be a string (uses regionValidator which is a union)
    const regionValidator = fields!.region;
    expect(regionValidator).toBeDefined();
    // regionValidator is a union type which has kind "union"
    expect(isValidatorKind(regionValidator, "union")).toBe(true);
  });

  it("should have compound index on (userId, gameId, region) for uniqueness", () => {
    const indexes = getTableIndexes("alertSubscriptions");

    expect(indexes).not.toBeNull();

    // Check for compound (userId, gameId, region) index
    const compoundIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_userId_gameId_region" ||
        (idx.fields.includes("userId") && idx.fields.includes("gameId") && idx.fields.includes("region"))
    );
    expect(compoundIndex).toBeDefined();
    expect(compoundIndex!.fields).toContain("userId");
    expect(compoundIndex!.fields).toContain("gameId");
    expect(compoundIndex!.fields).toContain("region");
  });

  it("should have lastAlertSentAt field as optional number for cooldown tracking", () => {
    const fields = getTableFields("alertSubscriptions");

    expect(fields).not.toBeNull();
    expect(fields).toHaveProperty("lastAlertSentAt");

    // lastAlertSentAt should be optional
    const lastAlertValidator = fields!.lastAlertSentAt;
    expect(isOptionalValidator(lastAlertValidator)).toBe(true);
  });

  it("should have unsubscribeTokenHash field as required string (Issue #14: tokens stored as hashes)", () => {
    const fields = getTableFields("alertSubscriptions");

    expect(fields).not.toBeNull();
    // Issue #14: tokens are now stored as SHA-256 hashes, not plaintext
    expect(fields).toHaveProperty("unsubscribeTokenHash");

    // unsubscribeTokenHash should be a string
    const tokenValidator = fields!.unsubscribeTokenHash;
    expect(tokenValidator).toBeDefined();
    expect(isValidatorKind(tokenValidator, "string")).toBe(true);
  });

  it("should have index on unsubscribeTokenHash for fast lookups (Issue #14)", () => {
    const indexes = getTableIndexes("alertSubscriptions");

    expect(indexes).not.toBeNull();

    // Check for unsubscribeTokenHash index (Issue #14: lookup by hash)
    const tokenIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_unsubscribeTokenHash" ||
        (idx.fields.length === 1 && idx.fields[0] === "unsubscribeTokenHash")
    );
    expect(tokenIndex).toBeDefined();
    expect(tokenIndex!.fields).toContain("unsubscribeTokenHash");
  });

  it("should have index on (gameId, region) for alert processing queries", () => {
    const indexes = getTableIndexes("alertSubscriptions");

    expect(indexes).not.toBeNull();

    // Check for (gameId, region) index for efficient alert processing
    const gameRegionIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_gameId_region" ||
        (idx.fields.includes("gameId") && idx.fields.includes("region") && idx.fields.length === 2)
    );
    expect(gameRegionIndex).toBeDefined();
    expect(gameRegionIndex!.fields).toContain("gameId");
    expect(gameRegionIndex!.fields).toContain("region");
  });
});
