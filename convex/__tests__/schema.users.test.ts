/**
 * Tests for Users Table Schema
 *
 * These tests verify that the users table schema correctly validates
 * user documents including required fields and optional OAuth fields.
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

describe("Users Table Schema", () => {
  it("should define users table with all required fields", () => {
    const fields = getTableFields("users");

    expect(fields).not.toBeNull();
    expect(fields).toHaveProperty("email");
    expect(fields).toHaveProperty("displayName");
    expect(fields).toHaveProperty("isEmailVerified");
    expect(fields).toHaveProperty("providerType");
    expect(fields).toHaveProperty("providerId");
    expect(fields).toHaveProperty("updatedAt");
  });

  it("should enforce string type for email field", () => {
    const fields = getTableFields("users");

    expect(fields).not.toBeNull();
    const emailValidator = fields!.email;
    expect(isValidatorKind(emailValidator, "string")).toBe(true);
  });

  it("should enforce boolean type for isEmailVerified field", () => {
    const fields = getTableFields("users");

    expect(fields).not.toBeNull();
    const verifiedValidator = fields!.isEmailVerified;
    expect(isValidatorKind(verifiedValidator, "boolean")).toBe(true);
  });

  it("should define optional OAuth fields (providerType and providerId)", () => {
    const fields = getTableFields("users");

    expect(fields).not.toBeNull();

    // providerType should be optional
    const providerTypeValidator = fields!.providerType;
    expect(isOptionalValidator(providerTypeValidator)).toBe(true);

    // providerId should be optional
    const providerIdValidator = fields!.providerId;
    expect(isOptionalValidator(providerIdValidator)).toBe(true);
  });
});

describe("Users Table Indexes", () => {
  it("should have an index on email for authentication lookups", () => {
    const indexes = getTableIndexes("users");

    expect(indexes).not.toBeNull();
    expect(indexes!.length).toBeGreaterThan(0);

    // Check for email index
    const emailIndex = indexes!.find(
      (idx) => idx.indexDescriptor === "by_email" || idx.fields.includes("email")
    );
    expect(emailIndex).toBeDefined();
    expect(emailIndex!.fields).toContain("email");
  });
});
