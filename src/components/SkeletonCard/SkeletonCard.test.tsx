/**
 * Tests for Loading and Empty State Components
 *
 * Tests verify SkeletonCard, EmptyState, and ErrorState components
 * render correctly with appropriate content.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { SkeletonCard } from "./SkeletonCard";
import { EmptyState } from "../EmptyState/EmptyState";
import { ErrorState } from "../ErrorState/ErrorState";

afterEach(() => {
  cleanup();
});

describe("SkeletonCard Component", () => {
  it("should render skeleton loading card with animation", () => {
    render(<SkeletonCard />);

    const skeleton = screen.getByTestId("skeleton-card");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.className).toContain("skeleton-card");
  });

  it("should render multiple skeleton cards", () => {
    render(
      <>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </>
    );

    const skeletons = screen.getAllByTestId("skeleton-card");
    expect(skeletons).toHaveLength(3);
  });
});

describe("EmptyState Component", () => {
  it("should display appropriate messaging when no games configured", () => {
    render(<EmptyState />);

    expect(screen.getByText(/No games/i)).toBeInTheDocument();
  });

  it("should include helpful context", () => {
    render(<EmptyState message="No games to display" />);

    expect(screen.getByText("No games to display")).toBeInTheDocument();
  });
});

describe("ErrorState Component", () => {
  it("should display user-friendly error message", () => {
    render(<ErrorState message="Failed to load data" />);

    expect(screen.getByText(/Failed to load data/i)).toBeInTheDocument();
  });

  it("should include retry button", () => {
    const handleRetry = () => {};
    render(<ErrorState message="Error occurred" onRetry={handleRetry} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("should call onRetry when retry button is clicked", () => {
    let retryClicked = false;
    const handleRetry = () => {
      retryClicked = true;
    };

    render(<ErrorState message="Error" onRetry={handleRetry} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    expect(retryClicked).toBe(true);
  });
});
