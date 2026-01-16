/**
 * FavoriteToggle Component
 *
 * A reusable star icon toggle button for marking games as favorites.
 * Implements optimistic updates for immediate UI feedback and includes
 * proper accessibility attributes.
 *
 * @module FavoriteToggle
 */
import React, { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import "./FavoriteToggle.css";

/**
 * Props for the FavoriteToggle component.
 */
export interface FavoriteToggleProps {
  /** The ID of the game to toggle as favorite */
  gameId: Id<"games">;
  /** Whether the game is currently favorited */
  isFavorited: boolean;
  /** Optional callback fired after successful toggle */
  onToggle?: (newState: boolean) => void;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Star icon SVG for the favorited state (filled).
 */
function FilledStarIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="favorite-toggle-icon"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/**
 * Star icon SVG for the unfavorited state (outline).
 */
function OutlineStarIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="favorite-toggle-icon"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/**
 * FavoriteToggle renders a clickable star icon for toggling favorites.
 *
 * Features:
 * - Optimistic UI updates for immediate feedback
 * - Loading state to prevent double-clicks
 * - Proper ARIA attributes for accessibility
 * - Event propagation handling to prevent parent clicks
 *
 * @example
 * ```tsx
 * <FavoriteToggle
 *   gameId={game._id}
 *   isFavorited={game.isFavorited}
 *   onToggle={(newState) => console.log("Toggled:", newState)}
 * />
 * ```
 */
export function FavoriteToggle({
  gameId,
  isFavorited,
  onToggle,
  className = "",
}: FavoriteToggleProps): JSX.Element {
  // Local state for optimistic updates
  const [optimisticFavorited, setOptimisticFavorited] = useState(isFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Sync local state when prop changes (from server data)
  React.useEffect(() => {
    setOptimisticFavorited(isFavorited);
  }, [isFavorited]);

  // Get the toggle mutation
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  /**
   * Handle click to toggle favorite state.
   */
  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      // Stop propagation to prevent triggering parent card handlers
      event.stopPropagation();
      event.preventDefault();

      // Prevent double-clicks during loading
      if (isLoading) return;

      // Clear any previous error state
      setHasError(false);

      // Optimistic update - immediately update UI
      const newState = !optimisticFavorited;
      setOptimisticFavorited(newState);
      setIsLoading(true);

      try {
        // Call the mutation
        const result = await toggleFavorite({ gameId });

        // Verify result matches expected state
        if (result !== newState) {
          // Server returned different state, update to match
          setOptimisticFavorited(result);
        }

        // Call callback on success
        onToggle?.(result);
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticFavorited(!newState);
        setHasError(true);
        console.error("Failed to toggle favorite:", error);

        // Clear error state after brief display
        setTimeout(() => setHasError(false), 2000);
      } finally {
        setIsLoading(false);
      }
    },
    [gameId, optimisticFavorited, isLoading, toggleFavorite, onToggle]
  );

  /**
   * Handle keyboard events for accessibility.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Stop propagation for Enter and Space to prevent parent handlers
      if (event.key === "Enter" || event.key === " ") {
        event.stopPropagation();
      }
    },
    []
  );

  // Determine the current display state
  const displayFavorited = optimisticFavorited;
  const ariaLabel = displayFavorited
    ? "Remove from favorites"
    : "Add to favorites";

  // Build class names
  const classNames = [
    "favorite-toggle",
    displayFavorited ? "favorite-toggle-favorited" : "favorite-toggle-unfavorited",
    isLoading ? "favorite-toggle-loading" : "",
    hasError ? "favorite-toggle-error" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classNames}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      aria-pressed={displayFavorited}
      aria-label={ariaLabel}
      data-testid="favorite-toggle"
    >
      {displayFavorited ? <FilledStarIcon /> : <OutlineStarIcon />}
    </button>
  );
}

export default FavoriteToggle;
