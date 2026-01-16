/**
 * Notification Preferences Component
 *
 * Displays and manages user's alert subscriptions for game status notifications.
 * Allows users to view, enable/disable, add, and delete subscriptions.
 *
 * @module NotificationPreferences
 */
import React, { useState, useCallback } from "react";
import "./NotificationPreferences.css";

/**
 * Alert subscription type for display.
 */
export interface AlertSubscription {
  _id: string;
  userId: string;
  gameId: string;
  region: string;
  isActive: boolean;
  gameName: string;
  lastAlertSentAt: number | null;
}

/**
 * Game type for add subscription dropdown.
 */
export interface Game {
  _id: string;
  displayName: string;
}

/**
 * Available regions for subscriptions.
 */
const REGIONS = ["na", "eu", "asia", "oce", "global"] as const;

/**
 * Region display labels.
 */
const REGION_LABELS: Record<string, string> = {
  na: "North America",
  eu: "Europe",
  asia: "Asia-Pacific",
  oce: "Oceania",
  global: "Global",
};

/**
 * Props for NotificationPreferences component.
 */
interface NotificationPreferencesProps {
  subscriptions: AlertSubscription[];
  games: Game[];
  onToggle: (subscriptionId: string, isActive: boolean) => Promise<void>;
  onAdd: (gameId: string, region: string) => Promise<void>;
  onDelete: (subscriptionId: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

/**
 * NotificationPreferences component.
 *
 * Renders the notification preferences section for the settings page.
 * Displays a list of subscriptions with toggle controls and an add flow.
 */
export function NotificationPreferences({
  subscriptions,
  games,
  onToggle,
  onAdd,
  onDelete,
  isLoading,
  error,
}: NotificationPreferencesProps): JSX.Element {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("na");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Clear feedback after 3 seconds
  const showFeedback = useCallback((type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  }, []);

  // Handle toggle subscription
  const handleToggle = useCallback(
    async (subscriptionId: string, currentState: boolean) => {
      try {
        await onToggle(subscriptionId, !currentState);
        showFeedback("success", currentState ? "Alerts paused" : "Alerts enabled");
      } catch (err) {
        showFeedback("error", "Failed to update subscription");
      }
    },
    [onToggle, showFeedback]
  );

  // Handle add subscription
  const handleAdd = useCallback(async () => {
    if (!selectedGame || !selectedRegion) return;

    setIsSubmitting(true);
    try {
      await onAdd(selectedGame, selectedRegion);
      showFeedback("success", "Subscription added");
      setShowAddForm(false);
      setSelectedGame("");
      setSelectedRegion("na");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add subscription";
      showFeedback("error", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedGame, selectedRegion, onAdd, showFeedback]);

  // Handle delete subscription
  const handleDelete = useCallback(
    async (subscriptionId: string) => {
      try {
        await onDelete(subscriptionId);
        showFeedback("success", "Subscription removed");
      } catch (err) {
        showFeedback("error", "Failed to remove subscription");
      }
    },
    [onDelete, showFeedback]
  );

  // Filter available games (exclude already subscribed game+region combinations)
  const getAvailableGames = useCallback(() => {
    return games.filter((game) => {
      // Check if user already has a subscription for this game in the selected region
      return !subscriptions.some(
        (sub) => sub.gameId === game._id && sub.region === selectedRegion
      );
    });
  }, [games, subscriptions, selectedRegion]);

  // Loading state
  if (isLoading) {
    return (
      <section className="notification-preferences" data-testid="notification-preferences">
        <h2 className="notification-preferences-title">Alert Notifications</h2>
        <p className="notification-preferences-loading">Loading subscriptions...</p>
      </section>
    );
  }

  return (
    <section className="notification-preferences" data-testid="notification-preferences">
      <div className="notification-preferences-header">
        <h2 className="notification-preferences-title">Alert Notifications</h2>
        <p className="notification-preferences-description">
          Get notified when game servers come back online after an outage.
        </p>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div
          className={`notification-feedback notification-feedback-${feedback.type}`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="notification-error" role="alert">
          {error}
        </div>
      )}

      {/* Subscription list */}
      {subscriptions.length > 0 ? (
        <ul className="notification-list">
          {subscriptions.map((subscription) => (
            <li key={subscription._id} className="notification-item">
              <div className="notification-item-info">
                <span className="notification-game-name">{subscription.gameName}</span>
                <span className="notification-region">{subscription.region.toUpperCase()}</span>
              </div>
              <div className="notification-item-actions">
                <button
                  role="switch"
                  aria-checked={subscription.isActive}
                  className={`notification-toggle ${subscription.isActive ? "active" : ""}`}
                  onClick={() => handleToggle(subscription._id, subscription.isActive)}
                  title={subscription.isActive ? "Pause alerts" : "Enable alerts"}
                >
                  <span className="notification-toggle-slider" />
                </button>
                <button
                  className="notification-delete-btn"
                  onClick={() => handleDelete(subscription._id)}
                  title="Remove subscription"
                  aria-label="Remove subscription"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="notification-empty">
          No alert subscriptions yet. Add one to get notified when your favorite games come back
          online.
        </p>
      )}

      {/* Add subscription form */}
      {showAddForm ? (
        <div className="notification-add-form">
          <div className="notification-form-row">
            <label className="notification-label" htmlFor="game-select">
              Game
            </label>
            <select
              id="game-select"
              className="notification-select"
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Select a game...</option>
              {getAvailableGames().map((game) => (
                <option key={game._id} value={game._id}>
                  {game.displayName}
                </option>
              ))}
            </select>
          </div>
          <div className="notification-form-row">
            <label className="notification-label" htmlFor="region-select">
              Region
            </label>
            <select
              id="region-select"
              className="notification-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              disabled={isSubmitting}
            >
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {REGION_LABELS[region]} ({region.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
          <div className="notification-form-actions">
            <button
              className="notification-btn notification-btn-primary"
              onClick={handleAdd}
              disabled={!selectedGame || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Subscription"}
            </button>
            <button
              className="notification-btn notification-btn-secondary"
              onClick={() => setShowAddForm(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className="notification-btn notification-btn-add"
          onClick={() => setShowAddForm(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Alert Subscription
        </button>
      )}
    </section>
  );
}

export default NotificationPreferences;
