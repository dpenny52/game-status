/**
 * Authentication Context
 *
 * Provides global authentication state management for the application.
 * Handles user login, logout, and session persistence.
 *
 * @module AuthContext
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

/**
 * User type representing an authenticated user.
 */
export interface User {
  _id: string;
  email: string;
  displayName: string;
  isEmailVerified: boolean;
  providerType?: string;
  providerId?: string;
  _creationTime?: number;
}

/**
 * Auth state type.
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Auth context type with state and actions.
 */
export interface AuthContextType extends AuthState {
  /** Log in with email and password */
  login: (email: string, password: string) => Promise<void>;
  /** Sign up with email, password, and display name */
  signup: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  /** Log out the current user */
  logout: () => Promise<void>;
  /** Update the current user's display name */
  updateDisplayName: (displayName: string) => Promise<void>;
  /** Set user from external source (OAuth callback, etc.) */
  setUser: (user: User | null) => void;
  /** Open login modal */
  openLoginModal: () => void;
  /** Open signup modal */
  openSignupModal: () => void;
  /** Close auth modals */
  closeAuthModals: () => void;
  /** Current modal state */
  modalState: "login" | "signup" | null;
}

// Create context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Storage key for persisted auth state.
 */
const AUTH_STORAGE_KEY = "gamestatus_auth";

/**
 * AuthProvider wraps the application to provide authentication state.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Router>
 *         <Routes />
 *       </Router>
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState<"login" | "signup" | null>(null);

  // Load persisted auth state on mount
  useEffect(() => {
    const loadPersistedAuth = () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.user) {
            setUserState(parsed.user);
          }
        }
      } catch (error) {
        console.error("Failed to load auth state:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersistedAuth();
  }, []);

  // Persist auth state when user changes
  useEffect(() => {
    if (!isLoading) {
      try {
        if (user) {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user }));
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to persist auth state:", error);
      }
    }
  }, [user, isLoading]);

  // Set user (for OAuth callbacks, etc.)
  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
  }, []);

  // Login with email/password
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would call the Convex mutation
      // For now, we simulate the login
      const mockUser: User = {
        _id: "user_" + Date.now(),
        email: email.toLowerCase().trim(),
        displayName: email.split("@")[0],
        isEmailVerified: false,
      };
      setUserState(mockUser);
      setModalState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Signup with email/password/displayName
  const signup = useCallback(
    async (email: string, password: string, displayName: string) => {
      setIsLoading(true);
      try {
        // In a real app, this would call the Convex mutation
        // For now, we simulate the signup
        const mockUser: User = {
          _id: "user_" + Date.now(),
          email: email.toLowerCase().trim(),
          displayName: displayName.trim(),
          isEmailVerified: false,
          _creationTime: Date.now(),
        };
        setUserState(mockUser);
        setModalState(null);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Logout
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real app, this would clear the Convex session
      setUserState(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update display name
  const updateDisplayName = useCallback(async (displayName: string) => {
    setUserState((prev) => {
      if (!prev) return null;
      return { ...prev, displayName: displayName.trim() };
    });
  }, []);

  // Modal controls
  const openLoginModal = useCallback(() => setModalState("login"), []);
  const openSignupModal = useCallback(() => setModalState("signup"), []);
  const closeAuthModals = useCallback(() => setModalState(null), []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    updateDisplayName,
    setUser,
    openLoginModal,
    openSignupModal,
    closeAuthModals,
    modalState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 *
 * @returns Auth context with user state and actions
 * @throws Error if used outside AuthProvider
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { user, logout, isAuthenticated } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <p>Please log in</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Welcome, {user.displayName}!</p>
 *       <button onClick={logout}>Log out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
