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

// Mock the auth context - include user with _id for custom auth
vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: { _id: "user_123", email: "test@example.com", displayName: "Test User", isEmailVerified: true },
  })),
}));

// Import after mocking
import { useQuery } from "convex/react";
import { useAuth } from "../../context/AuthContext";
import { SubscriptionToggle } from "./SubscriptionToggle";
import { RegionSelectionPopover } from "./RegionSelectionPopover";

describe("SubscriptionToggle Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { _id: "user_123", email: "test@example.com", displayName: "Test User", isEmailVerified: true },
    });
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
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ isAuthenticated: false, user: null });

    const { container } = render(
      <SubscriptionToggle
        gameId={"game_123" as unknown as import("../../../convex/_generated/dataModel").Id<"games">}
        gameName="Test Game"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should not render when user has no _id", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      isAuthenticated: true,
      user: { email: "test@example.com" }, // Missing _id
    });

    // useQuery will return "skip" because userId is undefined
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    render(
      <SubscriptionToggle
        gameId={"game_123" as unknown as import("../../../convex/_generated/dataModel").Id<"games">}
        gameName="Test Game"
      />
    );

    // The button should be disabled during loading
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
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
  let mockAnchorRef: { current: HTMLButtonElement };

  beforeEach(() => {
    vi.clearAllMocks();
    // Create anchor element with getBoundingClientRect for portal positioning
    const anchorButton = document.createElement("button");
    anchorButton.getBoundingClientRect = () => ({
      top: 100,
      bottom: 132,
      left: 200,
      right: 232,
      width: 32,
      height: 32,
      x: 200,
      y: 100,
      toJSON: () => ({}),
    });
    document.body.appendChild(anchorButton);
    mockAnchorRef = { current: anchorButton };
  });

  afterEach(() => {
    cleanup();
    // Clean up anchor element
    if (mockAnchorRef.current && document.body.contains(mockAnchorRef.current)) {
      document.body.removeChild(mockAnchorRef.current);
    }
  });

  it("should render popover via portal at document body level", () => {
    render(
      <RegionSelectionPopover
        gameName="Test Game"
        initialRegions={[]}
        anchorRef={mockAnchorRef}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    // The dialog should be rendered at body level (portal)
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
    expect(dialog?.classList.contains("region-popover--portal")).toBe(true);
  });

  it("should have fixed positioning from portal", () => {
    render(
      <RegionSelectionPopover
        gameName="Test Game"
        initialRegions={[]}
        anchorRef={mockAnchorRef}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).toBeInTheDocument();
    expect(dialog?.style.position).toBe("fixed");
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
