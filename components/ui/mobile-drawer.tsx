"use client";

import { Drawer as VaulDrawer } from "vaul";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// DESIGN.md §8.12 — Mobile bottom-sheet (Vaul). Used for mobile sidebar
// (§C1) and mobile category-edit (§E2). Top corners radius-2xl, 40×4 handle,
// velocity dismissal via vaul's closeThreshold ≈ 0.11 distance equivalent.
//
// Vaul handles pointer capture + multi-touch + damping internally.

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function MobileDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: Props) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay
          className="fixed inset-0 z-[var(--z-drawer)] bg-black/40 backdrop-blur-sm"
        />
        <VaulDrawer.Content
          aria-describedby={description ? undefined : undefined}
          className={cn(
            "surface-acrylic-heavy fixed right-0 bottom-0 left-0 z-[var(--z-drawer)] mt-24 flex max-h-[85vh] flex-col rounded-t-[20px] outline-none",
            className,
          )}
        >
          {/* Handle indicator — DESIGN.md §8.12: 40×4, radius-full, centered */}
          <div
            aria-hidden
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-700"
          />
          <div className="flex flex-col gap-4 overflow-y-auto px-6 pt-4 pb-6">
            {title ? (
              <VaulDrawer.Title className="font-semibold text-foreground text-lg">
                {title}
              </VaulDrawer.Title>
            ) : null}
            {description ? (
              <VaulDrawer.Description className="text-muted-foreground text-sm">
                {description}
              </VaulDrawer.Description>
            ) : null}
            {children}
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}
