/**
 * SignupModal Component
 *
 * Modal for user registration with email/password and OAuth options.
 *
 * @module SignupModal
 */
import React, { useState, useCallback } from "react";
import { Modal } from "./Modal";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import {
  validateSignupForm,
  validateEmail,
  validatePassword,
  validateDisplayName,
  validatePasswordMatch,
} from "../../utils/formValidation";
import "./AuthForms.css";

/**
 * Props for the SignupModal component.
 */
export interface SignupModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback to switch to login modal */
  onSwitchToLogin: () => void;
  /** Callback when signup is successful */
  onSignupSuccess?: () => void;
  /** Callback for OAuth signup */
  onOAuthSignup?: (provider: "discord" | "twitch") => void;
  /** Callback for email/password signup */
  onPasswordSignup?: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
}

/**
 * SignupModal provides registration options in a single modal.
 *
 * Features:
 * - Email/password signup form
 * - Display name field
 * - Password strength indicator
 * - Confirm password field
 * - OAuth buttons (Discord, Twitch)
 * - Inline validation errors
 * - Switch to login modal
 *
 * @example
 * ```tsx
 * <SignupModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   onSwitchToLogin={handleSwitchToLogin}
 * />
 * ```
 */
export function SignupModal({
  isOpen,
  onClose,
  onSwitchToLogin,
  onSignupSuccess,
  onOAuthSignup,
  onPasswordSignup,
}: SignupModalProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal closes
  const handleClose = useCallback(() => {
    setEmail("");
    setDisplayName("");
    setPassword("");
    setConfirmPassword("");
    setErrors({});
    setTouched({});
    setIsLoading(false);
    onClose();
  }, [onClose]);

  // Validate field on blur
  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      let error: string | undefined;

      switch (field) {
        case "email": {
          const result = validateEmail(email);
          error = result.error;
          break;
        }
        case "displayName": {
          const result = validateDisplayName(displayName);
          error = result.error;
          break;
        }
        case "password": {
          const result = validatePassword(password);
          error = result.errors[0];
          break;
        }
        case "confirmPassword": {
          const result = validatePasswordMatch(password, confirmPassword);
          error = result.error;
          break;
        }
      }

      setErrors((prev) => ({
        ...prev,
        [field]: error || "",
      }));
    },
    [email, displayName, password, confirmPassword]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate all fields
      const formErrors = validateSignupForm(
        email,
        password,
        confirmPassword,
        displayName
      );

      // Convert AuthFormErrors to Record<string, string>
      const errorRecord: Record<string, string> = {};
      if (formErrors.email) errorRecord.email = formErrors.email;
      if (formErrors.password) errorRecord.password = formErrors.password;
      if (formErrors.confirmPassword)
        errorRecord.confirmPassword = formErrors.confirmPassword;
      if (formErrors.displayName)
        errorRecord.displayName = formErrors.displayName;
      if (formErrors.general) errorRecord.general = formErrors.general;

      if (Object.keys(errorRecord).length > 0) {
        setErrors(errorRecord);
        setTouched({
          email: true,
          displayName: true,
          password: true,
          confirmPassword: true,
        });
        return;
      }

      setErrors({});
      setIsLoading(true);

      try {
        if (onPasswordSignup) {
          await onPasswordSignup(email, password, displayName);
        }
        onSignupSuccess?.();
        handleClose();
      } catch (error) {
        setErrors({
          general:
            error instanceof Error
              ? error.message
              : "Signup failed. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      email,
      password,
      confirmPassword,
      displayName,
      onPasswordSignup,
      onSignupSuccess,
      handleClose,
    ]
  );

  // Handle OAuth signup
  const handleOAuthClick = useCallback(
    (provider: "discord" | "twitch") => {
      onOAuthSignup?.(provider);
    },
    [onOAuthSignup]
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Account" size="small">
      {/* Error message */}
      {errors.general && (
        <div className="auth-error" role="alert" data-testid="signup-error">
          {errors.general}
        </div>
      )}

      {/* OAuth Buttons */}
      <div className="auth-oauth-section">
        <button
          type="button"
          className="auth-button auth-button-oauth auth-button-discord"
          onClick={() => handleOAuthClick("discord")}
          disabled={isLoading}
          data-testid="discord-signup-button"
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
          data-testid="twitch-signup-button"
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

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Email Field */}
        <div className="form-group">
          <label htmlFor="signup-email" className="form-label">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            className={`form-input ${touched.email && errors.email ? "form-input-error" : ""}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="you@example.com"
            disabled={isLoading}
            autoComplete="email"
            data-testid="signup-email-input"
          />
          {touched.email && errors.email && (
            <span className="form-error" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        {/* Display Name Field */}
        <div className="form-group">
          <label htmlFor="signup-displayName" className="form-label">
            Display Name
          </label>
          <input
            id="signup-displayName"
            type="text"
            className={`form-input ${touched.displayName && errors.displayName ? "form-input-error" : ""}`}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={() => handleBlur("displayName")}
            placeholder="Your display name"
            disabled={isLoading}
            autoComplete="name"
            data-testid="signup-displayname-input"
          />
          {touched.displayName && errors.displayName && (
            <span className="form-error" role="alert">
              {errors.displayName}
            </span>
          )}
        </div>

        {/* Password Field */}
        <div className="form-group">
          <label htmlFor="signup-password" className="form-label">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            className={`form-input ${touched.password && errors.password ? "form-input-error" : ""}`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur("password")}
            placeholder="Create a password"
            disabled={isLoading}
            autoComplete="new-password"
            data-testid="signup-password-input"
          />
          {touched.password && errors.password && (
            <span className="form-error" role="alert">
              {errors.password}
            </span>
          )}
          <PasswordStrengthIndicator password={password} />
        </div>

        {/* Confirm Password Field */}
        <div className="form-group">
          <label htmlFor="signup-confirmPassword" className="form-label">
            Confirm Password
          </label>
          <input
            id="signup-confirmPassword"
            type="password"
            className={`form-input ${touched.confirmPassword && errors.confirmPassword ? "form-input-error" : ""}`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => handleBlur("confirmPassword")}
            placeholder="Confirm your password"
            disabled={isLoading}
            autoComplete="new-password"
            data-testid="signup-confirm-password-input"
          />
          {touched.confirmPassword && errors.confirmPassword && (
            <span className="form-error" role="alert">
              {errors.confirmPassword}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-button auth-button-primary"
          disabled={isLoading}
          data-testid="signup-submit-button"
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="auth-switch">
        <span>Already have an account?</span>
        <button
          type="button"
          className="auth-switch-button"
          onClick={onSwitchToLogin}
          data-testid="switch-to-login"
        >
          Log in
        </button>
      </div>
    </Modal>
  );
}

export default SignupModal;
