/**
 * SkeletonCard Component
 *
 * A loading placeholder that matches GameCard dimensions for visual consistency.
 * Displays a shimmer animation to indicate loading state.
 *
 * @module SkeletonCard
 */
import React from "react";
import "./SkeletonCard.css";

/**
 * Props for the SkeletonCard component.
 */
export interface SkeletonCardProps {
  /** Additional CSS class names */
  className?: string;
}

/**
 * SkeletonCard displays a loading placeholder with shimmer animation.
 *
 * @example
 * ```tsx
 * // Single skeleton
 * <SkeletonCard />
 *
 * // Multiple skeletons in a grid
 * {Array.from({ length: 6 }).map((_, i) => (
 *   <SkeletonCard key={i} />
 * ))}
 * ```
 */
export function SkeletonCard({ className = "" }: SkeletonCardProps): JSX.Element {
  return (
    <div
      data-testid="skeleton-card"
      className={`skeleton-card ${className}`.trim()}
      aria-busy="true"
      aria-label="Loading game status..."
    >
      <div className="skeleton-header">
        <div className="skeleton-icon skeleton-pulse" />
        <div className="skeleton-title-section">
          <div className="skeleton-title skeleton-pulse" />
          <div className="skeleton-subtitle skeleton-pulse" />
        </div>
      </div>
      <div className="skeleton-status">
        <div className="skeleton-status-indicator skeleton-pulse" />
      </div>
      <div className="skeleton-timestamps">
        <div className="skeleton-timestamp skeleton-pulse" />
        <div className="skeleton-timestamp skeleton-pulse" />
      </div>
      <div className="skeleton-footer">
        <div className="skeleton-regions skeleton-pulse" />
      </div>
    </div>
  );
}

export default SkeletonCard;
