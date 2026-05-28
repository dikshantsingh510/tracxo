import { Quote } from "lucide-react";

import { SectionReveal } from "@/components/marketing/section-reveal";

// Placeholder quotes for v1. Swap for real customer quotes when available.

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  initial: string;
};

const QUOTES: Testimonial[] = [
  {
    quote:
      "We stopped maintaining the cursed Google Sheet the day we moved to Tracxo. Worth it just for that.",
    author: "Riya Mehta",
    role: "Co-living in Bengaluru",
    initial: "R",
  },
  {
    quote:
      "The settle-up flow is the cleanest UPI integration I've used. One tap, the right amount, done.",
    author: "Arjun Kapoor",
    role: "Trip lead, Goa wedding",
    initial: "A",
  },
  {
    quote: "Built it into our team retreat planning. The frosted look is bonus — feels expensive.",
    author: "Lukas Weber",
    role: "Engineering manager, Berlin",
    initial: "L",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8">
      <SectionReveal className="mx-auto mb-12 max-w-2xl text-center">
        <p className="font-medium text-emerald-700 text-xs uppercase tracking-[0.18em] dark:text-emerald-400">
          Loved by
        </p>
        <h2 className="mt-2 font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
          People who hate spreadsheets.
        </h2>
      </SectionReveal>
      <ul className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
        {QUOTES.map((t, i) => (
          <li key={t.author} className="min-w-[85%] snap-center sm:min-w-0">
            <SectionReveal delay={0.06 * i}>
              <article className="surface-acrylic-light hover:-translate-y-0.5 flex h-full flex-col gap-5 rounded-2xl p-6 transition-transform sm:p-7">
                <Quote
                  aria-hidden
                  className="size-8 text-muted-foreground opacity-30"
                  strokeWidth={1.5}
                />
                <p className="text-foreground text-lg leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-auto flex items-center gap-3 border-border border-t pt-4">
                  <span className="grid size-8 place-items-center rounded-full bg-emerald-100 font-semibold text-emerald-700 text-sm dark:bg-emerald-900/40 dark:text-emerald-300">
                    {t.initial}
                  </span>
                  <div>
                    <p className="font-medium text-foreground text-sm">{t.author}</p>
                    <p className="text-muted-foreground text-xs">{t.role}</p>
                  </div>
                </div>
              </article>
            </SectionReveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
