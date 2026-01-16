/**
 * EmailAlertsSection Component
 *
 * Settings page section for managing email alert subscriptions.
 * Displays subscriptions grouped by game with pause/resume, edit, and delete actions.
 *
 * @module EmailAlertsSection
 */
import React, { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { SubscriptionListItem } from "./SubscriptionListItem";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "../../context/ToastContext";
import "./EmailAlertsSection.css";

/**
 * Region display labels.
 */
const REGION_LABELS: Record<string, string> = {
  na: "North America",
  eu: "Europe",
  asia: "Asia",
  oce: "Oceania",
  global: "Global",
};

/**
 * EmailAlertsSection component.
 *
 * Displays and manages the user's email alert subscriptions.
 *
 * @returns The email alerts section or null if no subscriptions
 *
 * @example
 * ```tsx
 * <EmailAlertsSection />
 * ```
 */
export function EmailAlertsSection(): React.JSX.Element {
  const { showSuccess, showError } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState<{
    subscriptionId: string;
    gameName: string;
    region: string;
  } | null>(null);

  // Query user subscriptions
  const subscriptions = useQuery(api.subscriptions.getUserSubscriptions);

  // Mutations
  const toggleSubscription = useMutation(api.subscriptions.toggleSubscriptionActive);
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);

  /**
   * Handle toggling subscription active state.
   */
  const handleToggleActive = useCallback(
    async (subscriptionId: string, isActive: boolean, gameName: string, region: string) => {
      try {
        await toggleSubscription({
          subscriptionId: subscriptionId as Id<"alertSubscriptions">,
          isActive,
        });
        const action = isActive ? "resumed" : "paused";
        showSuccess(`${gameName} (${REGION_LABELS[region] ?? region}) alerts ${action}`);
      } catch (error) {
        console.error("Failed to toggle subscription:", error);
        showError("Failed to update subscription. Please try again.");
      }
    },
    [toggleSubscription, showSuccess, showError]
  );

  /**
   * Handle delete button click - show confirmation.
   */
  const handleDeleteClick = useCallback(
    (subscriptionId: string, gameName: string, region: string) => {
      setDeleteConfirm({ subscriptionId, gameName, region });
    },
    []
  );

  /**
   * Handle delete confirmation.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;

    try {
      await deleteSubscription({
        subscriptionId: deleteConfirm.subscriptionId as Id<"alertSubscriptions">,
      });
      showSuccess(
        `Unsubscribed from ${deleteConfirm.gameName} (${REGION_LABELS[deleteConfirm.region] ?? deleteConfirm.region}) alerts`
      );
    } catch (error) {
      console.error("Failed to delete subscription:", error);
      showError("Failed to delete subscription. Please try again.");
    } finally {
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, deleteSubscription, showSuccess, showError]);

  /**
   * Handle delete cancel.
   */
  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  // Loading state
  if (subscriptions === undefined) {
    return (
      <section className="email-alerts-section">
        <h2 className="email-alerts-section__title">Email Alerts</h2>
        <div className="email-alerts-section__loading">Loading subscriptions...</div>
      </section>
    );
  }

  // Empty state
  if (subscriptions.length === 0) {
    return (
      <section className="email-alerts-section">
        <h2 className="email-alerts-section__title">Email Alerts</h2>
        <div className="email-alerts-section__empty">
          <p>You have no active email alert subscriptions.</p>
          <p className="email-alerts-section__empty-hint">
            Click the bell icon on any game card to subscribe to status alerts.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="email-alerts-section">
      <h2 className="email-alerts-section__title">Email Alerts</h2>
      <p className="email-alerts-section__description">
        Manage your email alert subscriptions. You will receive notifications when
        game servers go offline or have issues in your selected regions.
      </p>

      <div className="email-alerts-section__list">
        {subscriptions.map((group) => (
          <div key={group.gameId} className="email-alerts-section__game-group">
            <div className="email-alerts-section__game-header">
              {group.iconUrl && (
                <img
                  src={group.iconUrl}
                  alt=""
                  className="email-alerts-section__game-icon"
                  loading="lazy"
                />
              )}
              <h3 className="email-alerts-section__game-name">{group.gameName}</h3>
            </div>

            <div className="email-alerts-section__subscriptions">
              {group.subscriptions.map((sub) => (
                <SubscriptionListItem
                  key={sub._id}
                  subscriptionId={sub._id}
                  region={sub.region}
                  regionLabel={REGION_LABELS[sub.region] ?? sub.region}
                  isActive={sub.isActive}
                  gameName={group.gameName}
                  onToggle={(isActive) =>
                    handleToggleActive(sub._id, isActive, group.gameName, sub.region)
                  }
                  onDelete={() => handleDeleteClick(sub._id, group.gameName, sub.region)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Subscription"
          message={`Are you sure you want to delete ${deleteConfirm.gameName} (${REGION_LABELS[deleteConfirm.region] ?? deleteConfirm.region}) alerts? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </section>
  );
}

export default EmailAlertsSection;
