/**
 * Tests for ForgotPasswordModal Component
 *
 * Tests verify the forgot password modal renders correctly,
 * handles form validation, and shows success message regardless of email existence.
 *
 * @module ForgotPasswordModal.test
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, act } from "@testing-library/react";
import { ForgotPasswordModal } from "./ForgotPasswordModal";

// Cleanup after each test
afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("ForgotPasswordModal Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onBackToLogin: vi.fn(),
    onRequestReset: vi.fn().mockResolvedValue({ success: true, message: "Link sent" }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render when isOpen is true", () => {
    render(<ForgotPasswordModal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Reset Password")).toBeInTheDocument();
    expect(screen.getByTestId("forgot-password-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("forgot-password-submit")).toBeInTheDocument();
  });

  it("should not render when isOpen is false", () => {
    render(<ForgotPasswordModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should pre-fill email when initialEmail is provided", () => {
    render(
      <ForgotPasswordModal
        {...defaultProps}
        initialEmail="user@example.com"
      />
    );

    const emailInput = screen.getByTestId("forgot-password-email-input");
    expect(emailInput).toHaveValue("user@example.com");
  });

  it("should show validation error for invalid email", async () => {
    render(<ForgotPasswordModal {...defaultProps} />);

    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    // Submit the form directly
    const form = emailInput.closest("form");
    await act(async () => {
      fireEvent.submit(form!);
    });

    await waitFor(() => {
      expect(screen.getByTestId("forgot-password-error")).toBeInTheDocument();
    });
  });

  it("should show validation error for empty email", async () => {
    render(<ForgotPasswordModal {...defaultProps} />);

    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-password-error")).toBeInTheDocument();
    });
  });

  it("should call onRequestReset with email when form is valid", async () => {
    const onRequestReset = vi.fn().mockResolvedValue({ success: true, message: "Sent" });
    render(
      <ForgotPasswordModal
        {...defaultProps}
        onRequestReset={onRequestReset}
      />
    );

    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      expect(onRequestReset).toHaveBeenCalledWith("user@example.com");
    });
  });

  it("should show success message after submission regardless of email existence", async () => {
    render(<ForgotPasswordModal {...defaultProps} />);

    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "nonexistent@example.com" } });
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-password-success")).toBeInTheDocument();
      expect(
        screen.getByText(/If an account exists with this email/i)
      ).toBeInTheDocument();
    });
  });

  it("should show success message even when backend throws non-email error", async () => {
    const onRequestReset = vi.fn().mockRejectedValue(new Error("Network error"));
    render(
      <ForgotPasswordModal
        {...defaultProps}
        onRequestReset={onRequestReset}
      />
    );

    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      // Should still show success to prevent enumeration
      expect(screen.getByTestId("forgot-password-success")).toBeInTheDocument();
    });
  });

  it("should show error for invalid email format from backend", async () => {
    const onRequestReset = vi.fn().mockRejectedValue(new Error("Invalid email format"));
    render(
      <ForgotPasswordModal
        {...defaultProps}
        onRequestReset={onRequestReset}
      />
    );

    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-password-error")).toBeInTheDocument();
      expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
    });
  });

  it("should disable form while loading", async () => {
    // Create a promise that won't resolve immediately
    let resolvePromise: (value: { success: boolean; message: string }) => void;
    const pendingPromise = new Promise<{ success: boolean; message: string }>((resolve) => {
      resolvePromise = resolve;
    });
    const onRequestReset = vi.fn().mockReturnValue(pendingPromise);

    render(
      <ForgotPasswordModal
        {...defaultProps}
        onRequestReset={onRequestReset}
      />
    );

    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-password-email-input")).toBeDisabled();
      expect(screen.getByTestId("forgot-password-submit")).toBeDisabled();
      expect(screen.getByTestId("forgot-password-submit")).toHaveTextContent("Sending...");
    });

    // Resolve the promise
    resolvePromise!({ success: true, message: "Sent" });
  });

  it("should call onBackToLogin when back link is clicked", () => {
    const onBackToLogin = vi.fn();
    render(
      <ForgotPasswordModal
        {...defaultProps}
        onBackToLogin={onBackToLogin}
      />
    );

    fireEvent.click(screen.getByTestId("forgot-password-back-link"));
    expect(onBackToLogin).toHaveBeenCalled();
  });

  it("should call onBackToLogin from success state", async () => {
    const onBackToLogin = vi.fn();
    render(
      <ForgotPasswordModal
        {...defaultProps}
        onBackToLogin={onBackToLogin}
      />
    );

    // Submit form to get to success state
    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-password-success")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("back-to-login-button"));
    expect(onBackToLogin).toHaveBeenCalled();
  });

  it("should reset form state when modal closes", async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <ForgotPasswordModal
        {...defaultProps}
        onClose={onClose}
      />
    );

    // Fill in email and submit
    const emailInput = screen.getByTestId("forgot-password-email-input");
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.click(screen.getByTestId("forgot-password-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("forgot-password-success")).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByTestId("modal-close-button"));
    expect(onClose).toHaveBeenCalled();

    // Reopen modal
    rerender(
      <ForgotPasswordModal
        {...defaultProps}
        onClose={onClose}
        isOpen={true}
      />
    );

    // Form should be reset (back to input state)
    expect(screen.queryByTestId("forgot-password-success")).not.toBeInTheDocument();
    expect(screen.getByTestId("forgot-password-email-input")).toHaveValue("");
  });

  it("should have proper accessibility attributes", () => {
    render(<ForgotPasswordModal {...defaultProps} />);

    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveAttribute("aria-labelledby", "modal-title");

    const emailInput = screen.getByTestId("forgot-password-email-input");
    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("autocomplete", "email");
  });
});
