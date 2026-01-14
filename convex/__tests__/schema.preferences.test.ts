/**
 * Tests for User Preference Tables Schema (Favorites and Alert Subscriptions)
 *
 * These tests verify that the favorites and alertSubscriptions tables
 * correctly validate documents with proper foreign key references and field types.
 */
import { describe, it, expect } from "vitest";
import { v } from "convex/values";
import schema from "../schema";

/**
 * Helper function to check if a field exists in a table definition.
 * Convex table definitions store field validators in a structured format.
 */
function getTableFields(tableName: string): Record<string, unknown> | null {
  const tableDefinition = (schema as { tables: Record<string, { validator: { fields: Record<string, unknown> } }> }).tables[tableName];
  if (!tableDefinition?.validator?.fields) {
    return null;
  }
  return tableDefinition.validator.fields;
}

/**
 * Helper function to check if a table has an index defined.
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
 * Helper function to check if a field is an id reference to a specific table.
 */
function isIdReferenceToTable(validator: unknown, tableName: string): boolean {
  const v = validator as { kind: string; tableName: string };
  return v?.kind === "id" && v?.tableName === tableName;
}

describe("Favorites Table Schema", () => {
  it("should define favorites table with user and game references", () => {
    const fields = getTableFields("favorites");

    expect(fields).not.toBeNull();
    expect(fields).toHaveProperty("userId");
    expect(fields).toHaveProperty("gameId");
    expect(fields).toHaveProperty("createdAt");
  });

  it("should enforce foreign key references as v.id('users') and v.id('games')", () => {
    const fields = getTableFields("favorites");

    expect(fields).not.toBeNull();

    // userId should reference users table
    const userIdValidator = fields!.userId;
    expect(isIdReferenceToTable(userIdValidator, "users")).toBe(true);

    // gameId should reference games table
    const gameIdValidator = fields!.gameId;
    expect(isIdReferenceToTable(gameIdValidator, "games")).toBe(true);
  });

  it("should have indexes for userId and compound (userId, gameId)", () => {
    const indexes = getTableIndexes("favorites");

    expect(indexes).not.toBeNull();

    // Check for userId index
    const userIdIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_userId" ||
        (idx.fields.length === 1 && idx.fields[0] === "userId")
    );
    expect(userIdIndex).toBeDefined();
    expect(userIdIndex!.fields).toContain("userId");

    // Check for compound userId, gameId index
    const compoundIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_userId_gameId" ||
        (idx.fields.includes("userId") && idx.fields.includes("gameId"))
    );
    expect(compoundIndex).toBeDefined();
    expect(compoundIndex!.fields).toContain("userId");
    expect(compoundIndex!.fields).toContain("gameId");
  });
});

describe("Alert Subscriptions Table Schema", () => {
  it("should define alertSubscriptions table with all required fields", () => {
    const fields = getTableFields("alertSubscriptions");

    expect(fields).not.toBeNull();
    expect(fields).toHaveProperty("userId");
    expect(fields).toHaveProperty("gameId");
    expect(fields).toHaveProperty("isActive");
    expect(fields).toHaveProperty("lastAlertSentAt");
    expect(fields).toHaveProperty("createdAt");
  });

  it("should enforce boolean type for isActive field", () => {
    const fields = getTableFields("alertSubscriptions");

    expect(fields).not.toBeNull();
    const isActiveValidator = fields!.isActive;
    expect(isValidatorKind(isActiveValidator, "boolean")).toBe(true);
  });

  it("should enforce foreign key references as v.id('users') and v.id('games')", () => {
    const fields = getTableFields("alertSubscriptions");

    expect(fields).not.toBeNull();

    // userId should reference users table
    const userIdValidator = fields!.userId;
    expect(isIdReferenceToTable(userIdValidator, "users")).toBe(true);

    // gameId should reference games table
    const gameIdValidator = fields!.gameId;
    expect(isIdReferenceToTable(gameIdValidator, "games")).toBe(true);
  });

  it("should define lastAlertSentAt as optional number field", () => {
    const fields = getTableFields("alertSubscriptions");

    expect(fields).not.toBeNull();

    // lastAlertSentAt should be optional
    const lastAlertValidator = fields!.lastAlertSentAt;
    expect(isOptionalValidator(lastAlertValidator)).toBe(true);
  });

  it("should have indexes for userId and compound (userId, isActive)", () => {
    const indexes = getTableIndexes("alertSubscriptions");

    expect(indexes).not.toBeNull();

    // Check for userId index
    const userIdIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_userId" ||
        (idx.fields.length === 1 && idx.fields[0] === "userId")
    );
    expect(userIdIndex).toBeDefined();
    expect(userIdIndex!.fields).toContain("userId");

    // Check for compound userId, isActive index
    const compoundIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_userId_isActive" ||
        (idx.fields.includes("userId") && idx.fields.includes("isActive"))
    );
    expect(compoundIndex).toBeDefined();
    expect(compoundIndex!.fields).toContain("userId");
    expect(compoundIndex!.fields).toContain("isActive");
  });
});
