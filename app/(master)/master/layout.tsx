import { requireMaster } from "@/lib/auth/server";
import { countNewFeedback } from "@/lib/queries/feedback";
import Link from "next/link";

// Re-verifies the master role in the layout. requireMaster() throws 404 for
// anyone without it so the panel stays undiscoverable. proxy.ts only checks
// session presence — actual role gating lives here per docs/CLAUDE.md.
export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const session = await requireMaster();
  const newFeedback = await countNewFeedback();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="border-amber-500/40 border-b bg-amber-50/60 dark:border-amber-700/40 dark:bg-amber-950/30">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-amber-600 px-2 py-0.5 font-semibold text-white text-xs uppercase tracking-wider">
              Master
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              Signed in as <strong>{session.user.email}</strong>
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/master" className="hover:underline">
              Stats
            </Link>
            <Link href="/master/users" className="hover:underline">
              Users
            </Link>
            <Link href="/master/workspaces" className="hover:underline">
              Workspaces
            </Link>
            <Link
              href="/master/feedback"
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              Feedback
              {newFeedback > 0 && (
                <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 font-semibold text-[10px] text-white">
                  {newFeedback > 9 ? "9+" : newFeedback}
                </span>
              )}
            </Link>
            <Link href="/master/audit" className="hover:underline">
              Audit
            </Link>
            <Link
              href="/workspaces"
              className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              ← Exit
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-6 py-8">{children}</div>
    </main>
  );
}
