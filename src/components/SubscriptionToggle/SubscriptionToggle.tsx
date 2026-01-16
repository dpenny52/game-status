/**
 * SubscriptionToggle Component
 *
 * Bell icon button that allows users to subscribe to email alerts for a game.
 * Positioned in the top-right corner of the game card.
 *
 * Features:
 * - Bell outline when not subscribed, filled when subscribed
 * - Click opens RegionSelectionPopover for selecting regions
 * - Optimistic UI updates while mutation is in progress
 * - Only visible to authenticated users
 *
 * @module SubscriptionToggle
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useAuth } from "../../context/AuthContext";
import { RegionSelectionPopover } from "./RegionSelectionPopover";
import "./SubscriptionToggle.css";

/**
 * Props for SubscriptionToggle component.
 */
interface SubscriptionToggleProps {
  /** The game ID to toggle subscription for */
  gameId: Id<"games">;
  /** The game name for display in toast */
  gameName: string;
  /** Optional callback when subscription changes */
  onSubscriptionChange?: (isSubscribed: boolean, regions: string[]) => void;
}

/**
 * Bell icon component for outline (not subscribed) state.
 */
function BellOutlineIcon(): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="subscription-toggle__icon"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/**
 * Bell icon component for filled (subscribed) state.
 */
function BellFilledIcon(): React.JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="subscription-toggle__icon subscription-toggle__icon--filled"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/**
 * SubscriptionToggle button component.
 *
 * Renders a bell icon that opens a popover for region selection.
 * The bell is filled when the user has any active subscriptions for the game.
 *
 * @param props - Component props
 * @returns The subscription toggle button or null if not authenticated
 *
 * @example
 * ```tsx
 * <SubscriptionToggle
 *   gameId="game123"
 *   gameName="World of Warcraft"
 *   onSubscriptionChange={(isSubscribed, regions) => {
 *     console.log('Subscription changed:', isSubscribed, regions);
 *   }}
 * />
 * ```
 */
export function SubscriptionToggle({
  gameId,
  gameName,
  onSubscriptionChange,
}: SubscriptionToggleProps): React.JSX.Element | null {
  const { isAuthenticated } = useAuth();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [optimisticSubscribed, setOptimisticSubscribed] = useState<boolean | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Query subscription status
  const subscriptionStatus = useQuery(
    api.subscriptions.getGameSubscription,
    isAuthenticated ? { gameId } : "skip"
  );

  // Query all subscribed regions (including inactive) for pre-populating popover
  const subscribedRegions = useQuery(
    api.subscriptions.getGameSubscribedRegions,
    isAuthenticated ? { gameId } : "skip"
  );

  // Mutation for upserting subscriptions
  const upsertSubscription = useMutation(api.subscriptions.upsertSubscription);

  // Determine current state
  const isSubscribed = optimisticSubscribed ?? subscriptionStatus?.isSubscribed ?? false;
  const currentRegions = subscribedRegions ?? [];

  // Clear optimistic state when query updates
  useEffect(() => {
    if (subscriptionStatus !== undefined) {
      setOptimisticSubscribed(null);
    }
  }, [subscriptionStatus]);

  /**
   * Handle button click to open popover.
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsPopoverOpen(true);
    },
    []
  );

  /**
   * Handle popover close.
   */
  const handlePopoverClose = useCallback(() => {
    setIsPopoverOpen(false);
  }, []);

  /**
   * Handle region selection and save.
   */
  const handleSaveRegions = useCallback(
    async (selectedRegions: string[]) => {
      // Close popover immediately
      setIsPopoverOpen(false);

      // Apply optimistic update
      const willBeSubscribed = selectedRegions.length > 0;
      setOptimisticSubscribed(willBeSubscribed);

      try {
        const result = await upsertSubscription({
          gameId,
          regions: selectedRegions,
        });

        // Call callback if provided
        if (onSubscriptionChange) {
          onSubscriptionChange(willBeSubscribed, selectedRegions);
        }

        return result;
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticSubscribed(null);
        console.error("Failed to update subscription:", error);
        throw error;
      }
    },
    [gameId, upsertSubscription, onSubscriptionChange]
  );

  // Don't render for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  // Show loading state while query is pending
  const isLoading = subscriptionStatus === undefined;

  return (
    <div className="subscription-toggle">
      <button
        ref={buttonRef}
        type="button"
        className={`subscription-toggle__button ${isSubscribed ? "subscription-toggle__button--subscribed" : ""} ${isLoading ? "subscription-toggle__button--loading" : ""}`}
        onClick={handleClick}
        disabled={isLoading}
        aria-label={isSubscribed ? "Manage email alerts" : "Subscribe to email alerts"}
        aria-expanded={isPopoverOpen}
        aria-haspopup="dialog"
        title={isSubscribed ? "Manage email alerts" : "Subscribe to email alerts"}
      >
        {isSubscribed ? <BellFilledIcon /> : <BellOutlineIcon />}
      </button>

      {isPopoverOpen && (
        <RegionSelectionPopover
          gameName={gameName}
          initialRegions={currentRegions}
          anchorRef={buttonRef}
          onSave={handleSaveRegions}
          onClose={handlePopoverClose}
        />
      )}
    </div>
  );
}

export default SubscriptionToggle;
