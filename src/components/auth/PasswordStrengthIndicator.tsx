/**
 * PasswordStrengthIndicator Component
 *
 * Displays a visual indicator of password strength with requirements checklist.
 * Updates in real-time as the user types.
 *
 * @module PasswordStrengthIndicator
 */
import React, { useMemo } from "react";
import "./PasswordStrengthIndicator.css";

/**
 * Password strength levels.
 */
export type PasswordStrength = "weak" | "medium" | "strong";

/**
 * Props for the PasswordStrengthIndicator component.
 */
export interface PasswordStrengthIndicatorProps {
  /** The password to evaluate */
  password: string;
  /** Whether to show the requirements checklist (default: true) */
  showRequirements?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Password requirement status.
 */
interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

/**
 * Calculates password strength based on complexity factors.
 */
function calculateStrength(password: string): PasswordStrength {
  if (!password) return "weak";

  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Complexity scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score >= 6) return "strong";
  if (score >= 4) return "medium";
  return "weak";
}

/**
 * Checks password requirements and returns status for each.
 */
function checkRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      id: "letter",
      label: "At least 1 letter",
      met: /[a-zA-Z]/.test(password),
    },
    {
      id: "number",
      label: "At least 1 number",
      met: /[0-9]/.test(password),
    },
  ];
}

/**
 * PasswordStrengthIndicator displays a visual meter and requirements checklist.
 *
 * @example
 * ```tsx
 * <PasswordStrengthIndicator password={password} />
 * ```
 */
export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
  className = "",
}: PasswordStrengthIndicatorProps): JSX.Element {
  const strength = useMemo(() => calculateStrength(password), [password]);
  const requirements = useMemo(() => checkRequirements(password), [password]);
  const allRequirementsMet = requirements.every((req) => req.met);

  const strengthLabel = {
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
  };

  return (
    <div
      className={`password-strength ${className}`.trim()}
      data-testid="password-strength-indicator"
    >
      {/* Strength meter bar */}
      <div className="strength-meter">
        <div
          className={`strength-bar strength-${strength}`}
          role="progressbar"
          aria-valuenow={strength === "weak" ? 33 : strength === "medium" ? 66 : 100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${strengthLabel[strength]}`}
          data-testid="strength-bar"
        />
      </div>

      {/* Strength label */}
      <span
        className={`strength-label strength-label-${strength}`}
        data-testid="strength-label"
      >
        {password ? strengthLabel[strength] : ""}
      </span>

      {/* Requirements checklist */}
      {showRequirements && (
        <ul
          className="strength-requirements"
          aria-label="Password requirements"
          data-testid="strength-requirements"
        >
          {requirements.map((req) => (
            <li
              key={req.id}
              className={`requirement ${req.met ? "requirement-met" : "requirement-unmet"}`}
              data-testid={`requirement-${req.id}`}
            >
              <span className="requirement-icon" aria-hidden="true">
                {req.met ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="icon-check"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="icon-circle"
                  >
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                )}
              </span>
              <span className="requirement-label">{req.label}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Screen reader announcement */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        data-testid="strength-announcement"
      >
        {password &&
          `Password strength: ${strengthLabel[strength]}. ${
            allRequirementsMet
              ? "All requirements met."
              : "Some requirements not met."
          }`}
      </div>
    </div>
  );
}

export default PasswordStrengthIndicator;
