/**
 * Convex Scheduled Functions (Crons)
 *
 * Defines interval-based scheduled functions for the server status fetching service.
 * The main scheduler runs every 60 seconds to poll game server status APIs.
 *
 * @module crons
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Cron job definitions for GameStatus.
 *
 * ## Polling Scheduler
 * Runs every 60 seconds to dispatch status fetchers for all publishers.
 * Each publisher is fetched independently in parallel to ensure one failure
 * does not block others.
 */
const crons = cronJobs();

/**
 * Main status polling scheduler.
 *
 * Triggers every minute to fetch server status from all supported publishers:
 * - Blizzard (World of Warcraft, Diablo IV, Overwatch 2, Hearthstone)
 * - Riot Games (League of Legends, Valorant, Teamfight Tactics)
 * - Steam/Valve (Steam platform)
 * - Epic Games (Fortnite)
 * - Mojang/Microsoft (Minecraft)
 * - Square Enix (Final Fantasy XIV)
 *
 * The dispatcher coordinates parallel fetching with independent error handling
 * per publisher to ensure graceful degradation.
 */
crons.interval(
  "poll-server-status",
  { seconds: 60 },
  internal.statusFetcher.dispatchAllPublishers
);

export default crons;
