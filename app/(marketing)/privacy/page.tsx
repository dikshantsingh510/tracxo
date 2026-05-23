import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy · Tracxo" };

// Placeholder. Real policy lands once we finalize the data-handling story
// with legal — see TODO in docs/PRODUCT.md.
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-6 py-12 prose prose-slate dark:prose-invert">
      <h1 className="font-semibold text-3xl tracking-tight">Privacy</h1>
      <p className="text-slate-600 dark:text-slate-300">Last updated: pending legal review.</p>

      <h2 className="font-medium text-xl">What we collect</h2>
      <p className="text-slate-700 dark:text-slate-300">
        Your account email, the expenses you record, the workspaces you belong to, and the activity
        log of mutations within those workspaces. We do not collect bank account or card details —
        UPI settlement uses your installed UPI app.
      </p>

      <h2 className="font-medium text-xl">What we share</h2>
      <p className="text-slate-700 dark:text-slate-300">
        Nothing with third parties for marketing. Workspace data is visible only to its members.
        Email transport uses Resend; database hosting uses Neon.
      </p>

      <h2 className="font-medium text-xl">Your controls</h2>
      <p className="text-slate-700 dark:text-slate-300">
        You can leave any workspace, delete a team workspace you own, or close your account. Account
        closure anonymizes your display name in historical activity but retains aggregate ledger
        entries so balances stay consistent for the others in the workspace.
      </p>

      <p className="text-slate-500 text-sm dark:text-slate-400">
        Contact{" "}
        <a href="mailto:hello@tracxo.app" className="underline">
          hello@tracxo.app
        </a>{" "}
        for any privacy questions.
      </p>
    </article>
  );
}
