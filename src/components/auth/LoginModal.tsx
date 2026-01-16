/**
 * LoginModal Component
 *
 * Modal for user authentication with email/password, OAuth, and magic link options.
 *
 * @module LoginModal
 */
import React, { useState, useCallback } from "react";
import { Modal } from "./Modal";
import { validateLoginForm, validateEmail } from "../../utils/formValidation";
import "./AuthForms.css";

/**
 * Props for the LoginModal component.
 */
export interface LoginModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback to switch to signup modal */
  onSwitchToSignup: () => void;
  /** Callback when login is successful */
  onLoginSuccess?: () => void;
  /** Callback for OAuth login */
  onOAuthLogin?: (provider: "discord" | "twitch") => void;
  /** Callback for magic link request */
  onMagicLinkRequest?: (email: string) => Promise<void>;
  /** Callback for password login */
  onPasswordLogin?: (email: string, password: string) => Promise<void>;
  /** Callback to open forgot password flow */
  onForgotPassword?: (email: string) => void;
}

/**
 * LoginModal provides all authentication options in a single modal.
 *
 * Features:
 * - Email/password login form
 * - OAuth buttons (Discord, Twitch)
 * - Magic link option
 * - Forgot password link
 * - Switch to signup modal
 *
 * @example
 * ```tsx
 * <LoginModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onSwitchToSignup={handleSwitchToSignup}
 * />
 * ```
 */
export function LoginModal({
  isOpen,
  onClose,
  onSwitchToSignup,
  onLoginSuccess,
  onOAuthLogin,
  onMagicLinkRequest,
  onPasswordLogin,
  onForgotPassword,
}: LoginModalProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showMagicLinkForm, setShowMagicLinkForm] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Reset form when modal closes
  const handleClose = useCallback(() => {
    setEmail("");
    setPassword("");
    setErrors({});
    setIsLoading(false);
    setShowMagicLinkForm(false);
    setMagicLinkSent(false);
    onClose();
  }, [onClose]);

  // Handle email/password login
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate form
      const formErrors = validateLoginForm(email, password);
      const errorRecord: Record<string, string> = {};
      if (formErrors.email) errorRecord.email = formErrors.email;
      if (formErrors.password) errorRecord.password = formErrors.password;
      if (formErrors.general) errorRecord.general = formErrors.general;

      if (Object.keys(errorRecord).length > 0) {
        setErrors(errorRecord);
        return;
      }

      setErrors({});
      setIsLoading(true);

      try {
        if (onPasswordLogin) {
          await onPasswordLogin(email, password);
        }
        onLoginSuccess?.();
        handleClose();
      } catch (error) {
        setErrors({
          general:
            error instanceof Error
              ? error.message
              : "Login failed. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, onPasswordLogin, onLoginSuccess, handleClose]
  );

  // Handle magic link request
  const handleMagicLinkSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const emailResult = validateEmail(email);
      if (!emailResult.isValid) {
        setErrors({ email: emailResult.error || "Invalid email" });
        return;
      }

      setErrors({});
      setIsLoading(true);

      try {
        if (onMagicLinkRequest) {
          await onMagicLinkRequest(email);
        }
        setMagicLinkSent(true);
      } catch (error) {
        setErrors({
          general:
            error instanceof Error
              ? error.message
              : "Failed to send magic link. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [email, onMagicLinkRequest]
  );

  // Handle OAuth login
  const handleOAuthClick = useCallback(
    (provider: "discord" | "twitch") => {
      onOAuthLogin?.(provider);
    },
    [onOAuthLogin]
  );

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    onForgotPassword?.(email);
  }, [email, onForgotPassword]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Log In" size="small">
      {/* Error message */}
      {errors.general && (
        <div
          className="auth-error"
          role="alert"
          data-testid="login-error"
        >
          {errors.general}
        </div>
      )}

      {showMagicLinkForm ? (
        // Magic Link Form
        <div className="auth-form-section">
          {magicLinkSent ? (
            <div className="auth-success" data-testid="magic-link-sent">
              <svg
                className="auth-success-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <p>Check your email for a magic link to sign in.</p>
              <button
                type="button"
                className="auth-link-button"
                onClick={() => {
                  setShowMagicLinkForm(false);
                  setMagicLinkSent(false);
                }}
              >
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLinkSubmit} className="auth-form">
              <p className="auth-description">
                Enter your email and we will send you a link to sign in.
              </p>

              <div className="form-group">
                <label htmlFor="magic-link-email" className="form-label">
                  Email
                </label>
                <input
                  id="magic-link-email"
                  type="email"
                  className={`form-input ${errors.email ? "form-input-error" : ""}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  autoComplete="email"
                  data-testid="magic-link-email-input"
                />
                {errors.email && (
                  <span className="form-error" role="alert">
                    {errors.email}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="auth-button auth-button-primary"
                disabled={isLoading}
                data-testid="magic-link-submit"
              >
                {isLoading ? "Sending..." : "Send Magic Link"}
              </button>

              <button
                type="button"
                className="auth-link-button"
                onClick={() => setShowMagicLinkForm(false)}
              >
                Back to login
              </button>
            </form>
          )}
        </div>
      ) : (
        // Main Login Form
        <>
          {/* OAuth Buttons */}
          <div className="auth-oauth-section">
            <button
              type="button"
              className="auth-button auth-button-oauth auth-button-discord"
              onClick={() => handleOAuthClick("discord")}
              disabled={isLoading}
              data-testid="discord-login-button"
            >
              <svg className="auth-oauth-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 00-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 00-5.487 0 12.36 12.36 0 00-.617-1.23A.077.077 0 008.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 00-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 00.031.055 20.03 20.03 0 005.993 2.98.078.078 0 00.084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 01-1.872-.878.075.075 0 01-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 01.078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 01.079.009c.12.098.245.195.372.288a.075.075 0 01-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 00-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 00.084.028 19.963 19.963 0 006.002-2.981.076.076 0 00.032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 00-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
              </svg>
              Continue with Discord
            </button>

            <button
              type="button"
              className="auth-button auth-button-oauth auth-button-twitch"
              onClick={() => handleOAuthClick("twitch")}
              disabled={isLoading}
              data-testid="twitch-login-button"
            >
              <svg className="auth-oauth-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
              </svg>
              Continue with Twitch
            </button>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                className={`form-input ${errors.email ? "form-input-error" : ""}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                autoComplete="email"
                data-testid="login-email-input"
              />
              {errors.email && (
                <span className="form-error" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="login-password" className="form-label">
                  Password
                </label>
                <button
                  type="button"
                  className="form-forgot-link"
                  onClick={handleForgotPassword}
                  data-testid="forgot-password-link"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                className={`form-input ${errors.password ? "form-input-error" : ""}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
                data-testid="login-password-input"
              />
              {errors.password && (
                <span className="form-error" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="auth-button auth-button-primary"
              disabled={isLoading}
              data-testid="login-submit-button"
            >
              {isLoading ? "Logging in..." : "Log In"}
            </button>
          </form>

          {/* Magic Link Option */}
          <button
            type="button"
            className="auth-link-button"
            onClick={() => setShowMagicLinkForm(true)}
            data-testid="magic-link-option"
          >
            Sign in with email link instead
          </button>

          {/* Switch to Signup */}
          <div className="auth-switch">
            <span>Do not have an account?</span>
            <button
              type="button"
              className="auth-switch-button"
              onClick={onSwitchToSignup}
              data-testid="switch-to-signup"
            >
              Sign up
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

export default LoginModal;
