/**
 * Tests for StatusIndicator Component
 *
 * Tests verify that the StatusIndicator component displays correct
 * visual states and accessibility features for each status type.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StatusIndicator } from "./StatusIndicator";

// Cleanup after each test to avoid multiple elements in the DOM
afterEach(() => {
  cleanup();
});

describe("StatusIndicator Component", () => {
  it("should render correct visual for each status type", () => {
    const statuses = ["online", "offline", "degraded", "maintenance", "unknown"] as const;

    statuses.forEach((status) => {
      render(<StatusIndicator status={status} />);

      // Should have a container with the status indicator
      const indicator = screen.getByTestId("status-indicator");
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute("data-status", status);

      cleanup();
    });
  });

  it("should include accessible text label alongside icon", () => {
    render(<StatusIndicator status="online" />);
    expect(screen.getByText("Online")).toBeInTheDocument();
    cleanup();

    render(<StatusIndicator status="offline" />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
    cleanup();

    render(<StatusIndicator status="degraded" />);
    expect(screen.getByText("Degraded")).toBeInTheDocument();
    cleanup();

    render(<StatusIndicator status="maintenance" />);
    expect(screen.getByText("Maintenance")).toBeInTheDocument();
    cleanup();

    render(<StatusIndicator status="unknown" />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("should apply correct CSS classes for color coding", () => {
    render(<StatusIndicator status="online" />);
    let indicator = screen.getByTestId("status-indicator");
    expect(indicator.className).toContain("status-online");
    cleanup();

    render(<StatusIndicator status="offline" />);
    indicator = screen.getByTestId("status-indicator");
    expect(indicator.className).toContain("status-offline");
    cleanup();

    render(<StatusIndicator status="degraded" />);
    indicator = screen.getByTestId("status-indicator");
    expect(indicator.className).toContain("status-degraded");
    cleanup();

    render(<StatusIndicator status="maintenance" />);
    indicator = screen.getByTestId("status-indicator");
    expect(indicator.className).toContain("status-maintenance");
    cleanup();

    render(<StatusIndicator status="unknown" />);
    indicator = screen.getByTestId("status-indicator");
    expect(indicator.className).toContain("status-unknown");
  });

  it("should have proper ARIA attributes for accessibility", () => {
    render(<StatusIndicator status="online" />);

    const indicator = screen.getByTestId("status-indicator");
    expect(indicator).toHaveAttribute("role", "status");
    expect(indicator).toHaveAttribute("aria-label");
  });
});
