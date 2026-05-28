import { Code2 } from "lucide-react";
import Link from "next/link";

// Multi-column footer, DESIGN.md §B2.11.
// 4 columns on desktop / 2 on tablet / single stack on mobile.

type Column = {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
};

const COLUMNS: Column[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "#" },
      { label: "API", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Help Center", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookies", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="surface-acrylic-light mt-12 border-border border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="font-semibold text-2xl text-foreground tracking-tight">
              Tracxo
            </Link>
            <p className="mt-3 max-w-xs text-muted-foreground text-sm">
              The calm, frosted expense tracker for groups.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3">
              <h3 className="font-medium text-foreground text-sm">{col.title}</h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-border border-t pt-6 sm:flex-row sm:items-center">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Tracxo. Made with care.
          </p>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/dikshantsingh510/tracxo"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="GitHub"
            >
              <Code2 className="size-4" strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </div>

      {/* Decorative wordmark — Vercel/Linear pattern. Tightly tracked, edge-bleed.
          Uses gradient mask so it fades at the top, anchored to the bottom edge. */}
      <div aria-hidden className="-mb-2 sm:-mb-4 relative overflow-hidden px-2 pt-4 sm:px-4">
        <p className="select-none bg-gradient-to-b from-foreground/[0.10] to-foreground/[0.02] bg-clip-text text-center font-bold text-[clamp(4rem,18vw,16rem)] text-transparent leading-[0.85] tracking-[-0.06em] dark:from-foreground/[0.12] dark:to-foreground/[0.02]">
          Tracxo
        </p>
      </div>
    </footer>
  );
}
