/**
 * Schema Integration Tests
 *
 * These tests verify the complete schema exports correctly and all cross-table
 * relationships are properly defined. This is the final validation for Task Group 6.
 */
import { describe, it, expect } from "vitest";
import schema, {
  statusValidator,
  regionValidator,
  platformValidator,
  Status,
  Region,
  Platform,
} from "../schema";

/**
 * Helper function to get all table names from the schema.
 */
function getTableNames(): string[] {
  return Object.keys(
    (schema as unknown as { tables: Record<string, unknown> }).tables
  );
}

/**
 * Helper function to get table fields from schema.
 */
function getTableFields(tableName: string): Record<string, unknown> | null {
  const tableDefinition = (
    schema as unknown as {
      tables: Record<string, { validator: { fields: Record<string, unknown> } }>;
    }
  ).tables[tableName];
  if (!tableDefinition?.validator?.fields) {
    return null;
  }
  return tableDefinition.validator.fields;
}

/**
 * Helper function to get table indexes from schema.
 */
function getTableIndexes(
  tableName: string
): Array<{ indexDescriptor: string; fields: string[] }> | null {
  const tableDefinition = (
    schema as unknown as {
      tables: Record<
        string,
        { indexes: Array<{ indexDescriptor: string; fields: string[] }> }
      >;
    }
  ).tables[tableName];
  if (!tableDefinition?.indexes) {
    return null;
  }
  return tableDefinition.indexes;
}

/**
 * Helper function to check if a field is an id reference to a specific table.
 */
function isIdReferenceToTable(validator: unknown, tableName: string): boolean {
  const v = validator as { kind: string; tableName: string };
  return v?.kind === "id" && v?.tableName === tableName;
}

describe("Schema Integration", () => {
  describe("Complete Schema Export", () => {
    it("should export schema with all 9 required tables", () => {
      const tableNames = getTableNames();

      // Core tables from spec 001
      expect(tableNames).toContain("games");
      expect(tableNames).toContain("serverStatusRecords");
      expect(tableNames).toContain("statusHistory");
      expect(tableNames).toContain("users");
      expect(tableNames).toContain("favorites");
      expect(tableNames).toContain("alertSubscriptions");

      // Auth tables from spec 004
      expect(tableNames).toContain("authCredentials");
      expect(tableNames).toContain("magicLinkTokens");
      expect(tableNames).toContain("passwordResetTokens");

      expect(tableNames.length).toBe(9);
    });

    it("should export all three enum validators", () => {
      // Verify validators are exported and are valid Convex validators
      expect(statusValidator).toBeDefined();
      expect(regionValidator).toBeDefined();
      expect(platformValidator).toBeDefined();

      // Verify validators have correct structure
      expect((statusValidator as unknown as { kind: string }).kind).toBe("union");
      expect((regionValidator as unknown as { kind: string }).kind).toBe("union");
      expect((platformValidator as unknown as { kind: string }).kind).toBe("union");
    });

    it("should export all enum TypeScript types", () => {
      // Verify type definitions work correctly by checking type-compatible values
      const status: Status = "online";
      const region: Region = "na";
      const platform: Platform = "blizzard";

      expect(status).toBe("online");
      expect(region).toBe("na");
      expect(platform).toBe("blizzard");
    });
  });

  describe("Cross-Table Reference Integrity", () => {
    it("should validate favorites table references both users and games tables", () => {
      const fields = getTableFields("favorites");

      expect(fields).not.toBeNull();

      // Verify userId references users table
      expect(isIdReferenceToTable(fields!.userId, "users")).toBe(true);

      // Verify gameId references games table
      expect(isIdReferenceToTable(fields!.gameId, "games")).toBe(true);
    });

    it("should validate alertSubscriptions table references both users and games tables", () => {
      const fields = getTableFields("alertSubscriptions");

      expect(fields).not.toBeNull();

      // Verify userId references users table
      expect(isIdReferenceToTable(fields!.userId, "users")).toBe(true);

      // Verify gameId references games table
      expect(isIdReferenceToTable(fields!.gameId, "games")).toBe(true);
    });

    it("should validate serverStatusRecords correctly references games with region support", () => {
      const fields = getTableFields("serverStatusRecords");
      const indexes = getTableIndexes("serverStatusRecords");

      expect(fields).not.toBeNull();
      expect(indexes).not.toBeNull();

      // Verify gameId references games table
      expect(isIdReferenceToTable(fields!.gameId, "games")).toBe(true);

      // Verify region field exists (for per-region status tracking)
      expect(fields).toHaveProperty("region");

      // Verify compound index exists for game+region lookups
      const compoundIndex = indexes!.find(
        (idx) =>
          idx.fields.includes("gameId") &&
          idx.fields.includes("region") &&
          idx.fields.length === 2
      );
      expect(compoundIndex).toBeDefined();
    });

    it("should validate statusHistory correctly references games table", () => {
      const fields = getTableFields("statusHistory");

      expect(fields).not.toBeNull();

      // Verify gameId references games table
      expect(isIdReferenceToTable(fields!.gameId, "games")).toBe(true);

      // Verify both previousStatus and newStatus fields exist for transition tracking
      expect(fields).toHaveProperty("previousStatus");
      expect(fields).toHaveProperty("newStatus");
    });
  });

  describe("Auth Tables Integration", () => {
    it("should validate authCredentials table references users table", () => {
      const fields = getTableFields("authCredentials");

      expect(fields).not.toBeNull();
      expect(isIdReferenceToTable(fields!.userId, "users")).toBe(true);
      expect(fields).toHaveProperty("passwordHash");
    });

    it("should validate passwordResetTokens table references users table", () => {
      const fields = getTableFields("passwordResetTokens");

      expect(fields).not.toBeNull();
      expect(isIdReferenceToTable(fields!.userId, "users")).toBe(true);
      // Issue #14: tokens are now stored as hashes, not plaintext
      expect(fields).toHaveProperty("tokenHash");
      expect(fields).toHaveProperty("expiresAt");
    });

    it("should validate magicLinkTokens table has required fields", () => {
      const fields = getTableFields("magicLinkTokens");

      expect(fields).not.toBeNull();
      expect(fields).toHaveProperty("email");
      // Issue #14: tokens are now stored as hashes, not plaintext
      expect(fields).toHaveProperty("tokenHash");
      expect(fields).toHaveProperty("expiresAt");
      expect(fields).toHaveProperty("isUsed");
    });
  });

  describe("Schema Compilation Validation", () => {
    it("should have schema as default export", () => {
      // Verify schema is a valid Convex schema object
      expect(schema).toBeDefined();
      expect((schema as unknown as { tables: unknown }).tables).toBeDefined();
      expect(typeof (schema as unknown as { tables: unknown }).tables).toBe("object");
    });
  });
});
