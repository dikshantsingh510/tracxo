import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { formatMoney } from "@/lib/money";
import { listSettlements } from "@/lib/queries/settlements";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Settlements · Tracxo" };

const METHOD_LABEL: Record<string, string> = {
  upi: "UPI",
  cash: "Cash",
  bank_transfer: "Bank transfer",
  other: "Other",
};

export default async function SettlementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/settlements`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const rows = await listSettlements(workspace.id);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/balances`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Balances
      </Link>

      <AuthCard
        title={`${workspace.name} · settlements`}
        description={`${rows.length} settlement${rows.length === 1 ? "" : "s"}`}
        footer={
          <Link
            href={`/workspaces/${workspace.id}/settlements/new`}
            className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            + Record settlement
          </Link>
        }
      >
        {rows.length === 0 ? (
          <p className="text-slate-600 text-sm dark:text-slate-400">
            No settlements yet. Record one from a suggested transfer on the balances page.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {rows.map((s) => (
              <li key={s.id} className="py-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-slate-900 dark:text-slate-50">
                      <span className="font-medium">{s.fromName}</span>
                      <span className="mx-2 text-slate-500 dark:text-slate-400">→</span>
                      <span className="font-medium">{s.toName}</span>
                    </div>
                    <div className="truncate text-slate-500 text-xs dark:text-slate-400">
                      {new Date(s.settledAt).toISOString().slice(0, 10)} ·{" "}
                      {METHOD_LABEL[s.method] ?? s.method}
                      {s.note ? ` · ${s.note}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatMoney(s.amount, s.currency)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AuthCard>
    </div>
  );
}
