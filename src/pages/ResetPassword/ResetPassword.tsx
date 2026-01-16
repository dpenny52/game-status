/**
 * ResetPassword Page
 *
 * Handles password reset flow with token validation.
 * Accessed via /reset-password?token=...
 *
 * @module ResetPassword
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  validatePassword,
  validatePasswordMatch,
} from "../../utils/formValidation";
import { PasswordStrengthIndicator } from "../../components/auth";
import "./ResetPassword.css";

/**
 * ResetPassword page component.
 *
 * Features:
 * - Token validation from URL parameter
 * - New password form with validation
 * - Confirm password field
 * - Password strength indicator
 * - Success/error message display
 * - Link back to login on success
 *
 * @example
 * ```tsx
 * <Route path="/reset-password" element={<ResetPassword />} />
 * ```
 */
export function ResetPassword(): JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Extract token from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");

    if (!tokenParam) {
      setTokenError("No reset token provided. Please request a new password reset link.");
      setIsValidating(false);
      return;
    }

    setToken(tokenParam);

    // Validate token (in production, this would call Convex)
    // For now, we simulate token validation
    const validateToken = async () => {
      try {
        // Simulate API call to validate token
        await new Promise((resolve) => setTimeout(resolve, 500));

        // For demo purposes, accept any non-empty token
        if (tokenParam.length > 0) {
          setIsTokenValid(true);
        } else {
          setTokenError("Invalid or expired reset link. Please request a new one.");
        }
      } catch (error) {
        setTokenError("Failed to validate reset link. Please try again.");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate password
      const passwordResult = validatePassword(password);
      const matchResult = validatePasswordMatch(password, confirmPassword);

      const newErrors: Record<string, string> = {};

      if (!passwordResult.isValid) {
        newErrors.password = passwordResult.errors[0];
      }

      if (!matchResult.isValid) {
        newErrors.confirmPassword = matchResult.error || "";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setErrors({});
      setIsLoading(true);

      try {
        // In production, this would call the Convex resetPassword mutation
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSuccess(true);
      } catch (error) {
        setErrors({
          general:
            error instanceof Error
              ? error.message
              : "Failed to reset password. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [password, confirmPassword, token]
  );

  // Validating token state
  if (isValidating) {
    return (
      <div className="reset-password-page" data-testid="reset-password-validating">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <p className="reset-password-loading">Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Token error state
  if (tokenError || !isTokenValid) {
    return (
      <div className="reset-password-page" data-testid="reset-password-error">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="reset-password-error-state">
              <svg
                className="reset-password-error-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <h2>Reset Link Invalid</h2>
              <p>{tokenError || "This reset link is invalid or has expired."}</p>
              <a href="/" className="reset-password-link">
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
      <div className="reset-password-page" data-testid="reset-password-success">
        <div className="reset-password-container">
          <div className="reset-password-card">
            <div className="reset-password-success-state">
              <svg
                className="reset-password-success-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <h2>Password Reset Successful</h2>
              <p>Your password has been successfully reset. You can now log in with your new password.</p>
              <a href="/" className="reset-password-button" data-testid="back-to-login">
                Back to Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="reset-password-page" data-testid="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          <header className="reset-password-header">
            <h1 className="reset-password-title">Reset Password</h1>
            <p className="reset-password-description">
              Enter your new password below.
            </p>
          </header>

          {/* General error */}
          {errors.general && (
            <div className="reset-password-error" role="alert">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="reset-password-form">
            {/* New Password */}
            <div className="form-group">
              <label htmlFor="new-password" className="form-label">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                className={`form-input ${errors.password ? "form-input-error" : ""}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={isLoading}
                autoComplete="new-password"
                data-testid="new-password-input"
              />
              {errors.password && (
                <span className="form-error" role="alert">
                  {errors.password}
                </span>
              )}
              <PasswordStrengthIndicator password={password} />
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirm-password" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                className={`form-input ${errors.confirmPassword ? "form-input-error" : ""}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={isLoading}
                autoComplete="new-password"
                data-testid="confirm-password-input"
              />
              {errors.confirmPassword && (
                <span className="form-error" role="alert">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="reset-password-submit"
              disabled={isLoading}
              data-testid="reset-password-submit"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="reset-password-footer">
            <a href="/" className="reset-password-link">
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
