/**
 * Fetch Utilities
 *
 * Common utilities for making HTTP requests to external APIs
 * with timeout handling and error normalization.
 *
 * @module lib/fetchUtils
 */

import { HTTP_TIMEOUT_MS } from "./retry";

/**
 * Result type for fetch operations.
 */
export interface FetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Makes an HTTP request with timeout handling.
 *
 * @param url - The URL to fetch
 * @param options - Optional fetch options (headers, method, body, etc.)
 * @returns A promise that resolves to the FetchResult
 */
export async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit = {}
): Promise<FetchResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
    }

    const data = (await response.json()) as T;
    return {
      success: true,
      data,
      statusCode: response.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: `Request timeout after ${HTTP_TIMEOUT_MS}ms`,
          statusCode: 408,
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Makes an HTTP request expecting HTML response.
 *
 * @param url - The URL to fetch
 * @param options - Optional fetch options
 * @returns A promise that resolves to the HTML string or error
 */
export async function fetchHtml(
  url: string,
  options: RequestInit = {}
): Promise<FetchResult<string>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
    }

    const html = await response.text();
    return {
      success: true,
      data: html,
      statusCode: response.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: `Request timeout after ${HTTP_TIMEOUT_MS}ms`,
          statusCode: 408,
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Checks if a required environment variable is set.
 *
 * @param envVar - The environment variable value (or undefined)
 * @returns True if the variable is set and non-empty
 */
export function isEnvVarSet(envVar: string | undefined): boolean {
  return envVar !== undefined && envVar.trim() !== "";
}

/**
 * Gets environment variable or throws an error if not set.
 * Use this for required credentials.
 *
 * @param name - The environment variable name (for error message)
 * @param value - The environment variable value
 * @returns The environment variable value
 * @throws Error if the variable is not set
 */
export function requireEnvVar(name: string, value: string | undefined): string {
  if (!isEnvVarSet(value)) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value as string;
}
