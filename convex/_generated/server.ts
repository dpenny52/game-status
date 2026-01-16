/**
 * Generated Convex Server Utilities
 *
 * This file provides type-safe wrappers for Convex functions.
 * In a deployed Convex project, this file is auto-generated.
 * For local development/testing, we provide compatible stubs.
 */

import {
  ActionBuilder,
  MutationBuilder,
  QueryBuilder,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  actionGeneric,
  mutationGeneric,
  queryGeneric,
  httpActionGeneric,
} from "convex/server";
import type { DataModel } from "./dataModel";

/**
 * Define a query in this Convex app's public API.
 */
export const query = queryGeneric as QueryBuilder<DataModel, "public">;

/**
 * Define a mutation in this Convex app's public API.
 */
export const mutation = mutationGeneric as MutationBuilder<DataModel, "public">;

/**
 * Define an action in this Convex app's public API.
 */
export const action = actionGeneric as ActionBuilder<DataModel, "public">;

/**
 * Define a query that is only callable by other Convex functions.
 */
export const internalQuery = internalQueryGeneric as QueryBuilder<
  DataModel,
  "internal"
>;

/**
 * Define a mutation that is only callable by other Convex functions.
 */
export const internalMutation = internalMutationGeneric as MutationBuilder<
  DataModel,
  "internal"
>;

/**
 * Define an action that is only callable by other Convex functions.
 */
export const internalAction = internalActionGeneric as ActionBuilder<
  DataModel,
  "internal"
>;

/**
 * Define an HTTP action.
 */
export const httpAction = httpActionGeneric;
