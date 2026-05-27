"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useRef } from "react";

// Count-up animation triggered when the element enters the viewport.
// Reduce-motion: snaps to final value.
// Reusable across "Balances simplified" bento card, trust stats, etc.

type Props = {
  /** Final value to animate to. */
  to: number;
  /** Starting value. Default 0. */
  from?: number;
  /** Animation duration in seconds. Default 1.6. */
  duration?: number;
  /** Formatter to wrap the running value. Default: locale-aware integer. */
  format?: (v: number) => string;
  className?: string;
  /** Optional prefix (e.g. "₹"). */
  prefix?: string;
  /** Optional suffix (e.g. " owed"). */
  suffix?: string;
};

const DEFAULT_FORMATTER = (v: number) => Math.round(v).toLocaleString();

export function NumberTicker({
  to,
  from = 0,
  duration = 1.6,
  format = DEFAULT_FORMATTER,
  prefix,
  suffix,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const reduce = useReducedMotion();
  const raw = useMotionValue(reduce ? to : from);
  const text = useTransform(raw, (v) => format(v));

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      raw.set(to);
      return;
    }
    const controls = animate(raw, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, to, duration, raw, reduce]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span className="tabular-nums">{text}</motion.span>
      {suffix}
    </span>
  );
}
