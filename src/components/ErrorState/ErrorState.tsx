/**
 * ErrorState Component
 *
 * Displays a user-friendly error message with a retry option.
 *
 * @module ErrorState
 */
import React from "react";
import "./ErrorState.css";

/**
 * Props for the ErrorState component.
 */
export interface ErrorStateProps {
  /** Error message to display */
  message?: string;
  /** Additional description or context */
  description?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Additional CSS class names */
  className?: string;
}

/**
 * ErrorState displays an error with optional retry functionality.
 *
 * @example
 * ```tsx
 * <ErrorState
 *   message="Failed to load game status"
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export function ErrorState({
  message = "Something went wrong",
  description = "We couldn't load the game status. Please try again.",
  onRetry,
  className = "",
}: ErrorStateProps): JSX.Element {
  return (
    <div className={`error-state ${className}`.trim()} role="alert">
      <div className="error-state-icon">
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
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <h3 className="error-state-title">{message}</h3>
      {description && <p className="error-state-description">{description}</p>}
      {onRetry && (
        <button
          type="button"
          className="error-state-retry-button"
          onClick={onRetry}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
