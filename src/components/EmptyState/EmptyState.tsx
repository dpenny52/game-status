/**
 * EmptyState Component
 *
 * Displays appropriate messaging when no games are configured in the system.
 *
 * @module EmptyState
 */
import React from "react";
import "./EmptyState.css";

/**
 * Props for the EmptyState component.
 */
export interface EmptyStateProps {
  /** Custom message to display */
  message?: string;
  /** Additional description or context */
  description?: string;
  /** Additional CSS class names */
  className?: string;
}

/**
 * EmptyState displays messaging when there's no data to show.
 *
 * @example
 * ```tsx
 * <EmptyState />
 * <EmptyState message="No games available" description="Check back later." />
 * ```
 */
export function EmptyState({
  message = "No games configured",
  description = "Game status tracking hasn't been set up yet. Please check back later.",
  className = "",
}: EmptyStateProps): JSX.Element {
  return (
    <div className={`empty-state ${className}`.trim()} role="status">
      <div className="empty-state-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="empty-state-title">{message}</h3>
      {description && <p className="empty-state-description">{description}</p>}
    </div>
  );
}

export default EmptyState;
