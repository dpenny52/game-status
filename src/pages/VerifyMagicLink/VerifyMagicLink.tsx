/**
 * VerifyMagicLink Page
 *
 * Handles magic link verification and user authentication.
 * Accessed via /verify-magic-link?token=...
 *
 * @module VerifyMagicLink
 */
import React, { useState, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../context/AuthContext";
import "./VerifyMagicLink.css";

/**
 * VerifyMagicLink page component.
 *
 * Features:
 * - Token extraction from URL parameter
 * - Automatic verification on page load
 * - Success state with redirect to dashboard
 * - Error state for invalid/expired tokens
 * - Loading state during verification
 *
 * @example
 * ```tsx
 * <Route path="/verify-magic-link" element={<VerifyMagicLink />} />
 * ```
 */
export function VerifyMagicLink(): JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser } = useAuth();
  const verifyMagicLinkMutation = useMutation(api.auth.verifyMagicLink);

  // Extract token from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");

    if (!tokenParam) {
      setError("No magic link token provided. Please request a new magic link.");
      return;
    }

    setToken(tokenParam);
  }, []);

  // Verify token when it's available
  const verifyToken = useCallback(async () => {
    if (!token || isVerifying || isSuccess || error) return;

    setIsVerifying(true);

    try {
      const result = await verifyMagicLinkMutation({ token });

      if (result.user) {
        // Set user in auth context
        setUser({
          _id: result.user._id,
          email: result.user.email as string,
          displayName: result.user.displayName as string,
          isEmailVerified: result.user.isEmailVerified as boolean,
          providerType: result.user.providerType as string | undefined,
          providerId: result.user.providerId as string | undefined,
        });

        setIsSuccess(true);

        // Redirect to dashboard after short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to verify magic link. Please request a new one."
      );
    } finally {
      setIsVerifying(false);
    }
  }, [token, isVerifying, isSuccess, error, verifyMagicLinkMutation, setUser]);

  // Auto-verify when token is set
  useEffect(() => {
    if (token && !isVerifying && !isSuccess && !error) {
      verifyToken();
    }
  }, [token, isVerifying, isSuccess, error, verifyToken]);

  // No token error state
  if (error && !token) {
    return (
      <div className="verify-magic-link-page" data-testid="verify-magic-link-error">
        <div className="verify-magic-link-container">
          <div className="verify-magic-link-card">
            <div className="verify-magic-link-error-state">
              <svg
                className="verify-magic-link-error-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <h2>Magic Link Invalid</h2>
              <p>{error}</p>
              <a href="/" className="verify-magic-link-link">
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Verifying state
  if (isVerifying) {
    return (
      <div className="verify-magic-link-page" data-testid="verify-magic-link-verifying">
        <div className="verify-magic-link-container">
          <div className="verify-magic-link-card">
            <div className="verify-magic-link-loading-state">
              <div className="verify-magic-link-spinner" />
              <p className="verify-magic-link-loading">Verifying your magic link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state (after verification attempt)
  if (error) {
    return (
      <div className="verify-magic-link-page" data-testid="verify-magic-link-error">
        <div className="verify-magic-link-container">
          <div className="verify-magic-link-card">
            <div className="verify-magic-link-error-state">
              <svg
                className="verify-magic-link-error-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <h2>Magic Link Invalid</h2>
              <p>{error}</p>
              <a href="/" className="verify-magic-link-link">
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="verify-magic-link-page" data-testid="verify-magic-link-success">
        <div className="verify-magic-link-container">
          <div className="verify-magic-link-card">
            <div className="verify-magic-link-success-state">
              <svg
                className="verify-magic-link-success-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <h2>Login Successful</h2>
              <p>You have been logged in successfully. Redirecting to the dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial loading state (waiting for token extraction)
  return (
    <div className="verify-magic-link-page" data-testid="verify-magic-link-loading">
      <div className="verify-magic-link-container">
        <div className="verify-magic-link-card">
          <div className="verify-magic-link-loading-state">
            <div className="verify-magic-link-spinner" />
            <p className="verify-magic-link-loading">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyMagicLink;
