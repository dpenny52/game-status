/**
 * useStatusChangeAnimation Hook
 *
 * Tracks status changes between renders and provides an animation flag
 * that auto-clears after the animation duration.
 *
 * @module useStatusChangeAnimation
 */
import { useState, useEffect, useRef } from "react";
import type { Status } from "../components/StatusIndicator";

/**
 * Default animation duration in milliseconds.
 * Spec requires 500-800ms for visibility without interruption.
 */
const DEFAULT_ANIMATION_DURATION = 600;

/**
 * Options for useStatusChangeAnimation hook.
 */
export interface UseStatusChangeAnimationOptions {
  /** Animation duration in milliseconds (default: 600ms) */
  duration?: number;
}

/**
 * Return type for useStatusChangeAnimation hook.
 */
export interface UseStatusChangeAnimationResult {
  /** Whether the animation is currently active */
  isAnimating: boolean;
  /** The previous status value (for comparison) */
  previousStatus: Status | null;
}

/**
 * Hook that detects status changes and provides an animation flag.
 *
 * The animation flag is set to true when status changes (except on initial render)
 * and automatically clears after the specified duration.
 *
 * @param currentStatus - The current status value
 * @param options - Configuration options
 * @returns Object with isAnimating flag and previousStatus
 *
 * @example
 * ```tsx
 * function GameCard({ status }) {
 *   const { isAnimating } = useStatusChangeAnimation(status);
 *
 *   return (
 *     <div className={isAnimating ? 'status-change-animation' : ''}>
 *       <StatusIndicator status={status} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useStatusChangeAnimation(
  currentStatus: Status,
  options: UseStatusChangeAnimationOptions = {}
): UseStatusChangeAnimationResult {
  const { duration = DEFAULT_ANIMATION_DURATION } = options;

  // Track whether this is the initial render
  const isInitialRender = useRef(true);

  // Track the previous status value
  const previousStatusRef = useRef<Status | null>(null);

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // On initial render, just set the previous status without animating
    if (isInitialRender.current) {
      isInitialRender.current = false;
      previousStatusRef.current = currentStatus;
      return;
    }

    // Check if status actually changed
    if (previousStatusRef.current !== currentStatus && previousStatusRef.current !== null) {
      // Status changed - trigger animation
      setIsAnimating(true);

      // Auto-clear animation after duration
      const timeoutId = setTimeout(() => {
        setIsAnimating(false);
      }, duration);

      // Update previous status
      previousStatusRef.current = currentStatus;

      // Cleanup timeout on unmount or re-render
      return () => {
        clearTimeout(timeoutId);
      };
    }

    // Update previous status even if no change (handles edge cases)
    previousStatusRef.current = currentStatus;
  }, [currentStatus, duration]);

  return {
    isAnimating,
    previousStatus: previousStatusRef.current,
  };
}

export default useStatusChangeAnimation;
