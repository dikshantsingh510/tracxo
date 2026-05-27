import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms · Tracxo" };

// Placeholder. Real terms land once we finalize the data-handling story
// with legal — see TODO in docs/PRODUCT.md.
export default function TermsPage() {
  return (
    <article className="surface-acrylic-light mx-auto my-32 max-w-2xl space-y-8 rounded-2xl px-8 py-12 sm:px-12">
      <header className="border-border border-b pb-6">
        <h1 className="font-semibold text-4xl text-foreground tracking-[-0.02em]">
          Terms of Service
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">Last updated: pending legal review.</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-semibold text-foreground text-xl tracking-tight">What Tracxo does</h2>
        <p className="text-base text-foreground leading-relaxed">
          Tracxo helps small groups of people track shared expenses and simplify who owes whom. We
          do not custody money. UPI settlement is between you and your bank.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-foreground text-xl tracking-tight">
          Your responsibilities
        </h2>
        <ul className="ml-5 list-disc space-y-1.5 text-base text-foreground leading-relaxed">
          <li>Provide accurate amounts and only invite people you trust.</li>
          <li>Keep your account credentials private.</li>
          <li>Honor any settlements you confirm inside the app.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-foreground text-xl tracking-tight">Liability</h2>
        <p className="text-base text-foreground leading-relaxed">
          Tracxo is provided as-is during the early-access period. We compute balances from the data
          you and your workspace members enter; verifying those entries is your responsibility. We
          disclaim liability for any disputes between workspace members.
        </p>
      </section>

      <p className="text-muted-foreground text-sm">
        Questions? Email{" "}
        <a
          href="mailto:hello@tracxo.app"
          className="text-foreground underline underline-offset-4 hover:text-emerald-700 dark:hover:text-emerald-400"
        >
          hello@tracxo.app
        </a>
        .
      </p>
    </article>
  );
}
