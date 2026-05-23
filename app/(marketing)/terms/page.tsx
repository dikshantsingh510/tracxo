import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms · Tracxo" };

// Placeholder. Real terms land once we finalize the data-handling story
// with legal — see TODO in docs/PRODUCT.md.
export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="font-semibold text-3xl tracking-tight">Terms of Service</h1>
      <p className="text-slate-600 dark:text-slate-300">Last updated: pending legal review.</p>

      <h2 className="font-medium text-xl">What Tracxo does</h2>
      <p className="text-slate-700 dark:text-slate-300">
        Tracxo helps small groups of people track shared expenses and simplify who owes whom. We do
        not custody money. UPI settlement is between you and your bank.
      </p>

      <h2 className="font-medium text-xl">Your responsibilities</h2>
      <ul className="ml-6 list-disc text-slate-700 dark:text-slate-300">
        <li>Provide accurate amounts and only invite people you trust.</li>
        <li>Keep your account credentials private.</li>
        <li>Honor any settlements you confirm inside the app.</li>
      </ul>

      <h2 className="font-medium text-xl">Liability</h2>
      <p className="text-slate-700 dark:text-slate-300">
        Tracxo is provided as-is during the early-access period. We compute balances from the data
        you and your workspace members enter; verifying those entries is your responsibility. We
        disclaim liability for any disputes between workspace members.
      </p>

      <p className="text-slate-500 text-sm dark:text-slate-400">
        Questions? Email{" "}
        <a href="mailto:hello@tracxo.app" className="underline">
          hello@tracxo.app
        </a>
        .
      </p>
    </article>
  );
}
