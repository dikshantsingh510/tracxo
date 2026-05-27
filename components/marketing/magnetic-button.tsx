"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import Link from "next/link";
import { type MouseEvent, type ReactNode, useRef } from "react";

import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

// Per emil-design-eng §Spring-based mouse interactions. The button tracks
// the cursor with a damped spring so it leans slightly toward the pointer
// — premium "this app is alive" feel. Max 8px translate; spring stiffness 100
// damping 10 (Apple-ish). Reduce-motion: no follow.

type Variant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type Size = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Max translate distance in px on each axis. */
  strength?: number;
};

export function MagneticButton({
  children,
  href,
  onClick,
  variant = "default",
  size = "lg",
  className,
  strength = 8,
}: Props) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 });

  function handleMove(e: MouseEvent<HTMLSpanElement>) {
    if (reduce) return;
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    x.set(Math.max(-1, Math.min(1, dx)) * strength);
    y.set(Math.max(-1, Math.min(1, dy)) * strength);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  // Use motion.span as the magnetic wrapper; the underlying Button uses Base UI
  // and we don't want to wrap it in a motion component (would conflict with the
  // inner press scale). Keep transform purely on the wrapper.
  return (
    <motion.span
      ref={wrapRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={reduce ? undefined : { x: sx, y: sy }}
      className="inline-block"
    >
      {href ? (
        <Button
          variant={variant}
          size={size}
          nativeButton={false}
          className={cn("relative", className)}
          render={<Link href={href}>{children}</Link>}
        />
      ) : (
        <Button
          variant={variant}
          size={size}
          onClick={onClick}
          className={cn("relative", className)}
        >
          {children}
        </Button>
      )}
    </motion.span>
  );
}
