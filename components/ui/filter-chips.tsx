"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Dismissible filter pills above a result list. Used on search + master tables.
// Each chip shows a label like "Category: Food" with an × that removes that
// filter. "Clear all" is rendered when there's more than one chip.

export type Chip = {
  key: string;
  label: string;
};

type Props = {
  chips: Chip[];
  onRemove: (key: string) => void;
  onClear?: () => void;
  className?: string;
};

export function FilterChips({ chips, onRemove, onClear, className }: Props) {
  if (chips.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-secondary px-3 text-secondary-foreground text-xs transition-colors hover:bg-muted"
          aria-label={`Remove filter: ${chip.label}`}
        >
          <span>{chip.label}</span>
          <X aria-hidden className="size-3 opacity-60" strokeWidth={2} />
        </button>
      ))}
      {chips.length > 1 && onClear ? (
        <Button variant="link" size="sm" onClick={onClear}>
          Clear all
        </Button>
      ) : null}
    </div>
  );
}
