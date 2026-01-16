/**
 * Authentication Components
 *
 * Exports all authentication-related components.
 *
 * @module auth
 */
export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";

export { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
export type {
  PasswordStrengthIndicatorProps,
  PasswordStrength,
} from "./PasswordStrengthIndicator";

export { LoginModal } from "./LoginModal";
export type { LoginModalProps } from "./LoginModal";

export { SignupModal } from "./SignupModal";
export type { SignupModalProps } from "./SignupModal";

export { ForgotPasswordModal } from "./ForgotPasswordModal";
export type { ForgotPasswordModalProps } from "./ForgotPasswordModal";

export { AuthModals } from "./AuthModals";
