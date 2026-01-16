/**
 * Unit Tests for AuthContext
 *
 * Tests the authentication context including:
 * - Login mutation with email/password
 * - Signup mutation with Convex backend
 * - Error handling for invalid credentials
 * - Display name update functionality
 *
 * @module AuthContext.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";

// Mock Convex
const mockLoginMutation = vi.fn();
const mockSignUpMutation = vi.fn();
const mockUpdateDisplayNameMutation = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: vi.fn((api: string) => {
    if (api === "auth:login") return mockLoginMutation;
    if (api === "auth:signUp") return mockSignUpMutation;
    if (api === "auth:updateDisplayName") return mockUpdateDisplayNameMutation;
    return vi.fn();
  }),
}));

vi.mock("../../convex/_generated/api", () => ({
  api: {
    auth: {
      login: "auth:login",
      signUp: "auth:signUp",
      updateDisplayName: "auth:updateDisplayName",
    },
  },
}));

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Test component that uses auth context
function TestConsumer({
  onLogin,
  onSignup,
  onUpdateDisplayName,
}: {
  onLogin?: (email: string, password: string) => void;
  onSignup?: (email: string, password: string, displayName: string) => void;
  onUpdateDisplayName?: (displayName: string) => void;
}) {
  const { user, isAuthenticated, isLoading, login, signup, updateDisplayName, logout } = useAuth();

  return (
    <div>
      <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="user-email">{user?.email || "no-user"}</div>
      <div data-testid="user-display-name">{user?.displayName || "no-name"}</div>
      <button
        data-testid="login-btn"
        onClick={async () => {
          try {
            await login("test@example.com", "password123");
            onLogin?.("test@example.com", "password123");
          } catch {
            // Error handled in test
          }
        }}
      >
        Login
      </button>
      <button
        data-testid="signup-btn"
        onClick={async () => {
          try {
            await signup("new@example.com", "password123", "New User");
            onSignup?.("new@example.com", "password123", "New User");
          } catch {
            // Error handled in test
          }
        }}
      >
        Signup
      </button>
      <button
        data-testid="update-name-btn"
        onClick={async () => {
          try {
            await updateDisplayName("Updated Name");
            onUpdateDisplayName?.("Updated Name");
          } catch {
            // Error handled in test
          }
        }}
      >
        Update Name
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.store = {};
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  afterEach(() => {
    cleanup();
    localStorageMock.store = {};
  });

  describe("Login", () => {
    it("calls login mutation with email and password", async () => {
      const mockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
        isEmailVerified: false,
      };
      mockLoginMutation.mockResolvedValueOnce({ user: mockUser });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Click login
      await act(async () => {
        await userEvent.click(screen.getByTestId("login-btn"));
      });

      // Verify mutation was called with correct args
      expect(mockLoginMutation).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("sets user state from login response", async () => {
      const mockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
        isEmailVerified: true,
        providerType: undefined,
        providerId: undefined,
      };
      mockLoginMutation.mockResolvedValueOnce({ user: mockUser });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Perform login
      await act(async () => {
        await userEvent.click(screen.getByTestId("login-btn"));
      });

      // Verify user state is set correctly
      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
        expect(screen.getByTestId("user-email").textContent).toBe("test@example.com");
        expect(screen.getByTestId("user-display-name").textContent).toBe("Test User");
      });
    });

    it("handles invalid credentials error", async () => {
      const error = new Error("Invalid email or password");
      mockLoginMutation.mockRejectedValueOnce(error);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Attempt login - should throw error
      await act(async () => {
        await userEvent.click(screen.getByTestId("login-btn"));
      });

      // Verify user remains unauthenticated
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      expect(screen.getByTestId("user-email").textContent).toBe("no-user");
    });
  });

  describe("Signup", () => {
    it("calls signUp mutation with correct arguments", async () => {
      mockSignUpMutation.mockResolvedValueOnce({ userId: "user_456" });
      const mockUser = {
        _id: "user_456",
        email: "new@example.com",
        displayName: "New User",
        isEmailVerified: false,
      };
      mockLoginMutation.mockResolvedValueOnce({ user: mockUser });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Perform signup
      await act(async () => {
        await userEvent.click(screen.getByTestId("signup-btn"));
      });

      // Verify signUp mutation was called
      expect(mockSignUpMutation).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
        displayName: "New User",
      });
    });

    it("calls login after successful signup", async () => {
      mockSignUpMutation.mockResolvedValueOnce({ userId: "user_456" });
      const mockUser = {
        _id: "user_456",
        email: "new@example.com",
        displayName: "New User",
        isEmailVerified: false,
      };
      mockLoginMutation.mockResolvedValueOnce({ user: mockUser });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Perform signup
      await act(async () => {
        await userEvent.click(screen.getByTestId("signup-btn"));
      });

      // Verify login was called after signup
      expect(mockLoginMutation).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
      });

      // Verify user is authenticated
      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      });
    });

    it("handles existing email error", async () => {
      const error = new Error("An account with this email already exists");
      mockSignUpMutation.mockRejectedValueOnce(error);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Attempt signup
      await act(async () => {
        await userEvent.click(screen.getByTestId("signup-btn"));
      });

      // Verify user remains unauthenticated
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
    });
  });

  describe("Update Display Name", () => {
    it("calls updateDisplayName mutation with userId and displayName", async () => {
      // Setup authenticated user first
      const mockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
        isEmailVerified: false,
      };
      mockLoginMutation.mockResolvedValueOnce({ user: mockUser });
      mockUpdateDisplayNameMutation.mockResolvedValueOnce({
        _id: "user_123",
        email: "test@example.com",
        displayName: "Updated Name",
        isEmailVerified: false,
        updatedAt: Date.now(),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Login first
      await act(async () => {
        await userEvent.click(screen.getByTestId("login-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      });

      // Update display name
      await act(async () => {
        await userEvent.click(screen.getByTestId("update-name-btn"));
      });

      // Verify mutation was called with correct args
      expect(mockUpdateDisplayNameMutation).toHaveBeenCalledWith({
        userId: "user_123",
        displayName: "Updated Name",
      });
    });

    it("updates local state on successful display name change", async () => {
      // Setup authenticated user first
      const mockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
        isEmailVerified: false,
      };
      mockLoginMutation.mockResolvedValueOnce({ user: mockUser });
      mockUpdateDisplayNameMutation.mockResolvedValueOnce({
        _id: "user_123",
        email: "test@example.com",
        displayName: "Updated Name",
        isEmailVerified: false,
        updatedAt: Date.now(),
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Login first
      await act(async () => {
        await userEvent.click(screen.getByTestId("login-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("user-display-name").textContent).toBe("Test User");
      });

      // Update display name
      await act(async () => {
        await userEvent.click(screen.getByTestId("update-name-btn"));
      });

      // Verify display name is updated
      await waitFor(() => {
        expect(screen.getByTestId("user-display-name").textContent).toBe("Updated Name");
      });
    });

    it("handles error when not logged in", async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Try to update display name without logging in
      await act(async () => {
        await userEvent.click(screen.getByTestId("update-name-btn"));
      });

      // Mutation should not be called
      expect(mockUpdateDisplayNameMutation).not.toHaveBeenCalled();
    });
  });

  describe("Logout", () => {
    it("clears user state on logout", async () => {
      const mockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
        isEmailVerified: false,
      };
      mockLoginMutation.mockResolvedValueOnce({ user: mockUser });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Login
      await act(async () => {
        await userEvent.click(screen.getByTestId("login-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      });

      // Logout
      await act(async () => {
        await userEvent.click(screen.getByTestId("logout-btn"));
      });

      // Verify user is logged out
      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
        expect(screen.getByTestId("user-email").textContent).toBe("no-user");
      });
    });
  });

  describe("Persistence", () => {
    it("persists user state to localStorage", async () => {
      const mockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
        isEmailVerified: false,
      };
      mockLoginMutation.mockResolvedValueOnce({ user: mockUser });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Login
      await act(async () => {
        await userEvent.click(screen.getByTestId("login-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      });

      // Check localStorage was called with correct data
      expect(localStorageMock.setItem).toHaveBeenCalled();
      const stored = localStorageMock.store["gamestatus_auth"];
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.user.email).toBe("test@example.com");
    });

    it("clears localStorage on logout", async () => {
      const mockUser = {
        _id: "user_123",
        email: "test@example.com",
        displayName: "Test User",
        isEmailVerified: false,
      };
      mockLoginMutation.mockResolvedValueOnce({ user: mockUser });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Wait for initial loading
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // Login
      await act(async () => {
        await userEvent.click(screen.getByTestId("login-btn"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      });

      // Logout
      await act(async () => {
        await userEvent.click(screen.getByTestId("logout-btn"));
      });

      // Check localStorage is cleared
      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("gamestatus_auth");
      });
    });
  });
});
