/**
 * ForgotPasswordModal Component
 *
 * Modal for requesting a password reset link via email.
 * Always shows success message regardless of whether the email exists
 * to prevent email enumeration attacks.
 *
 * @module ForgotPasswordModal
 */
import React, { useState, useCallback } from "react";
import { Modal } from "./Modal";
import { validateEmail } from "../../utils/formValidation";
import "./AuthForms.css";

/**
 * Props for the ForgotPasswordModal component.
 */
export interface ForgotPasswordModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback to go back to login modal */
  onBackToLogin: () => void;
  /** Callback to request password reset - connected to Convex mutation */
  onRequestReset: (email: string) => Promise<{ success: boolean; message: string }>;
  /** Pre-filled email from login form */
  initialEmail?: string;
}

/**
 * ForgotPasswordModal provides a form to request a password reset link.
 *
 * Features:
 * - Email input with validation
 * - Always shows success message (prevents email enumeration)
 * - Back to login navigation
 * - Connected to Convex requestPasswordReset mutation
 *
 * @example
 * ```tsx
 * <ForgotPasswordModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onBackToLogin={handleBackToLogin}
 *   onRequestReset={requestPasswordReset}
 *   initialEmail={userEmail}
 * />
 * ```
 */
export function ForgotPasswordModal({
  isOpen,
  onClose,
  onBackToLogin,
  onRequestReset,
  initialEmail = "",
}: ForgotPasswordModalProps): JSX.Element {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset form when modal closes
  const handleClose = useCallback(() => {
    setEmail(initialEmail);
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
    onClose();
  }, [onClose, initialEmail]);

  // Handle back to login
  const handleBackToLogin = useCallback(() => {
    setEmail(initialEmail);
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
    onBackToLogin();
  }, [onBackToLogin, initialEmail]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate email
      const emailResult = validateEmail(email);
      if (!emailResult.isValid) {
        setError(emailResult.error || "Invalid email");
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        await onRequestReset(email);
        // Always show success to prevent email enumeration
        setIsSuccess(true);
      } catch (err) {
        // Even on error, show success message to prevent enumeration
        // Only show error for network/validation issues
        if (err instanceof Error && err.message.includes("Invalid email")) {
          setError(err.message);
        } else {
          // For any other error, still show success to prevent enumeration
          setIsSuccess(true);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [email, onRequestReset]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Password"
      size="small"
    >
      {isSuccess ? (
        // Success state
        <div className="auth-success" data-testid="forgot-password-success">
          <svg
            className="auth-success-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p>
            If an account exists with this email, you will receive a password
            reset link shortly.
          </p>
          <p className="auth-description">
            Check your inbox and spam folder.
          </p>
          <button
            type="button"
            className="auth-button auth-button-primary"
            onClick={handleBackToLogin}
            data-testid="back-to-login-button"
          >
            Back to Login
          </button>
        </div>
      ) : (
        // Form state
        <div className="auth-form-section">
          {error && (
            <div className="auth-error" role="alert" data-testid="forgot-password-error">
              {error}
            </div>
          )}

          <p className="auth-description">
            Enter your email address and we will send you a link to reset your
            password.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="forgot-password-email" className="form-label">
                Email
              </label>
              <input
                id="forgot-password-email"
                type="email"
                className={`form-input ${error ? "form-input-error" : ""}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                autoComplete="email"
                data-testid="forgot-password-email-input"
              />
            </div>

            <button
              type="submit"
              className="auth-button auth-button-primary"
              disabled={isLoading}
              data-testid="forgot-password-submit"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <button
            type="button"
            className="auth-link-button"
            onClick={handleBackToLogin}
            data-testid="forgot-password-back-link"
          >
            Back to login
          </button>
        </div>
      )}
    </Modal>
  );
}

export default ForgotPasswordModal;
