/**
 * Tests for Authentication Modal Components
 *
 * These tests verify the login and signup modals render correctly,
 * handle form validation, and manage modal state properly.
 *
 * @module AuthModals.test
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { Modal } from "./Modal";
import { LoginModal } from "./LoginModal";
import { SignupModal } from "./SignupModal";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

// Cleanup after each test
afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("Modal Component", () => {
  it("should render when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.click(screen.getByTestId("modal-close-button"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should call onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    fireEvent.click(screen.getByTestId("modal-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should have proper accessibility attributes", () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Accessible Modal">
        <p>Content</p>
      </Modal>
    );

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute("aria-labelledby", "modal-title");
  });
});

describe("LoginModal Component", () => {
  it("should render with all auth options", () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={vi.fn()}
        onSwitchToSignup={vi.fn()}
      />
    );

    // Should have email and password inputs
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();

    // Should have OAuth buttons
    expect(screen.getByTestId("discord-login-button")).toBeInTheDocument();
    expect(screen.getByTestId("twitch-login-button")).toBeInTheDocument();

    // Should have magic link option
    expect(screen.getByTestId("magic-link-option")).toBeInTheDocument();

    // Should have forgot password link
    expect(screen.getByTestId("forgot-password-link")).toBeInTheDocument();
  });

  it("should show validation errors for empty fields", async () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={vi.fn()}
        onSwitchToSignup={vi.fn()}
      />
    );

    // Submit empty form
    fireEvent.click(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      // Use getAllByRole since there are multiple alert elements (email and password errors)
      const alerts = screen.getAllByRole("alert");
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it("should switch to signup modal", () => {
    const onSwitchToSignup = vi.fn();
    render(
      <LoginModal
        isOpen={true}
        onClose={vi.fn()}
        onSwitchToSignup={onSwitchToSignup}
      />
    );

    fireEvent.click(screen.getByTestId("switch-to-signup"));
    expect(onSwitchToSignup).toHaveBeenCalled();
  });

  it("should show magic link form when option is clicked", () => {
    render(
      <LoginModal
        isOpen={true}
        onClose={vi.fn()}
        onSwitchToSignup={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("magic-link-option"));
    expect(screen.getByTestId("magic-link-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("magic-link-submit")).toBeInTheDocument();
  });

  it("should call onForgotPassword when forgot password link is clicked", () => {
    const onForgotPassword = vi.fn();
    render(
      <LoginModal
        isOpen={true}
        onClose={vi.fn()}
        onSwitchToSignup={vi.fn()}
        onForgotPassword={onForgotPassword}
      />
    );

    // Enter email first
    const emailInput = screen.getByTestId("login-email-input");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    // Click forgot password link
    fireEvent.click(screen.getByTestId("forgot-password-link"));
    expect(onForgotPassword).toHaveBeenCalledWith("test@example.com");
  });

  it("should call onForgotPassword with empty string when no email entered", () => {
    const onForgotPassword = vi.fn();
    render(
      <LoginModal
        isOpen={true}
        onClose={vi.fn()}
        onSwitchToSignup={vi.fn()}
        onForgotPassword={onForgotPassword}
      />
    );

    // Click forgot password without entering email
    fireEvent.click(screen.getByTestId("forgot-password-link"));
    expect(onForgotPassword).toHaveBeenCalledWith("");
  });
});

describe("SignupModal Component", () => {
  it("should render with all form fields", () => {
    render(
      <SignupModal
        isOpen={true}
        onClose={vi.fn()}
        onSwitchToLogin={vi.fn()}
      />
    );

    // Should have all form inputs
    expect(screen.getByTestId("signup-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("signup-displayname-input")).toBeInTheDocument();
    expect(screen.getByTestId("signup-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("signup-confirm-password-input")).toBeInTheDocument();

    // Should have OAuth buttons
    expect(screen.getByTestId("discord-signup-button")).toBeInTheDocument();
    expect(screen.getByTestId("twitch-signup-button")).toBeInTheDocument();

    // Should have password strength indicator
    expect(screen.getByTestId("password-strength-indicator")).toBeInTheDocument();
  });

  it("should display inline validation errors on blur", async () => {
    render(
      <SignupModal
        isOpen={true}
        onClose={vi.fn()}
        onSwitchToLogin={vi.fn()}
      />
    );

    // Enter invalid email and blur
    const emailInput = screen.getByTestId("signup-email-input");
    fireEvent.change(emailInput, { target: { value: "invalid" } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
    });
  });

  it("should switch to login modal", () => {
    const onSwitchToLogin = vi.fn();
    render(
      <SignupModal
        isOpen={true}
        onClose={vi.fn()}
        onSwitchToLogin={onSwitchToLogin}
      />
    );

    fireEvent.click(screen.getByTestId("switch-to-login"));
    expect(onSwitchToLogin).toHaveBeenCalled();
  });
});

describe("PasswordStrengthIndicator Component", () => {
  it("should show weak strength for simple passwords", () => {
    render(<PasswordStrengthIndicator password="abc123" />);

    expect(screen.getByTestId("strength-label")).toHaveTextContent("Weak");
    expect(screen.getByTestId("strength-bar")).toHaveClass("strength-weak");
  });

  it("should show medium strength for moderately complex passwords", () => {
    render(<PasswordStrengthIndicator password="Password1" />);

    expect(screen.getByTestId("strength-label")).toHaveTextContent("Medium");
    expect(screen.getByTestId("strength-bar")).toHaveClass("strength-medium");
  });

  it("should show strong strength for complex passwords", () => {
    render(<PasswordStrengthIndicator password="Password123!@#Long" />);

    expect(screen.getByTestId("strength-label")).toHaveTextContent("Strong");
    expect(screen.getByTestId("strength-bar")).toHaveClass("strength-strong");
  });

  it("should update requirements checklist as password changes", () => {
    const { rerender } = render(<PasswordStrengthIndicator password="" />);

    // All requirements should be unmet initially
    expect(screen.getByTestId("requirement-length")).toHaveClass("requirement-unmet");
    expect(screen.getByTestId("requirement-letter")).toHaveClass("requirement-unmet");
    expect(screen.getByTestId("requirement-number")).toHaveClass("requirement-unmet");

    // Add letters - should mark letter requirement as met
    rerender(<PasswordStrengthIndicator password="abcd" />);
    expect(screen.getByTestId("requirement-letter")).toHaveClass("requirement-met");
    expect(screen.getByTestId("requirement-number")).toHaveClass("requirement-unmet");

    // Add numbers and meet length - should mark all as met
    rerender(<PasswordStrengthIndicator password="abcd1234" />);
    expect(screen.getByTestId("requirement-length")).toHaveClass("requirement-met");
    expect(screen.getByTestId("requirement-letter")).toHaveClass("requirement-met");
    expect(screen.getByTestId("requirement-number")).toHaveClass("requirement-met");
  });

  it("should have accessible labels", () => {
    render(<PasswordStrengthIndicator password="test123" />);

    expect(screen.getByLabelText("Password requirements")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label");
  });
});

describe("ForgotPasswordModal Component", () => {
  it("should render with email input form", () => {
    render(
      <ForgotPasswordModal
        isOpen={true}
        onClose={vi.fn()}
        onBackToLogin={vi.fn()}
        onRequestReset={vi.fn()}
      />
    );

    expect(screen.getByTestId("forgot-password-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("forgot-password-submit")).toBeInTheDocument();
    expect(screen.getByTestId("forgot-password-back-link")).toBeInTheDocument();
  });

  it("should pre-fill email from initialEmail prop", () => {
    render(
      <ForgotPasswordModal
        isOpen={true}
        onClose={vi.fn()}
        onBackToLogin={vi.fn()}
        onRequestReset={vi.fn()}
        initialEmail="test@example.com"
      />
    );

    const emailInput = screen.getByTestId("forgot-password-email-input") as HTMLInputElement;
    expect(emailInput.value).toBe("test@example.com");
  });

  it("should call onBackToLogin when back link is clicked", () => {
    const onBackToLogin = vi.fn();
    render(
      <ForgotPasswordModal
        isOpen={true}
        onClose={vi.fn()}
        onBackToLogin={onBackToLogin}
        onRequestReset={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("forgot-password-back-link"));
    expect(onBackToLogin).toHaveBeenCalled();
  });

  it("should show validation error for empty email", async () => {
    render(
      <ForgotPasswordModal
        isOpen={true}
        onClose={vi.fn()}
        onBackToLogin={vi.fn()}
        onRequestReset={vi.fn()}
      />
    );

    // Submit form with empty email
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-password-error")).toBeInTheDocument();
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });
  });

  it("should call onRequestReset with email on valid submit", async () => {
    const onRequestReset = vi.fn().mockResolvedValue({ success: true, message: "Email sent" });
    render(
      <ForgotPasswordModal
        isOpen={true}
        onClose={vi.fn()}
        onBackToLogin={vi.fn()}
        onRequestReset={onRequestReset}
      />
    );

    // Enter valid email
    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    // Submit form
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      expect(onRequestReset).toHaveBeenCalledWith("test@example.com");
    });
  });

  it("should show success message after request is sent", async () => {
    const onRequestReset = vi.fn().mockResolvedValue({ success: true, message: "Email sent" });
    render(
      <ForgotPasswordModal
        isOpen={true}
        onClose={vi.fn()}
        onBackToLogin={vi.fn()}
        onRequestReset={onRequestReset}
      />
    );

    // Enter valid email and submit
    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-password-success")).toBeInTheDocument();
    });
  });

  it("should show success message even on backend error (prevent email enumeration)", async () => {
    const onRequestReset = vi.fn().mockRejectedValue(new Error("User not found"));
    render(
      <ForgotPasswordModal
        isOpen={true}
        onClose={vi.fn()}
        onBackToLogin={vi.fn()}
        onRequestReset={onRequestReset}
      />
    );

    // Enter valid email and submit
    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "nonexistent@example.com" } });
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      // Should still show success to prevent enumeration
      expect(screen.getByTestId("forgot-password-success")).toBeInTheDocument();
    });
  });

  it("should have back to login button in success state", async () => {
    const onBackToLogin = vi.fn();
    const onRequestReset = vi.fn().mockResolvedValue({ success: true, message: "Email sent" });
    render(
      <ForgotPasswordModal
        isOpen={true}
        onClose={vi.fn()}
        onBackToLogin={onBackToLogin}
        onRequestReset={onRequestReset}
      />
    );

    // Submit valid email
    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByTestId("forgot-password-success")).toBeInTheDocument();
    });

    // Click back to login button in success state
    fireEvent.click(screen.getByTestId("back-to-login-button"));
    expect(onBackToLogin).toHaveBeenCalled();
  });
});
