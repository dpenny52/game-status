/**
 * VerifyMagicLink Page Unit Tests
 *
 * Tests the magic link verification flow including:
 * - No token shows error state
 * - Valid token logs user in
 * - Invalid token shows error
 * - Expired token shows error
 * - Loading states display correctly
 *
 * @module VerifyMagicLink.test
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { VerifyMagicLink } from "./VerifyMagicLink";

// Mock useAuth
const mockSetUser = vi.fn();
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    setUser: mockSetUser,
  }),
}));

// Mock Convex
const mockVerifyMagicLink = vi.fn();
vi.mock("convex/react", () => ({
  useMutation: () => mockVerifyMagicLink,
}));

// Mock window.location
const originalLocation = window.location;

function mockWindowLocation(search: string) {
  Object.defineProperty(window, "location", {
    writable: true,
    value: {
      ...originalLocation,
      search,
      href: "",
    },
  });
}

describe("VerifyMagicLink Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowLocation("");
  });

  afterEach(() => {
    cleanup();
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("should show error when no token is provided", async () => {
    mockWindowLocation("");

    render(<VerifyMagicLink />);

    await waitFor(() => {
      expect(screen.getByTestId("verify-magic-link-error")).toBeInTheDocument();
    });

    expect(screen.getByText(/No magic link token provided/)).toBeInTheDocument();
    expect(screen.getByText("Return to Home")).toBeInTheDocument();
  });

  it("should show verifying state while checking token", async () => {
    mockWindowLocation("?token=valid-token-123");

    // Make mutation hang to see verifying state
    mockVerifyMagicLink.mockImplementation(
      () => new Promise(() => {})
    );

    render(<VerifyMagicLink />);

    await waitFor(() => {
      expect(screen.getByTestId("verify-magic-link-verifying")).toBeInTheDocument();
    });

    expect(screen.getByText(/Verifying your magic link/)).toBeInTheDocument();
  });

  it("should show success and set user when token is valid", async () => {
    mockWindowLocation("?token=valid-token-123");

    const mockUser = {
      _id: "user123",
      email: "test@example.com",
      displayName: "Test User",
      isEmailVerified: true,
    };

    mockVerifyMagicLink.mockResolvedValue({ user: mockUser });

    render(<VerifyMagicLink />);

    await waitFor(() => {
      expect(screen.getByTestId("verify-magic-link-success")).toBeInTheDocument();
    });

    expect(screen.getByText("Login Successful")).toBeInTheDocument();
    expect(screen.getByText(/You have been logged in successfully/)).toBeInTheDocument();

    expect(mockSetUser).toHaveBeenCalledWith({
      _id: "user123",
      email: "test@example.com",
      displayName: "Test User",
      isEmailVerified: true,
      providerType: undefined,
      providerId: undefined,
    });
  });

  it("should show error when token is invalid", async () => {
    mockWindowLocation("?token=invalid-token");

    mockVerifyMagicLink.mockRejectedValue(new Error("Invalid or expired magic link"));

    render(<VerifyMagicLink />);

    await waitFor(() => {
      expect(screen.getByTestId("verify-magic-link-error")).toBeInTheDocument();
    });

    expect(screen.getByText("Magic Link Invalid")).toBeInTheDocument();
    expect(screen.getByText("Invalid or expired magic link")).toBeInTheDocument();
  });

  it("should show error when token is expired", async () => {
    mockWindowLocation("?token=expired-token");

    mockVerifyMagicLink.mockRejectedValue(new Error("Magic link has expired. Please request a new one."));

    render(<VerifyMagicLink />);

    await waitFor(() => {
      expect(screen.getByTestId("verify-magic-link-error")).toBeInTheDocument();
    });

    expect(screen.getByText(/Magic link has expired/)).toBeInTheDocument();
  });

  it("should show error when token is already used", async () => {
    mockWindowLocation("?token=used-token");

    mockVerifyMagicLink.mockRejectedValue(new Error("This magic link has already been used"));

    render(<VerifyMagicLink />);

    await waitFor(() => {
      expect(screen.getByTestId("verify-magic-link-error")).toBeInTheDocument();
    });

    expect(screen.getByText(/already been used/)).toBeInTheDocument();
  });

  it("should call verifyMagicLink mutation with token", async () => {
    mockWindowLocation("?token=test-token-456");

    mockVerifyMagicLink.mockResolvedValue({
      user: {
        _id: "user123",
        email: "test@example.com",
        displayName: "Test",
        isEmailVerified: true,
      },
    });

    render(<VerifyMagicLink />);

    await waitFor(() => {
      expect(mockVerifyMagicLink).toHaveBeenCalledWith({ token: "test-token-456" });
    });
  });

  it("should have return to home link in error state", async () => {
    mockWindowLocation("?token=bad-token");

    mockVerifyMagicLink.mockRejectedValue(new Error("Invalid token"));

    render(<VerifyMagicLink />);

    await waitFor(() => {
      expect(screen.getByTestId("verify-magic-link-error")).toBeInTheDocument();
    });

    const returnLink = screen.getByText("Return to Home");
    expect(returnLink).toBeInTheDocument();
    expect(returnLink.closest("a")).toHaveAttribute("href", "/");
  });
});
