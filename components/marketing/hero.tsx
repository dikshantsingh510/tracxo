import { AnimatedMeshBg } from "@/components/marketing/animated-mesh-bg";
import { MagneticButton } from "@/components/marketing/magnetic-button";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { Button } from "@/components/ui/button";

// Hero — DESIGN.md §B2.2.
// 60/40 split desktop, stacked on mobile. CSS-only mesh background (no image)
// keeps LCP under target. Headline is the LCP element.

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-6 pt-32 pb-24 sm:px-8">
      <AnimatedMeshBg />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
        {/* Left: copy + CTA */}
        <div className="stagger flex flex-col items-start gap-6 text-left">
          <span className="surface-emerald-frosted inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium text-emerald-700 text-xs dark:text-emerald-300">
            ✨ Now with UPI deep-link checkout
          </span>
          <h1 className="font-semibold text-5xl text-foreground tracking-[-0.03em] sm:text-6xl lg:text-[64px] lg:leading-[1.05]">
            Split expenses without the awkward{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              &ldquo;you still owe me ₹420&rdquo;
            </span>{" "}
            texts.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
            Tracxo is the calm, frosted, debt-simplifying expense tracker for groups of friends,
            flatmates, and travel crews.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <MagneticButton href="/signup" size="lg">
              Get started — it&rsquo;s free
            </MagneticButton>
            <Button
              variant="ghost"
              size="lg"
              nativeButton={false}
              render={<a href="#how-it-works">See how it works</a>}
            />
          </div>
          <p className="text-muted-foreground text-sm">
            Free forever for groups under 10. No card required.
          </p>
        </div>
        {/* Right: product mockup */}
        <div className="flex justify-center lg:justify-end">
          <ProductMockup />
        </div>
      </div>
    </section>
  );
}
