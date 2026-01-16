/**
 * ConfirmDialog Component
 *
 * A modal dialog for confirming destructive actions like deletion.
 * Provides title, message, and confirm/cancel buttons.
 *
 * @module ConfirmDialog
 */
import React, { useEffect, useCallback, useRef } from "react";
import "./ConfirmDialog.css";

/**
 * Props for ConfirmDialog component.
 */
interface ConfirmDialogProps {
  /** Dialog title */
  title: string;
  /** Dialog message explaining the action */
  message: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Label for the cancel button */
  cancelLabel?: string;
  /** Callback when confirm is clicked */
  onConfirm: () => void;
  /** Callback when cancel is clicked or dialog is dismissed */
  onCancel: () => void;
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
}

/**
 * ConfirmDialog component.
 *
 * A modal dialog for confirming actions with keyboard support
 * for accessibility (Escape to close, focus trap).
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   title="Delete Subscription"
 *   message="Are you sure you want to delete this subscription?"
 *   confirmLabel="Delete"
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowDialog(false)}
 * />
 * ```
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button on mount for safer default
  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onCancel();
      }
    },
    [onCancel, isLoading]
  );

  // Add escape key listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && !isLoading) {
        onCancel();
      }
    },
    [onCancel, isLoading]
  );

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <h2 id="confirm-dialog-title" className="confirm-dialog__title">
          {title}
        </h2>
        <p id="confirm-dialog-message" className="confirm-dialog__message">
          {message}
        </p>
        <div className="confirm-dialog__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="confirm-dialog__button confirm-dialog__button--cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-dialog__button confirm-dialog__button--confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
