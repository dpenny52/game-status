/**
 * SubscriptionListItem Component
 *
 * Individual subscription row in the email alerts settings section.
 * Displays region with pause/resume toggle and delete button.
 *
 * @module SubscriptionListItem
 */
import React, { useCallback, useState } from "react";
import "./SubscriptionListItem.css";

/**
 * Props for SubscriptionListItem component.
 */
interface SubscriptionListItemProps {
  /** Subscription ID */
  subscriptionId: string;
  /** Region code */
  region: string;
  /** Human-readable region label */
  regionLabel: string;
  /** Whether the subscription is active */
  isActive: boolean;
  /** Game name for accessibility */
  gameName: string;
  /** Callback when toggle is clicked */
  onToggle: (isActive: boolean) => Promise<void>;
  /** Callback when delete is clicked */
  onDelete: () => void;
}

/**
 * SubscriptionListItem component.
 *
 * @example
 * ```tsx
 * <SubscriptionListItem
 *   subscriptionId="sub_123"
 *   region="na"
 *   regionLabel="North America"
 *   isActive={true}
 *   gameName="World of Warcraft"
 *   onToggle={(isActive) => toggleSubscription(subscriptionId, isActive)}
 *   onDelete={() => deleteSubscription(subscriptionId)}
 * />
 * ```
 */
export function SubscriptionListItem({
  subscriptionId,
  region: _region,
  regionLabel,
  isActive,
  gameName,
  onToggle,
  onDelete,
}: SubscriptionListItemProps): React.JSX.Element {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onToggle(!isActive);
    } finally {
      setIsUpdating(false);
    }
  }, [isActive, onToggle, isUpdating]);

  return (
    <div
      className={`subscription-list-item ${!isActive ? "subscription-list-item--paused" : ""}`}
      data-subscription-id={subscriptionId}
    >
      <div className="subscription-list-item__info">
        <span className="subscription-list-item__region">{regionLabel}</span>
        {!isActive && (
          <span className="subscription-list-item__status">Paused</span>
        )}
      </div>

      <div className="subscription-list-item__actions">
        <button
          type="button"
          className={`subscription-list-item__toggle ${isActive ? "subscription-list-item__toggle--active" : ""}`}
          onClick={handleToggle}
          disabled={isUpdating}
          aria-label={`${isActive ? "Pause" : "Resume"} ${gameName} ${regionLabel} alerts`}
          title={isActive ? "Pause alerts" : "Resume alerts"}
        >
          {isActive ? (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="subscription-list-item__icon"
              aria-hidden="true"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="subscription-list-item__icon"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          className="subscription-list-item__delete"
          onClick={onDelete}
          aria-label={`Delete ${gameName} ${regionLabel} alerts`}
          title="Delete subscription"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="subscription-list-item__icon"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default SubscriptionListItem;
