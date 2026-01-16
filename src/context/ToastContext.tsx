/**
 * Toast Context
 *
 * Provides a global toast notification system.
 * Toasts are displayed in the bottom-right corner and auto-dismiss after 3 seconds.
 *
 * @module ToastContext
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { ToastContainer, type ToastData, type ToastVariant } from "../components/Toast";

/**
 * Toast context value interface.
 */
interface ToastContextValue {
  /** Add a toast notification */
  addToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  /** Remove a toast by ID */
  removeToast: (id: string) => void;
  /** Show a success toast */
  showSuccess: (message: string) => void;
  /** Show an error toast */
  showError: (message: string) => void;
  /** Show an info toast */
  showInfo: (message: string) => void;
}

/**
 * Toast context with default values.
 */
const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Generate a unique toast ID.
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Props for ToastProvider component.
 */
interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * Toast provider component.
 * Wraps the app and provides toast functionality.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: ToastProviderProps): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "success", duration?: number) => {
      const toast: ToastData = {
        id: generateId(),
        message,
        variant,
        duration,
      };
      setToasts((prev) => [...prev, toast]);
    },
    []
  );

  const showSuccess = useCallback(
    (message: string) => addToast(message, "success"),
    [addToast]
  );

  const showError = useCallback(
    (message: string) => addToast(message, "error"),
    [addToast]
  );

  const showInfo = useCallback(
    (message: string) => addToast(message, "info"),
    [addToast]
  );

  const value = useMemo(
    () => ({
      addToast,
      removeToast,
      showSuccess,
      showError,
      showInfo,
    }),
    [addToast, removeToast, showSuccess, showError, showInfo]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast functionality.
 *
 * @returns Toast context value
 * @throws Error if used outside ToastProvider
 *
 * @example
 * ```tsx
 * const { showSuccess, showError } = useToast();
 * showSuccess("Subscription saved!");
 * ```
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastContext;
