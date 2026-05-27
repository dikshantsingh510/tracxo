"use client";

import { Check, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

// DESIGN.md §8.17 — Two-state morph button.
// Idle → Pending → Success → revert to Idle.
// Width is locked to the widest label across all three states (idle/pending/success);
// labels swap behind a brief filter-blur mask. Success check pops in with
// ease-spring (one of the very few sanctioned uses of bounce in the app, §7.1).

type Variant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type Size = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

type Props = {
  idle: string;
  pending: string;
  success: string;
  onAction: () => Promise<void>;
  variant?: Variant;
  size?: Size;
  /** Time before reverting from success → idle (ms). 0 = stay successful. */
  revertAfter?: number;
  className?: string;
  disabled?: boolean;
};

type Phase = "idle" | "pending" | "success";

export function MorphButton({
  idle,
  pending,
  success,
  onAction,
  variant = "default",
  size = "default",
  revertAfter = 1500,
  className,
  disabled,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const reduce = useReducedMotion();

  // Schedule the revert when entering `success`. Cleanup on unmount.
  useEffect(() => {
    if (phase !== "success" || revertAfter <= 0) return;
    const t = setTimeout(() => setPhase("idle"), revertAfter);
    return () => clearTimeout(t);
  }, [phase, revertAfter]);

  async function handleClick() {
    if (phase !== "idle" || disabled) return;
    setPhase("pending");
    try {
      await onAction();
      setPhase("success");
    } catch {
      // Caller is responsible for surfacing the error (toast, alert, etc.);
      // we simply revert so the user can retry.
      setPhase("idle");
    }
  }

  // Width-lock: render all 3 labels invisibly to size the button, overlay the
  // active one. This avoids layout shift between phases.
  const widthSizer = (
    <span aria-hidden className="invisible inline-flex flex-col">
      <span>{idle}</span>
      <span>{pending}</span>
      <span>{success}</span>
    </span>
  );

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || phase === "pending"}
      onClick={handleClick}
      className={cn("relative", className)}
    >
      <span className="grid place-items-center [&>*]:[grid-area:1/1]">
        {widthSizer}
        <AnimatePresence mode="popLayout" initial={false}>
          {phase === "idle" && (
            <motion.span
              key="idle"
              initial={reduce ? false : { opacity: 0, filter: "blur(2px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(2px)" }}
              transition={{ duration: 0.18 }}
            >
              {idle}
            </motion.span>
          )}
          {phase === "pending" && (
            <motion.span
              key="pending"
              initial={reduce ? false : { opacity: 0, filter: "blur(2px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(2px)" }}
              transition={{ duration: 0.18 }}
              className="inline-flex items-center gap-1.5"
            >
              <Loader2 aria-hidden className="size-3.5 animate-spin" />
              {pending}
            </motion.span>
          )}
          {phase === "success" && (
            <motion.span
              key="success"
              initial={reduce ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={
                reduce ? { duration: 0.15 } : { type: "spring", stiffness: 520, damping: 18 }
              }
              className="inline-flex items-center gap-1.5"
            >
              <Check aria-hidden className="size-3.5" strokeWidth={2.5} />
              {success}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </Button>
  );
}
