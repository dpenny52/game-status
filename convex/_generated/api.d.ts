/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alertNotifications from "../alertNotifications.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as favorites from "../favorites.js";
import type * as http from "../http.js";
import type * as lib_authUtils from "../lib/authUtils.js";
import type * as lib_fetchUtils from "../lib/fetchUtils.js";
import type * as lib_htmlUtils from "../lib/htmlUtils.js";
import type * as lib_logger from "../lib/logger.js";
import type * as lib_retry from "../lib/retry.js";
import type * as lib_transitionDetection from "../lib/transitionDetection.js";
import type * as publishers_blizzard from "../publishers/blizzard.js";
import type * as publishers_epic from "../publishers/epic.js";
import type * as publishers_index from "../publishers/index.js";
import type * as publishers_mojang from "../publishers/mojang.js";
import type * as publishers_riot from "../publishers/riot.js";
import type * as publishers_squareenix from "../publishers/squareenix.js";
import type * as publishers_steam from "../publishers/steam.js";
import type * as queries from "../queries.js";
import type * as seedGames from "../seedGames.js";
import type * as statusFetcher from "../statusFetcher.js";
import type * as statusMutations from "../statusMutations.js";
import type * as subscriptions from "../subscriptions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alertNotifications: typeof alertNotifications;
  auth: typeof auth;
  crons: typeof crons;
  favorites: typeof favorites;
  http: typeof http;
  "lib/authUtils": typeof lib_authUtils;
  "lib/fetchUtils": typeof lib_fetchUtils;
  "lib/htmlUtils": typeof lib_htmlUtils;
  "lib/logger": typeof lib_logger;
  "lib/retry": typeof lib_retry;
  "lib/transitionDetection": typeof lib_transitionDetection;
  "publishers/blizzard": typeof publishers_blizzard;
  "publishers/epic": typeof publishers_epic;
  "publishers/index": typeof publishers_index;
  "publishers/mojang": typeof publishers_mojang;
  "publishers/riot": typeof publishers_riot;
  "publishers/squareenix": typeof publishers_squareenix;
  "publishers/steam": typeof publishers_steam;
  queries: typeof queries;
  seedGames: typeof seedGames;
  statusFetcher: typeof statusFetcher;
  statusMutations: typeof statusMutations;
  subscriptions: typeof subscriptions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
