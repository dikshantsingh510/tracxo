import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { formatMoney } from "@/lib/money";
import { listRecurring } from "@/lib/queries/recurring";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import { humanizeRRule } from "@/lib/recurring/rrule";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RecurringActions } from "./recurring-actions";

export const metadata = { title: "Recurring · Tracxo" };

export default async function RecurringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/recurring`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const rows = await listRecurring(workspace.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/settings`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Workspace settings
      </Link>
      <AuthCard
        title="Recurring expenses"
        description={`${rows.length} template${rows.length === 1 ? "" : "s"}`}
        footer={
          <Link
            href={`/workspaces/${workspace.id}/recurring/new`}
            className="text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
          >
            + New recurring expense
          </Link>
        }
      >
        {rows.length === 0 ? (
          <p className="text-slate-600 text-sm dark:text-slate-400">
            No templates yet. A recurring expense generates a fresh expense automatically on its
            schedule.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {rows.map((r) => (
              <li key={r.id} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900 text-sm dark:text-slate-50">
                      {r.description}
                      {!r.active && (
                        <span className="ml-2 rounded bg-slate-200/60 px-1.5 py-0.5 font-normal text-slate-600 text-xs dark:bg-slate-800/60 dark:text-slate-400">
                          paused
                        </span>
                      )}
                    </div>
                    <div className="truncate text-slate-500 text-xs dark:text-slate-400">
                      {humanizeRRule(r.rrule)} · {r.payerName} pays
                    </div>
                    <div className="truncate text-slate-500 text-xs dark:text-slate-400">
                      next: {new Date(r.nextRunAt).toISOString().slice(0, 10)}
                      {r.lastRunAt &&
                        ` · last: ${new Date(r.lastRunAt).toISOString().slice(0, 10)}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="shrink-0 font-semibold text-emerald-700 text-sm dark:text-emerald-400">
                      {formatMoney(r.amount, r.currency)}
                    </div>
                    <RecurringActions id={r.id} workspaceId={workspace.id} active={r.active} />
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
