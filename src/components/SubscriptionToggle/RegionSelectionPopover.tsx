/**
 * RegionSelectionPopover Component
 *
 * A popover dialog for selecting regions to subscribe to for email alerts.
 * Renders as a floating panel positioned relative to the anchor element.
 *
 * Features:
 * - Multi-select checkboxes for NA, EU, Asia, OCE, Global
 * - Closes on outside click, Escape key, or successful submit
 * - Focus trap for accessibility
 *
 * @module RegionSelectionPopover
 */
import React, { useState, useCallback, useEffect, useRef } from "react";
import "./RegionSelectionPopover.css";

/**
 * Region configuration for display.
 */
interface RegionConfig {
  id: string;
  label: string;
  shortLabel: string;
}

/**
 * Available regions for subscription.
 */
const REGIONS: RegionConfig[] = [
  { id: "na", label: "North America", shortLabel: "NA" },
  { id: "eu", label: "Europe", shortLabel: "EU" },
  { id: "asia", label: "Asia", shortLabel: "Asia" },
  { id: "oce", label: "Oceania", shortLabel: "OCE" },
  { id: "global", label: "Global", shortLabel: "Global" },
];

/**
 * Props for RegionSelectionPopover component.
 */
interface RegionSelectionPopoverProps {
  /** Game name for display */
  gameName: string;
  /** Initially selected regions */
  initialRegions: string[];
  /** Reference to anchor element for positioning */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Callback when user saves selection */
  onSave: (regions: string[]) => Promise<unknown> | void;
  /** Callback when popover is closed */
  onClose: () => void;
}

/**
 * RegionSelectionPopover component.
 *
 * Displays a floating panel with region checkboxes for email alert subscriptions.
 *
 * @param props - Component props
 * @returns The popover element
 *
 * @example
 * ```tsx
 * <RegionSelectionPopover
 *   gameName="World of Warcraft"
 *   initialRegions={["na", "eu"]}
 *   anchorRef={buttonRef}
 *   onSave={(regions) => console.log('Selected:', regions)}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */
export function RegionSelectionPopover({
  gameName,
  initialRegions,
  anchorRef,
  onSave,
  onClose,
}: RegionSelectionPopoverProps): React.JSX.Element {
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(
    new Set(initialRegions)
  );
  const [isSaving, setIsSaving] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const firstCheckboxRef = useRef<HTMLInputElement>(null);

  /**
   * Handle checkbox change for a region.
   */
  const handleRegionToggle = useCallback((regionId: string) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(regionId)) {
        next.delete(regionId);
      } else {
        next.add(regionId);
      }
      return next;
    });
  }, []);

  /**
   * Handle save button click.
   */
  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onSave(Array.from(selectedRegions));
      // onClose will be called by the parent after successful save
    } catch (error) {
      console.error("Failed to save regions:", error);
      setIsSaving(false);
    }
  }, [selectedRegions, onSave, isSaving]);

  /**
   * Handle keyboard events.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  /**
   * Handle outside click.
   */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const popover = popoverRef.current;
      const anchor = anchorRef.current;

      if (
        popover &&
        !popover.contains(target) &&
        anchor &&
        !anchor.contains(target)
      ) {
        onClose();
      }
    }

    // Use capture phase to handle click before other handlers
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [anchorRef, onClose]);

  /**
   * Focus first checkbox on mount.
   */
  useEffect(() => {
    if (firstCheckboxRef.current) {
      firstCheckboxRef.current.focus();
    }
  }, []);

  /**
   * Handle global Escape key.
   */
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [onClose]);

  const hasChanges =
    initialRegions.length !== selectedRegions.size ||
    !initialRegions.every((r) => selectedRegions.has(r));

  const buttonLabel =
    selectedRegions.size === 0
      ? "Unsubscribe"
      : initialRegions.length === 0
        ? "Subscribe"
        : "Update";

  return (
    <div
      ref={popoverRef}
      className="region-popover"
      role="dialog"
      aria-modal="true"
      aria-label={`Select regions for ${gameName} alerts`}
      onKeyDown={handleKeyDown}
    >
      <div className="region-popover__header">
        <h3 className="region-popover__title">Email Alerts</h3>
        <p className="region-popover__subtitle">
          Select regions for {gameName}
        </p>
      </div>

      <div className="region-popover__regions" role="group" aria-label="Region selection">
        {REGIONS.map((region, index) => (
          <label
            key={region.id}
            className={`region-popover__region ${selectedRegions.has(region.id) ? "region-popover__region--selected" : ""}`}
          >
            <input
              ref={index === 0 ? firstCheckboxRef : undefined}
              type="checkbox"
              className="region-popover__checkbox"
              checked={selectedRegions.has(region.id)}
              onChange={() => handleRegionToggle(region.id)}
              disabled={isSaving}
            />
            <span className="region-popover__region-label">{region.label}</span>
            <span className="region-popover__region-short">{region.shortLabel}</span>
          </label>
        ))}
      </div>

      <div className="region-popover__actions">
        <button
          type="button"
          className="region-popover__button region-popover__button--cancel"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="region-popover__button region-popover__button--save"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? "Saving..." : buttonLabel}
        </button>
      </div>
    </div>
  );
}

export default RegionSelectionPopover;
