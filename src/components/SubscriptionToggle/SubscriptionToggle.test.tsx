/**
 * Tests for SubscriptionToggle and RegionSelectionPopover Components
 *
 * These tests verify:
 * - Bell icon rendering and states
 * - Popover opening and closing behaviors
 * - Region selection functionality
 * - Optimistic UI updates
 * - Accessibility features
 *
 * @module SubscriptionToggle.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";

// Mock the convex hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the auth context
vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: true })),
}));

// Import after mocking
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "../../context/AuthContext";
import { SubscriptionToggle } from "./SubscriptionToggle";
import { RegionSelectionPopover } from "./RegionSelectionPopover";

describe("SubscriptionToggle Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ isAuthenticated: true });
  });

  afterEach(() => {
    cleanup();
  });

  it("should render bell icon for authenticated users", () => {
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
      isSubscribed: false,
      regions: [],
      subscriptionIds: [],
    });

    render(
      <SubscriptionToggle
        gameId={"game_123" as unknown as import("../../../convex/_generated/dataModel").Id<"games">}
        gameName="Test Game"
      />
    );

    const button = screen.getByRole("button", { name: /subscribe to email alerts/i });
    expect(button).toBeInTheDocument();
  });

  it("should not render for unauthenticated users", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ isAuthenticated: false });

    const { container } = render(
      <SubscriptionToggle
        gameId={"game_123" as unknown as import("../../../convex/_generated/dataModel").Id<"games">}
        gameName="Test Game"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should show filled bell icon when subscribed", () => {
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
      isSubscribed: true,
      regions: ["na"],
      subscriptionIds: ["sub_123"],
    });

    render(
      <SubscriptionToggle
        gameId={"game_123" as unknown as import("../../../convex/_generated/dataModel").Id<"games">}
        gameName="Test Game"
      />
    );

    const button = screen.getByRole("button", { name: /manage email alerts/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("subscription-toggle__button--subscribed");
  });

  it("should have correct aria attributes", () => {
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue({
      isSubscribed: false,
      regions: [],
      subscriptionIds: [],
    });

    render(
      <SubscriptionToggle
        gameId={"game_123" as unknown as import("../../../convex/_generated/dataModel").Id<"games">}
        gameName="Test Game"
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});

describe("RegionSelectionPopover Component", () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();
  const mockAnchorRef = { current: document.createElement("button") };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should render all region options", () => {
    render(
      <RegionSelectionPopover
        gameName="Test Game"
        initialRegions={[]}
        anchorRef={mockAnchorRef}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    // Use getAllByText for elements that appear multiple times (Asia/Global)
    expect(screen.getByText("North America")).toBeInTheDocument();
    expect(screen.getByText("Europe")).toBeInTheDocument();
    expect(screen.getAllByText("Asia").length).toBeGreaterThan(0);
    expect(screen.getByText("Oceania")).toBeInTheDocument();
    expect(screen.getAllByText("Global").length).toBeGreaterThan(0);
  });

  it("should pre-check initial regions", () => {
    render(
      <RegionSelectionPopover
        gameName="Test Game"
        initialRegions={["na", "eu"]}
        anchorRef={mockAnchorRef}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const checkboxes = screen.getAllByRole("checkbox");
    const naCheckbox = checkboxes[0]; // NA is first
    const euCheckbox = checkboxes[1]; // EU is second
    const asiaCheckbox = checkboxes[2]; // Asia is third

    expect(naCheckbox).toBeChecked();
    expect(euCheckbox).toBeChecked();
    expect(asiaCheckbox).not.toBeChecked();
  });

  it("should toggle region selection on click", () => {
    render(
      <RegionSelectionPopover
        gameName="Test Game"
        initialRegions={[]}
        anchorRef={mockAnchorRef}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const naCheckbox = screen.getAllByRole("checkbox")[0];
    expect(naCheckbox).not.toBeChecked();

    fireEvent.click(naCheckbox);
    expect(naCheckbox).toBeChecked();

    fireEvent.click(naCheckbox);
    expect(naCheckbox).not.toBeChecked();
  });

  it("should call onClose when Cancel is clicked", () => {
    render(
      <RegionSelectionPopover
        gameName="Test Game"
        initialRegions={[]}
        anchorRef={mockAnchorRef}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should call onSave with selected regions when Subscribe is clicked", async () => {
    mockOnSave.mockResolvedValue(undefined);

    render(
      <RegionSelectionPopover
        gameName="Test Game"
        initialRegions={[]}
        anchorRef={mockAnchorRef}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    // Select NA and EU
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // NA
    fireEvent.click(checkboxes[1]); // EU

    // Now use within to get the specific Subscribe button
    const subscribeButton = screen.getAllByRole("button").find(
      btn => btn.textContent === "Subscribe"
    );
    expect(subscribeButton).toBeDefined();
    fireEvent.click(subscribeButton!);

    expect(mockOnSave).toHaveBeenCalledWith(expect.arrayContaining(["na", "eu"]));
  });

  it("should respond to Escape key", () => {
    render(
      <RegionSelectionPopover
        gameName="Test Game"
        initialRegions={[]}
        anchorRef={mockAnchorRef}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    // onClose will be called (possibly multiple times due to event handlers)
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should display Update button when editing existing subscription", () => {
    render(
      <RegionSelectionPopover
        gameName="Test Game"
        initialRegions={["na"]}
        anchorRef={mockAnchorRef}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    // Select EU to enable Update button
    const euCheckbox = screen.getAllByRole("checkbox")[1];
    fireEvent.click(euCheckbox);

    // Find the Update button
    const updateButton = screen.getAllByRole("button").find(
      btn => btn.textContent === "Update"
    );
    expect(updateButton).toBeDefined();
    expect(updateButton).not.toBeDisabled();
  });
});
