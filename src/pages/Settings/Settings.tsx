/**
 * Settings Page
 *
 * User profile and account settings page.
 * Displays user information, notification preferences, and account actions.
 *
 * @module Settings
 */
import React, { useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { validateDisplayName } from "../../utils/formValidation";
import { NotificationPreferences } from "../../components/NotificationPreferences";
import type { AlertSubscription, Game } from "../../components/NotificationPreferences";
import "./Settings.css";

/**
 * Settings page component.
 *
 * Features:
 * - Display user email (read-only)
 * - Editable display name
 * - Email verification status badge
 * - Connected OAuth provider display
 * - Account creation date
 * - Notification preferences management
 * - Logout button
 *
 * @example
 * ```tsx
 * <Route path="/settings" element={<Settings />} />
 * ```
 */
export function Settings(): JSX.Element {
  const { user, isAuthenticated, isLoading, logout, updateDisplayName, openLoginModal } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Mock data for notification preferences (in production, these would come from Convex queries)
  // TODO: Replace with actual Convex queries when integrated
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  // Mock games data (in production, this would come from Convex queries)
  const mockGames: Game[] = [
    { _id: "game1", displayName: "World of Warcraft" },
    { _id: "game2", displayName: "Diablo IV" },
    { _id: "game3", displayName: "Overwatch 2" },
    { _id: "game4", displayName: "League of Legends" },
    { _id: "game5", displayName: "Valorant" },
    { _id: "game6", displayName: "Final Fantasy XIV" },
  ];

  // Reset display name when user changes
  React.useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  // Handle save display name
  const handleSave = useCallback(async () => {
    const validation = validateDisplayName(displayName);
    if (!validation.isValid) {
      setError(validation.error || "Invalid display name");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await updateDisplayName(displayName);
      setIsEditing(false);
      setSuccessMessage("Display name updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update display name");
    } finally {
      setIsSaving(false);
    }
  }, [displayName, updateDisplayName]);

  // Handle cancel edit
  const handleCancel = useCallback(() => {
    setDisplayName(user?.displayName || "");
    setIsEditing(false);
    setError(null);
  }, [user]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    await logout();
    setShowLogoutConfirm(false);
  }, [logout]);

  // Notification preferences handlers
  const handleToggleSubscription = useCallback(
    async (subscriptionId: string, isActive: boolean) => {
      // TODO: Replace with Convex mutation
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub._id === subscriptionId ? { ...sub, isActive } : sub
        )
      );
    },
    []
  );

  const handleAddSubscription = useCallback(
    async (gameId: string, region: string) => {
      // TODO: Replace with Convex mutation
      const game = mockGames.find((g) => g._id === gameId);
      if (!game) throw new Error("Game not found");

      const newSubscription: AlertSubscription = {
        _id: `sub_${Date.now()}`,
        userId: user?._id || "",
        gameId,
        region,
        isActive: true,
        gameName: game.displayName,
        lastAlertSentAt: null,
      };

      setSubscriptions((prev) => [...prev, newSubscription]);
    },
    [user, mockGames]
  );

  const handleDeleteSubscription = useCallback(async (subscriptionId: string) => {
    // TODO: Replace with Convex mutation
    setSubscriptions((prev) => prev.filter((sub) => sub._id !== subscriptionId));
  }, []);

  // Format creation date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get provider display name
  const getProviderDisplayName = (provider?: string) => {
    const providers: Record<string, string> = {
      discord: "Discord",
      twitch: "Twitch",
    };
    return provider ? providers[provider] || provider : null;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="settings-page" data-testid="settings-loading">
        <div className="settings-container">
          <p className="settings-loading-text">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated || !user) {
    return (
      <div className="settings-page" data-testid="settings-unauthenticated">
        <div className="settings-container">
          <div className="settings-login-prompt">
            <h2>Sign in Required</h2>
            <p>Please sign in to access your account settings.</p>
            <button
              className="settings-login-button"
              onClick={openLoginModal}
              data-testid="settings-login-button"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page" data-testid="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <h1 className="settings-title">Account Settings</h1>
        </header>

        {/* Success message */}
        {successMessage && (
          <div className="settings-success" role="alert" data-testid="settings-success">
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="settings-error" role="alert" data-testid="settings-error">
            {error}
          </div>
        )}

        <main className="settings-content">
          {/* Profile Section */}
          <section className="settings-section">
            <h2 className="settings-section-title">Profile</h2>

            {/* Email (read-only) */}
            <div className="settings-field">
              <label className="settings-label">Email</label>
              <div className="settings-value-row">
                <span className="settings-value" data-testid="settings-email">
                  {user.email}
                </span>
                {user.isEmailVerified ? (
                  <span className="settings-badge settings-badge-verified" data-testid="verified-badge">
                    Verified
                  </span>
                ) : (
                  <span className="settings-badge settings-badge-unverified" data-testid="unverified-badge">
                    Unverified
                  </span>
                )}
              </div>
            </div>

            {/* Display Name */}
            <div className="settings-field">
              <label className="settings-label" htmlFor="displayName">
                Display Name
              </label>
              {isEditing ? (
                <div className="settings-edit-row">
                  <input
                    id="displayName"
                    type="text"
                    className="settings-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isSaving}
                    data-testid="settings-displayname-input"
                  />
                  <div className="settings-edit-actions">
                    <button
                      className="settings-button settings-button-primary"
                      onClick={handleSave}
                      disabled={isSaving}
                      data-testid="settings-save-button"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="settings-button settings-button-secondary"
                      onClick={handleCancel}
                      disabled={isSaving}
                      data-testid="settings-cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="settings-value-row">
                  <span className="settings-value" data-testid="settings-displayname">
                    {user.displayName}
                  </span>
                  <button
                    className="settings-edit-button"
                    onClick={() => setIsEditing(true)}
                    data-testid="settings-edit-button"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* OAuth Provider */}
            {user.providerType && (
              <div className="settings-field">
                <label className="settings-label">Connected Account</label>
                <div className="settings-value-row">
                  <span className="settings-value settings-provider" data-testid="settings-provider">
                    <span className={`provider-icon provider-${user.providerType}`} />
                    {getProviderDisplayName(user.providerType)}
                  </span>
                </div>
              </div>
            )}

            {/* Account Created */}
            <div className="settings-field">
              <label className="settings-label">Account Created</label>
              <span className="settings-value settings-date" data-testid="settings-created">
                {formatDate(user._creationTime)}
              </span>
            </div>
          </section>

          {/* Notification Preferences Section */}
          <NotificationPreferences
            subscriptions={subscriptions}
            games={mockGames}
            onToggle={handleToggleSubscription}
            onAdd={handleAddSubscription}
            onDelete={handleDeleteSubscription}
            isLoading={subscriptionsLoading}
            error={subscriptionError}
          />

          {/* Account Actions Section */}
          <section className="settings-section settings-section-actions">
            <h2 className="settings-section-title">Account</h2>

            {/* Logout */}
            <div className="settings-field">
              {showLogoutConfirm ? (
                <div className="settings-logout-confirm">
                  <p>Are you sure you want to log out?</p>
                  <div className="settings-logout-actions">
                    <button
                      className="settings-button settings-button-danger"
                      onClick={handleLogout}
                      data-testid="settings-confirm-logout"
                    >
                      Yes, Log Out
                    </button>
                    <button
                      className="settings-button settings-button-secondary"
                      onClick={() => setShowLogoutConfirm(false)}
                      data-testid="settings-cancel-logout"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="settings-button settings-button-danger"
                  onClick={() => setShowLogoutConfirm(true)}
                  data-testid="settings-logout-button"
                >
                  Log Out
                </button>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Settings;
