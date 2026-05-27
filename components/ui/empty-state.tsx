import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// DESIGN.md §8.18 — Empty State.
// Three variants:
//   default     — neutral icon over body bg; standard catch-all
//   no-results  — same shape, intended for filter/search empties
//   settled-up  — celebratory; uses surface-emerald-frosted (per §8.18 spec)
//
// One emoji is allowed in `settled-up` per DESIGN.md (the only place we
// permit one in the app).

type CtaButton = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type Props = {
  icon: LucideIcon;
  heading: string;
  body?: string;
  cta?: CtaButton;
  variant?: "default" | "no-results" | "settled-up";
  className?: string;
};

export function EmptyState({
  icon: Icon,
  heading,
  body,
  cta,
  variant = "default",
  className,
}: Props) {
  const isSettled = variant === "settled-up";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl px-6 py-12 text-center",
        isSettled ? "surface-emerald-frosted" : "bg-transparent",
        className,
      )}
    >
      <Icon
        aria-hidden
        strokeWidth={1.75}
        className={cn(
          "size-12",
          isSettled ? "text-emerald-500 dark:text-emerald-400" : "text-muted-foreground",
        )}
      />
      <div className="flex max-w-sm flex-col gap-2">
        <h3 className="font-semibold text-foreground text-xl tracking-tight">{heading}</h3>
        {body ? <p className="text-muted-foreground text-sm leading-relaxed">{body}</p> : null}
      </div>
      {cta ? (
        cta.href ? (
          <Button render={<Link href={cta.href}>{cta.label}</Link>} />
        ) : (
          <Button onClick={cta.onClick}>{cta.label}</Button>
        )
      ) : null}
    </div>
  );
}
