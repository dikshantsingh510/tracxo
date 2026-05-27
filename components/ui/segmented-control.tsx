"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";

import { cn } from "@/lib/utils";

// DESIGN.md §8.13 — pill-style switcher with shared-element active indicator.
// Used for expense split-mode (Equal / Unequal / % / Share / Itemized),
// settings tabs, and any 2-5 option exclusive selector.
//
// Active indicator slides via Framer Motion layoutId (200ms ease-out-quint).
// Keyboard: ← / → switches focus + value, Home / End jumps to first / last.

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
};

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  size = "md",
  className,
  ariaLabel,
}: Props<T>) {
  const layoutId = useId();
  const reduce = useReducedMotion();
  const heightClass = size === "sm" ? "h-7 text-xs" : "h-8 text-sm";

  function move(currentIndex: number, delta: number) {
    let i = currentIndex;
    for (let k = 0; k < options.length; k++) {
      i = (i + delta + options.length) % options.length;
      if (!options[i].disabled) {
        onValueChange(options[i].value);
        return;
      }
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      move(index, 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      move(index, -1);
    } else if (e.key === "Home") {
      e.preventDefault();
      const i = options.findIndex((o) => !o.disabled);
      if (i >= 0) onValueChange(options[i].value);
    } else if (e.key === "End") {
      e.preventDefault();
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) {
          onValueChange(options[i].value);
          return;
        }
      }
    }
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "surface-acrylic-light inline-flex items-center gap-1 rounded-lg p-1",
        className,
      )}
    >
      {options.map((opt, idx) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`${layoutId}-panel`}
            tabIndex={active ? 0 : -1}
            disabled={opt.disabled}
            onClick={() => !opt.disabled && onValueChange(opt.value)}
            onKeyDown={(e) => handleKey(e, idx)}
            className={cn(
              "relative inline-flex shrink-0 items-center justify-center rounded-md px-3 font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
              heightClass,
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                aria-hidden
                className="absolute inset-0 rounded-md bg-background shadow-xs ring-1 ring-foreground/5"
                transition={
                  reduce ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 32 }
                }
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
