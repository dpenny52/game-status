/**
 * Form Validation Utilities
 *
 * Provides client-side validation helpers for authentication forms.
 * These mirror the server-side validation for immediate user feedback.
 *
 * @module formValidation
 */

/**
 * Email validation result.
 */
export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Password validation result.
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong";
}

/**
 * Display name validation result.
 */
export interface DisplayNameValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email format.
 *
 * @param email - The email address to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateEmail("user@example.com");
 * if (!result.isValid) {
 *   showError(result.error);
 * }
 * ```
 */
export function validateEmail(email: string): EmailValidationResult {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }

  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, error: "Email is required" };
  }

  // Standard email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
}

/**
 * Validates password against requirements.
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 letter (a-z or A-Z)
 * - At least 1 number (0-9)
 *
 * @param password - The password to validate
 * @returns Validation result with errors and strength indicator
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password) {
    return {
      isValid: false,
      errors: ["Password is required"],
      strength: "weak",
    };
  }

  // Check minimum length
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    errors.push("Password must contain at least 1 letter");
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least 1 number");
  }

  // Calculate strength
  const strength = calculatePasswordStrength(password);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Calculates password strength based on complexity.
 *
 * @param password - The password to evaluate
 * @returns Password strength level
 */
export function calculatePasswordStrength(
  password: string
): "weak" | "medium" | "strong" {
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
 * Validates display name requirements.
 *
 * @param displayName - The display name to validate
 * @returns Validation result with error message if invalid
 */
export function validateDisplayName(
  displayName: string
): DisplayNameValidationResult {
  if (!displayName || typeof displayName !== "string") {
    return { isValid: false, error: "Display name is required" };
  }

  const trimmed = displayName.trim();

  if (!trimmed) {
    return { isValid: false, error: "Display name is required" };
  }

  if (trimmed.length > 50) {
    return {
      isValid: false,
      error: "Display name must be 50 characters or less",
    };
  }

  return { isValid: true };
}

/**
 * Validates that two passwords match (for confirm password field).
 *
 * @param password - The original password
 * @param confirmPassword - The confirmation password
 * @returns Validation result
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } {
  if (!confirmPassword) {
    return { isValid: false, error: "Please confirm your password" };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: "Passwords do not match" };
  }

  return { isValid: true };
}

/**
 * Form validation state for auth forms.
 */
export interface AuthFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
  general?: string;
}

/**
 * Validates all signup form fields.
 *
 * @param email - User's email
 * @param password - User's password
 * @param confirmPassword - Password confirmation
 * @param displayName - User's display name
 * @returns Object with error messages for each field
 */
export function validateSignupForm(
  email: string,
  password: string,
  confirmPassword: string,
  displayName: string
): AuthFormErrors {
  const errors: AuthFormErrors = {};

  const emailResult = validateEmail(email);
  if (!emailResult.isValid) {
    errors.email = emailResult.error;
  }

  const passwordResult = validatePassword(password);
  if (!passwordResult.isValid) {
    errors.password = passwordResult.errors[0];
  }

  const matchResult = validatePasswordMatch(password, confirmPassword);
  if (!matchResult.isValid) {
    errors.confirmPassword = matchResult.error;
  }

  const displayNameResult = validateDisplayName(displayName);
  if (!displayNameResult.isValid) {
    errors.displayName = displayNameResult.error;
  }

  return errors;
}

/**
 * Validates all login form fields.
 *
 * @param email - User's email
 * @param password - User's password
 * @returns Object with error messages for each field
 */
export function validateLoginForm(
  email: string,
  password: string
): AuthFormErrors {
  const errors: AuthFormErrors = {};

  const emailResult = validateEmail(email);
  if (!emailResult.isValid) {
    errors.email = emailResult.error;
  }

  if (!password) {
    errors.password = "Password is required";
  }

  return errors;
}
