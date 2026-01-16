/**
 * Publishers Module Index
 *
 * Re-exports all publisher-specific status fetchers for centralized access.
 * Each publisher has its own fetchStatus internal action.
 *
 * @module publishers
 */

export * as blizzard from "./blizzard";
export * as riot from "./riot";
export * as steam from "./steam";
export * as epic from "./epic";
export * as mojang from "./mojang";
export * as squareenix from "./squareenix";
