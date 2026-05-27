"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Slides in + fades on first viewport entry. once-only.
// DESIGN.md §7.7 stagger pattern, used between adjacent bento cards via
// `delay` prop (40–120ms cascade).

type Props = {
  children: ReactNode;
  className?: string;
  /** Seconds. Convert ms cascade values: 40ms → 0.04. */
  delay?: number;
  /** Pixels to translate up from. Default 12. */
  distance?: number;
};

export function SectionReveal({ children, className, delay = 0, distance = 12 }: Props) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={
        reduce
          ? { duration: 0.2, delay }
          : { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
