/**
 * Integration Tests for FavoriteToggle
 *
 * These tests verify the FavoriteToggle component integrates correctly
 * with the broader application context and handles edge cases.
 *
 * @module FavoriteToggle.integration.test
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { FavoriteToggle } from "./FavoriteToggle";
import type { Id } from "../../../convex/_generated/dataModel";

// Mock the useMutation hook from convex
vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn().mockResolvedValue(true)),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// Helper to create mock game ID
const mockGameId = "game_123" as Id<"games">;

describe("FavoriteToggle Integration", () => {
  describe("State Synchronization", () => {
    it("should sync local state when isFavorited prop changes", () => {
      const { rerender } = render(
        <FavoriteToggle gameId={mockGameId} isFavorited={false} />
      );

      let button = screen.getByRole("button");
      expect(button).toHaveClass("favorite-toggle-unfavorited");

      // Prop changes from false to true (server update)
      rerender(<FavoriteToggle gameId={mockGameId} isFavorited={true} />);

      button = screen.getByRole("button");
      expect(button).toHaveClass("favorite-toggle-favorited");
    });

    it("should handle rapid prop changes correctly", () => {
      const { rerender } = render(
        <FavoriteToggle gameId={mockGameId} isFavorited={false} />
      );

      // Rapid changes
      rerender(<FavoriteToggle gameId={mockGameId} isFavorited={true} />);
      rerender(<FavoriteToggle gameId={mockGameId} isFavorited={false} />);
      rerender(<FavoriteToggle gameId={mockGameId} isFavorited={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("favorite-toggle-favorited");
    });
  });

  describe("Accessibility", () => {
    it("should be keyboard navigable with Tab", () => {
      render(<FavoriteToggle gameId={mockGameId} isFavorited={false} />);

      const button = screen.getByRole("button");

      // Button should be focusable
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it("should announce state changes to screen readers via aria-pressed", () => {
      const { rerender } = render(
        <FavoriteToggle gameId={mockGameId} isFavorited={false} />
      );

      let button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(button).toHaveAttribute("aria-label", "Add to favorites");

      rerender(<FavoriteToggle gameId={mockGameId} isFavorited={true} />);

      button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(button).toHaveAttribute("aria-label", "Remove from favorites");
    });

    it("should have button type to prevent form submission", () => {
      render(<FavoriteToggle gameId={mockGameId} isFavorited={false} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("Visual States", () => {
    it("should use correct color styling for unfavorited state", () => {
      render(<FavoriteToggle gameId={mockGameId} isFavorited={false} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("favorite-toggle-unfavorited");
      expect(button).not.toHaveClass("favorite-toggle-favorited");
    });

    it("should use correct color styling for favorited state", () => {
      render(<FavoriteToggle gameId={mockGameId} isFavorited={true} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("favorite-toggle-favorited");
      expect(button).not.toHaveClass("favorite-toggle-unfavorited");
    });
  });

  describe("Custom ClassName Support", () => {
    it("should merge custom className with default classes", () => {
      render(
        <FavoriteToggle
          gameId={mockGameId}
          isFavorited={false}
          className="custom-class"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("favorite-toggle");
      expect(button).toHaveClass("custom-class");
    });
  });
});
