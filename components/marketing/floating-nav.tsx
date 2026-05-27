"use client";

import { Menu, X } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { MagneticButton } from "@/components/marketing/magnetic-button";
import { Button } from "@/components/ui/button";
import { MobileDrawer } from "@/components/ui/mobile-drawer";
import { cn } from "@/lib/utils";

// DESIGN.md §B2.1 — floating pill nav that shrinks on scroll past 100px.
// Acrylic-heavy surface, radius-full, centered, z-sticky.

type NavLink = { href: string; label: string };

const LINKS: NavLink[] = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function FloatingNav() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  // Width shrinks from 100% → 88% in the first 100px of scroll
  const widthPct = useTransform(scrollY, [0, 100], ["100%", "88%"]);
  const py = useTransform(scrollY, [0, 100], [12, 8]);
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        style={
          reduce
            ? undefined
            : {
                width: widthPct,
                paddingTop: py,
                paddingBottom: py,
              }
        }
        className={cn(
          "-translate-x-1/2 surface-acrylic-heavy fixed top-4 left-1/2 z-[var(--z-sticky)] max-w-3xl rounded-full px-2 sm:px-3",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="rounded-full px-3 font-semibold text-foreground tracking-tight focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-2"
          >
            Tracxo
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {LINKS.map((l) => (
              <Button
                key={l.href}
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<a href={l.href}>{l.label}</a>}
              />
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              className="hidden sm:inline-flex"
              render={<Link href="/login">Sign in</Link>}
            />
            <MagneticButton href="/signup" size="sm" className="hidden sm:inline-flex">
              <span className="flex items-center gap-1.5">
                Open app
                <kbd className="hidden rounded border border-white/20 bg-white/10 px-1 font-mono text-[10px] text-white/70 md:inline">
                  ⌘K
                </kbd>
              </span>
            </MagneticButton>
            <Button
              variant="ghost"
              size="icon-sm"
              className="sm:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-4" strokeWidth={2} />
            </Button>
          </div>
        </div>
      </motion.div>

      <MobileDrawer open={open} onOpenChange={setOpen} title="Menu">
        <nav className="flex flex-col gap-1.5">
          {LINKS.map((l) => (
            <Button
              key={l.href}
              variant="ghost"
              size="lg"
              nativeButton={false}
              className="h-12 justify-start rounded-2xl px-4 text-base"
              render={
                <a href={l.href} onClick={() => setOpen(false)}>
                  {l.label}
                </a>
              }
            />
          ))}
          <hr className="my-2 border-border" />
          <Button
            variant="outline"
            size="lg"
            nativeButton={false}
            className="h-12 rounded-2xl text-base"
            render={
              <Link href="/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            }
          />
          <Button
            size="lg"
            nativeButton={false}
            className="h-12 rounded-2xl text-base"
            render={
              <Link href="/signup" onClick={() => setOpen(false)}>
                Open app
              </Link>
            }
          />
        </nav>
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3 rounded-full"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="size-4" strokeWidth={2} />
        </Button>
      </MobileDrawer>
    </>
  );
}
