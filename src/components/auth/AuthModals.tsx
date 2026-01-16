/**
 * AuthModals Component
 *
 * Renders authentication modals (Login, Signup, ForgotPassword) based on
 * the current modal state from AuthContext. This component should be
 * rendered once at the app root level.
 *
 * @module AuthModals
 */
import React, { useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { LoginModal } from "./LoginModal";
import { SignupModal } from "./SignupModal";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

/**
 * AuthModals renders the appropriate authentication modal based on
 * the modalState from AuthContext.
 *
 * Handles transitions between:
 * - Login modal
 * - Signup modal
 * - Forgot password modal
 *
 * @example
 * ```tsx
 * // In App.tsx, render once at root level
 * <AuthProvider>
 *   <ToastProvider>
 *     <div className="app">
 *       <AuthModals />
 *       <Routes>...</Routes>
 *     </div>
 *   </ToastProvider>
 * </AuthProvider>
 * ```
 */
export function AuthModals(): JSX.Element | null {
  const {
    modalState,
    closeAuthModals,
    openLoginModal,
    openSignupModal,
    openForgotPasswordModal,
    login,
    signup,
    requestMagicLink,
    requestPasswordReset,
    forgotPasswordEmail,
    setForgotPasswordEmail,
  } = useAuth();

  // Handle forgot password from login modal
  const handleForgotPassword = useCallback(
    (email: string) => {
      setForgotPasswordEmail(email);
      openForgotPasswordModal();
    },
    [setForgotPasswordEmail, openForgotPasswordModal]
  );

  // Handle back to login from forgot password
  const handleBackToLogin = useCallback(() => {
    openLoginModal();
  }, [openLoginModal]);

  // If no modal is open, don't render anything
  if (!modalState) {
    return null;
  }

  return (
    <>
      {/* Login Modal */}
      <LoginModal
        isOpen={modalState === "login"}
        onClose={closeAuthModals}
        onSwitchToSignup={openSignupModal}
        onPasswordLogin={login}
        onMagicLinkRequest={requestMagicLink}
        onForgotPassword={handleForgotPassword}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={modalState === "signup"}
        onClose={closeAuthModals}
        onSwitchToLogin={openLoginModal}
        onSignup={signup}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={modalState === "forgotPassword"}
        onClose={closeAuthModals}
        onBackToLogin={handleBackToLogin}
        onRequestReset={requestPasswordReset}
        initialEmail={forgotPasswordEmail}
      />
    </>
  );
}

export default AuthModals;
