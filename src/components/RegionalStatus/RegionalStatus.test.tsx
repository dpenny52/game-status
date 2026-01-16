/**
 * Tests for RegionalStatus Component
 *
 * Tests verify regional breakdown display, expand/collapse functionality,
 * and "Global" label for games without regional separation.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { RegionalStatus } from "./RegionalStatus";
import type { RegionStatus } from "./RegionalStatus";

afterEach(() => {
  cleanup();
});

describe("RegionalStatus Component", () => {
  const multiRegionData: RegionStatus[] = [
    { region: "na", status: "online" },
    { region: "eu", status: "online" },
    { region: "asia", status: "degraded" },
    { region: "oce", status: "offline" },
  ];

  const globalData: RegionStatus[] = [{ region: "global", status: "online" }];

  it("should render regional breakdown with status per region when expanded", () => {
    render(<RegionalStatus regions={multiRegionData} defaultExpanded />);

    // Should show all regions with their statuses
    expect(screen.getByText("NA")).toBeInTheDocument();
    expect(screen.getByText("EU")).toBeInTheDocument();
    expect(screen.getByText("ASIA")).toBeInTheDocument();
    expect(screen.getByText("OCE")).toBeInTheDocument();
  });

  it("should default to collapsed state and expand on interaction", () => {
    render(<RegionalStatus regions={multiRegionData} />);

    // Should show expand button but not individual regions in collapsed state
    const expandButton = screen.getByRole("button");
    expect(expandButton).toBeInTheDocument();

    // Click to expand
    fireEvent.click(expandButton);

    // Now regions should be visible
    expect(screen.getByText("NA")).toBeInTheDocument();
    expect(screen.getByText("EU")).toBeInTheDocument();
  });

  it('should display "Global" label for games without regional separation', () => {
    render(<RegionalStatus regions={globalData} defaultExpanded />);

    expect(screen.getByText("Global")).toBeInTheDocument();
    // Should not show individual region labels
    expect(screen.queryByText("NA")).not.toBeInTheDocument();
    expect(screen.queryByText("EU")).not.toBeInTheDocument();
  });

  it("should toggle between collapsed and expanded states", () => {
    render(<RegionalStatus regions={multiRegionData} />);

    const expandButton = screen.getByRole("button");

    // Initially collapsed - button should exist
    expect(expandButton).toBeInTheDocument();

    // Expand
    fireEvent.click(expandButton);
    expect(screen.getByText("NA")).toBeInTheDocument();

    // Collapse again
    fireEvent.click(expandButton);
    // After collapse, the detailed regions should be hidden
    expect(screen.queryByText("NA")).not.toBeInTheDocument();
  });
});
