/**
 * Tests for Authentication Pages
 *
 * These tests verify the Settings and ResetPassword pages render correctly
 * and handle their respective functionality.
 *
 * @module AuthPages.test
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext";
import { Settings } from "./Settings";
import { ResetPassword } from "./ResetPassword";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock window.location for ResetPassword tests
let mockSearch = "";

Object.defineProperty(window, "location", {
  value: {
    get search() {
      return mockSearch;
    },
    set search(value: string) {
      mockSearch = value;
    },
  },
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
  mockSearch = "";
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Helper to render with AuthProvider
function renderWithAuth(ui: React.ReactElement, authenticated = false) {
  // Set up mock auth state if authenticated
  if (authenticated) {
    localStorageMock.setItem(
      "gamestatus_auth",
      JSON.stringify({
        user: {
          _id: "user_123",
          email: "test@example.com",
          displayName: "Test User",
          isEmailVerified: true,
          _creationTime: Date.now(),
        },
      })
    );
  }

  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe("Settings Page", () => {
  it("should render at /settings route", async () => {
    renderWithAuth(<Settings />, true);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId("settings-loading")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("settings-page")).toBeInTheDocument();
    expect(screen.getByText("Account Settings")).toBeInTheDocument();
  });

  it("should display user email and display name", async () => {
    renderWithAuth(<Settings />, true);

    await waitFor(() => {
      expect(screen.getByTestId("settings-email")).toBeInTheDocument();
    });

    expect(screen.getByTestId("settings-email")).toHaveTextContent("test@example.com");
    expect(screen.getByTestId("settings-displayname")).toHaveTextContent("Test User");
  });

  it("should show login prompt when not authenticated", async () => {
    renderWithAuth(<Settings />, false);

    await waitFor(() => {
      expect(screen.queryByTestId("settings-loading")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("settings-unauthenticated")).toBeInTheDocument();
    expect(screen.getByText("Sign in Required")).toBeInTheDocument();
    expect(screen.getByTestId("settings-login-button")).toBeInTheDocument();
  });

  it("should allow editing display name", async () => {
    renderWithAuth(<Settings />, true);

    await waitFor(() => {
      expect(screen.getByTestId("settings-edit-button")).toBeInTheDocument();
    });

    // Click edit button
    fireEvent.click(screen.getByTestId("settings-edit-button"));

    // Should show input and save/cancel buttons
    expect(screen.getByTestId("settings-displayname-input")).toBeInTheDocument();
    expect(screen.getByTestId("settings-save-button")).toBeInTheDocument();
    expect(screen.getByTestId("settings-cancel-button")).toBeInTheDocument();
  });

  it("should show logout button with confirmation", async () => {
    renderWithAuth(<Settings />, true);

    await waitFor(() => {
      expect(screen.getByTestId("settings-logout-button")).toBeInTheDocument();
    });

    // Click logout button
    fireEvent.click(screen.getByTestId("settings-logout-button"));

    // Should show confirmation
    expect(screen.getByText("Are you sure you want to log out?")).toBeInTheDocument();
    expect(screen.getByTestId("settings-confirm-logout")).toBeInTheDocument();
    expect(screen.getByTestId("settings-cancel-logout")).toBeInTheDocument();
  });

  it("should show email verification badge", async () => {
    renderWithAuth(<Settings />, true);

    await waitFor(() => {
      expect(screen.getByTestId("verified-badge")).toBeInTheDocument();
    });

    expect(screen.getByTestId("verified-badge")).toHaveTextContent("Verified");
  });
});

describe("ResetPassword Page", () => {
  it("should render at /reset-password route", async () => {
    mockSearch = "?token=valid-token-123";

    render(<ResetPassword />);

    await waitFor(() => {
      expect(screen.queryByTestId("reset-password-validating")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("reset-password-page")).toBeInTheDocument();
    // Use getByRole to find the heading specifically
    expect(screen.getByRole("heading", { name: "Reset Password" })).toBeInTheDocument();
  });

  it("should show error when no token is provided", async () => {
    mockSearch = "";

    render(<ResetPassword />);

    await waitFor(() => {
      expect(screen.getByTestId("reset-password-error")).toBeInTheDocument();
    });

    expect(screen.getByText(/No reset token provided/)).toBeInTheDocument();
  });

  it("should have password and confirm password fields", async () => {
    mockSearch = "?token=valid-token-123";

    render(<ResetPassword />);

    await waitFor(() => {
      expect(screen.getByTestId("new-password-input")).toBeInTheDocument();
    });

    expect(screen.getByTestId("confirm-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("reset-password-submit")).toBeInTheDocument();
  });

  it("should validate password requirements", async () => {
    mockSearch = "?token=valid-token-123";

    render(<ResetPassword />);

    await waitFor(() => {
      expect(screen.getByTestId("new-password-input")).toBeInTheDocument();
    });

    // Enter weak password
    fireEvent.change(screen.getByTestId("new-password-input"), {
      target: { value: "weak" },
    });
    fireEvent.change(screen.getByTestId("confirm-password-input"), {
      target: { value: "weak" },
    });

    // Submit form
    fireEvent.click(screen.getByTestId("reset-password-submit"));

    // Should show validation error
    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  it("should show success message after reset", async () => {
    mockSearch = "?token=valid-token-123";

    render(<ResetPassword />);

    await waitFor(() => {
      expect(screen.getByTestId("new-password-input")).toBeInTheDocument();
    });

    // Enter valid password
    fireEvent.change(screen.getByTestId("new-password-input"), {
      target: { value: "ValidPassword123" },
    });
    fireEvent.change(screen.getByTestId("confirm-password-input"), {
      target: { value: "ValidPassword123" },
    });

    // Submit form
    fireEvent.click(screen.getByTestId("reset-password-submit"));

    // Should show success message
    await waitFor(
      () => {
        expect(screen.getByTestId("reset-password-success")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText("Password Reset Successful")).toBeInTheDocument();
    expect(screen.getByTestId("back-to-login")).toBeInTheDocument();
  });
});
