/**
 * Toast Component
 *
 * A notification toast that appears in the bottom-right corner.
 * Auto-dismisses after 3 seconds by default.
 *
 * Features:
 * - Slide-in animation
 * - Auto-dismiss with configurable duration
 * - Manual dismiss button
 * - Success/error/info variants
 *
 * @module Toast
 */
import React, { useEffect, useState, useCallback } from "react";
import "./Toast.css";

/**
 * Toast variant types.
 */
export type ToastVariant = "success" | "error" | "info";

/**
 * Toast notification data.
 */
export interface ToastData {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

/**
 * Props for Toast component.
 */
interface ToastProps {
  /** Toast data */
  toast: ToastData;
  /** Callback when toast is dismissed */
  onDismiss: (id: string) => void;
}

/**
 * Individual toast notification.
 */
export function Toast({ toast, onDismiss }: ToastProps): React.JSX.Element {
  const [isExiting, setIsExiting] = useState(false);
  const duration = toast.duration ?? 3000;
  const variant = toast.variant ?? "success";

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    // Wait for exit animation before actually removing
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, handleDismiss]);

  return (
    <div
      className={`toast toast--${variant} ${isExiting ? "toast--exiting" : ""}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast__message">{toast.message}</span>
      <button
        type="button"
        className="toast__dismiss"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="toast__dismiss-icon"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Props for ToastContainer component.
 */
interface ToastContainerProps {
  /** Active toasts to display */
  toasts: ToastData[];
  /** Callback when a toast is dismissed */
  onDismiss: (id: string) => void;
}

/**
 * Container for rendering multiple toasts.
 */
export function ToastContainer({
  toasts,
  onDismiss,
}: ToastContainerProps): React.JSX.Element | null {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export default Toast;
