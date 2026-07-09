"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  /** Next.js error-boundary reset — re-renders the failed segment. */
  reset?: () => void;
  homeHref?: string;
  className?: string;
};

// Shared body for the route-group error.tsx boundaries. Mirrors the
// EmptyState layout (§8.18) but on a tier-2 acrylic card so a crashed
// segment still reads as part of the app instead of a bare stack trace.
export function ErrorView({ title, description, reset, homeHref = "/", className }: Props) {
  return (
    <div className={cn("flex flex-1 items-center justify-center p-6", className)}>
      <div className="surface-acrylic-light flex max-w-md flex-col items-center gap-4 rounded-2xl px-8 py-12 text-center">
        <CircleAlert aria-hidden strokeWidth={1.75} className="size-12 text-destructive" />
        <div className="flex max-w-sm flex-col gap-2">
          <h1 className="font-semibold text-foreground text-xl tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {reset ? <Button onClick={reset}>Try again</Button> : null}
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={homeHref}>Go home</Link>}
          />
        </div>
      </div>
    </div>
  );
}
