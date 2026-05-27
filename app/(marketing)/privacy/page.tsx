import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy · Tracxo" };

// Placeholder. Real policy lands once we finalize the data-handling story
// with legal — see TODO in docs/PRODUCT.md.
export default function PrivacyPage() {
  return (
    <article className="surface-acrylic-light mx-auto my-32 max-w-2xl space-y-8 rounded-2xl px-8 py-12 sm:px-12">
      <header className="border-border border-b pb-6">
        <h1 className="font-semibold text-4xl text-foreground tracking-[-0.02em]">Privacy</h1>
        <p className="mt-2 text-muted-foreground text-sm">Last updated: pending legal review.</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-semibold text-foreground text-xl tracking-tight">What we collect</h2>
        <p className="text-base text-foreground leading-relaxed">
          Your account email, the expenses you record, the workspaces you belong to, and the
          activity log of mutations within those workspaces. We do not collect bank account or card
          details — UPI settlement uses your installed UPI app.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-foreground text-xl tracking-tight">What we share</h2>
        <p className="text-base text-foreground leading-relaxed">
          Nothing with third parties for marketing. Workspace data is visible only to its members.
          Email transport uses Resend; database hosting uses Neon.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-foreground text-xl tracking-tight">Your controls</h2>
        <p className="text-base text-foreground leading-relaxed">
          You can leave any workspace, delete a team workspace you own, or close your account.
          Account closure anonymizes your display name in historical activity but retains aggregate
          ledger entries so balances stay consistent for the others in the workspace.
        </p>
      </section>

      <p className="text-muted-foreground text-sm">
        Contact{" "}
        <a
          href="mailto:hello@tracxo.app"
          className="text-foreground underline underline-offset-4 hover:text-emerald-700 dark:hover:text-emerald-400"
        >
          hello@tracxo.app
        </a>{" "}
        for any privacy questions.
      </p>
    </article>
  );
}
