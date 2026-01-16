/**
 * Tests for ConnectionHealthIndicator Component
 *
 * Tests verify that the indicator displays correct visual states
 * for connected, reconnecting, and disconnected statuses.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ConnectionHealthIndicatorControlled } from "./ConnectionHealthIndicator";

// We test the controlled variant to avoid mocking Convex hooks
describe("ConnectionHealthIndicator Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("should display green dot for connected state", () => {
    render(<ConnectionHealthIndicatorControlled status="connected" />);

    const indicator = screen.getByTestId("connection-health-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("data-status", "connected");
    expect(indicator).toHaveClass("connection-status-connected");
  });

  it("should display yellow dot for reconnecting state", () => {
    render(<ConnectionHealthIndicatorControlled status="reconnecting" />);

    const indicator = screen.getByTestId("connection-health-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("data-status", "reconnecting");
    expect(indicator).toHaveClass("connection-status-reconnecting");
  });

  it("should display red dot for disconnected state", () => {
    render(<ConnectionHealthIndicatorControlled status="disconnected" />);

    const indicator = screen.getByTestId("connection-health-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("data-status", "disconnected");
    expect(indicator).toHaveClass("connection-status-disconnected");
  });

  it("should have accessible label describing connection state", () => {
    render(<ConnectionHealthIndicatorControlled status="connected" />);

    const indicator = screen.getByTestId("connection-health-indicator");
    expect(indicator).toHaveAttribute("role", "status");
    expect(indicator).toHaveAttribute("aria-label");
    expect(indicator.getAttribute("aria-label")).toContain("Connected");
  });

  it("should have tooltip text on hover", () => {
    render(<ConnectionHealthIndicatorControlled status="disconnected" />);

    const indicator = screen.getByTestId("connection-health-indicator");
    expect(indicator).toHaveAttribute("title");
    expect(indicator.getAttribute("title")).toContain("Disconnected");
  });

  it("should show label when showLabel prop is true", () => {
    render(<ConnectionHealthIndicatorControlled status="connected" showLabel />);

    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("should hide label by default", () => {
    render(<ConnectionHealthIndicatorControlled status="connected" />);

    expect(screen.queryByText("Connected")).not.toBeInTheDocument();
  });

  it("should apply size class based on size prop", () => {
    render(<ConnectionHealthIndicatorControlled status="connected" size="medium" />);

    const indicator = screen.getByTestId("connection-health-indicator");
    expect(indicator).toHaveClass("connection-size-medium");
  });

  it("should apply custom className", () => {
    render(<ConnectionHealthIndicatorControlled status="connected" className="my-custom-class" />);

    const indicator = screen.getByTestId("connection-health-indicator");
    expect(indicator).toHaveClass("my-custom-class");
  });
});
