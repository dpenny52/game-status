/**
 * Modal Component
 *
 * A reusable modal overlay component with accessibility features.
 * Supports click-outside-to-close, ESC key handling, and focus trapping.
 *
 * @module Modal
 */
import React, { useEffect, useRef, useCallback } from "react";
import "./Modal.css";

/**
 * Props for the Modal component.
 */
export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title for accessibility */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Additional CSS class names */
  className?: string;
  /** Whether to show the close button (default: true) */
  showCloseButton?: boolean;
  /** Size of the modal (default: "medium") */
  size?: "small" | "medium" | "large";
}

/**
 * Modal displays content in an overlay with accessibility features.
 *
 * Features:
 * - Semi-transparent backdrop
 * - Click outside to close
 * - ESC key to close
 * - Focus trap within modal
 * - Prevents body scroll when open
 *
 * @example
 * ```tsx
 * <Modal isOpen={isOpen} onClose={handleClose} title="Login">
 *   <form>...</form>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  showCloseButton = true,
  size = "medium",
}: ModalProps): JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle ESC key to close modal
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Handle click outside modal to close
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Focus trap: keep focus within modal
  const handleTabKey = useCallback(
    (event: KeyboardEvent) => {
      if (!modalRef.current || event.key !== "Tab") return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    },
    []
  );

  // Manage focus and body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      // Add event listeners
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keydown", handleTabKey);

      // Focus the modal
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        firstFocusable?.focus();
      }, 0);
    } else {
      // Restore body scroll
      document.body.style.overflow = "";

      // Restore focus to previous element
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleTabKey);
    };
  }, [isOpen, handleKeyDown, handleTabKey]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
      data-testid="modal-backdrop"
    >
      <div
        ref={modalRef}
        className={`modal modal-${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        data-testid="modal"
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          {showCloseButton && (
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
              data-testid="modal-close-button"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="modal-close-icon"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
