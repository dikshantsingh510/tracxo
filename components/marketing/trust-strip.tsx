// Lightweight social-proof band. Pure CSS marquee, no JS. Real customer
// logos drop in for v2 — until then, evocative group names.

const NAMES = [
  "Bengaluru flatmates",
  "Lisbon dev crew",
  "Bali trip 2026",
  "Kerala road trip",
  "Goa wedding",
  "Mumbai dinner club",
  "Tokyo summer crew",
  "Berlin co-living",
];

export function TrustStrip() {
  return (
    <section
      aria-label="Used by groups around the world"
      className="border-border border-y bg-background/60 py-8"
    >
      <p className="mb-4 text-center font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]">
        Used by groups in 12 countries — Q1 2026
      </p>
      <div className="marquee-pause group relative overflow-hidden">
        {/* Edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div className="flex w-max items-center gap-12 animate-marquee whitespace-nowrap text-muted-foreground text-sm">
          {/* Doubled so the loop is seamless at -50% translate */}
          {[...NAMES, ...NAMES].map((n, i) => (
            <span key={`${n}-${i}`} className="font-medium tracking-tight">
              · {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
