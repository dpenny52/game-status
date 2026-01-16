/**
 * Generated Data Model Types
 *
 * This file provides type definitions for the database schema.
 * In a deployed Convex project, this file is auto-generated from schema.ts.
 */

import type { GenericDataModel, GenericTableInfo } from "convex/server";
import type { GenericId } from "convex/values";

/**
 * Status enum type.
 */
export type Status = "online" | "offline" | "degraded" | "maintenance" | "unknown";

/**
 * Region enum type.
 */
export type Region = "na" | "eu" | "asia" | "oce" | "global";

/**
 * Platform enum type.
 */
export type Platform = "blizzard" | "riot" | "steam" | "epic" | "mojang" | "squareenix";

/**
 * Games table document type.
 */
export interface GamesDocument {
  _id: GenericId<"games">;
  _creationTime: number;
  slug: string;
  displayName: string;
  platform: Platform;
  iconUrl: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: number;
}

/**
 * Users table document type.
 */
export interface UsersDocument {
  _id: GenericId<"users">;
  _creationTime: number;
  email: string;
  displayName: string;
  isEmailVerified: boolean;
  providerType?: string;
  providerId?: string;
  updatedAt: number;
}

/**
 * Auth Credentials table document type.
 */
export interface AuthCredentialsDocument {
  _id: GenericId<"authCredentials">;
  _creationTime: number;
  userId: GenericId<"users">;
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Magic Link Tokens table document type.
 */
export interface MagicLinkTokensDocument {
  _id: GenericId<"magicLinkTokens">;
  _creationTime: number;
  email: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  isUsed: boolean;
}

/**
 * Password Reset Tokens table document type.
 */
export interface PasswordResetTokensDocument {
  _id: GenericId<"passwordResetTokens">;
  _creationTime: number;
  userId: GenericId<"users">;
  email: string;
  token: string;
  createdAt: number;
  expiresAt: number;
  isUsed: boolean;
}

/**
 * Server Status Records table document type.
 */
export interface ServerStatusRecordsDocument {
  _id: GenericId<"serverStatusRecords">;
  _creationTime: number;
  gameId: GenericId<"games">;
  status: Status;
  region: Region;
  lastCheckedAt: number;
  statusChangedAt: number;
  statusMessage?: string;
  updatedAt: number;
}

/**
 * Status History table document type.
 */
export interface StatusHistoryDocument {
  _id: GenericId<"statusHistory">;
  _creationTime: number;
  gameId: GenericId<"games">;
  previousStatus: Status;
  newStatus: Status;
  timestamp: number;
  isArchived?: boolean;
}

/**
 * Favorites table document type.
 */
export interface FavoritesDocument {
  _id: GenericId<"favorites">;
  _creationTime: number;
  userId: GenericId<"users">;
  gameId: GenericId<"games">;
  createdAt: number;
}

/**
 * Alert Subscriptions table document type.
 */
export interface AlertSubscriptionsDocument {
  _id: GenericId<"alertSubscriptions">;
  _creationTime: number;
  userId: GenericId<"users">;
  gameId: GenericId<"games">;
  isActive: boolean;
  lastAlertSentAt?: number;
  createdAt: number;
}

/**
 * Table info types for each table.
 */
export type GamesTableInfo = GenericTableInfo;
export type UsersTableInfo = GenericTableInfo;
export type AuthCredentialsTableInfo = GenericTableInfo;
export type MagicLinkTokensTableInfo = GenericTableInfo;
export type PasswordResetTokensTableInfo = GenericTableInfo;
export type ServerStatusRecordsTableInfo = GenericTableInfo;
export type StatusHistoryTableInfo = GenericTableInfo;
export type FavoritesTableInfo = GenericTableInfo;
export type AlertSubscriptionsTableInfo = GenericTableInfo;

/**
 * Data model containing all tables.
 */
export type DataModel = GenericDataModel;

/**
 * Table names in this data model.
 */
export type TableNames =
  | "games"
  | "users"
  | "authCredentials"
  | "magicLinkTokens"
  | "passwordResetTokens"
  | "serverStatusRecords"
  | "statusHistory"
  | "favorites"
  | "alertSubscriptions";

/**
 * Id type alias for table document IDs.
 */
export type Id<TableName extends TableNames> = GenericId<TableName>;

/**
 * Doc type alias for table documents.
 */
export type Doc<TableName extends TableNames> =
  TableName extends "games" ? GamesDocument :
  TableName extends "users" ? UsersDocument :
  TableName extends "authCredentials" ? AuthCredentialsDocument :
  TableName extends "magicLinkTokens" ? MagicLinkTokensDocument :
  TableName extends "passwordResetTokens" ? PasswordResetTokensDocument :
  TableName extends "serverStatusRecords" ? ServerStatusRecordsDocument :
  TableName extends "statusHistory" ? StatusHistoryDocument :
  TableName extends "favorites" ? FavoritesDocument :
  TableName extends "alertSubscriptions" ? AlertSubscriptionsDocument :
  never;
