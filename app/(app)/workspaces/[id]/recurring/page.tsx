import { Plus, Repeat2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { requireSession } from "@/lib/auth/server";
import { formatDate } from "@/lib/dates";
import { listRecurring } from "@/lib/queries/recurring";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import { humanizeRRule } from "@/lib/recurring/rrule";
import { RecurringActions } from "./recurring-actions";

export const metadata = { title: "Recurring · Tracxo" };

export default async function RecurringPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/recurring`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const rows = await listRecurring(workspace.id);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">
            Recurring expenses
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {rows.length} template{rows.length === 1 ? "" : "s"} · each generates an expense
            automatically on its schedule.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href={`/workspaces/${workspace.id}/recurring/new`}>
              <Plus className="size-3.5" strokeWidth={2} aria-hidden />
              New
            </Link>
          }
        />
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={Repeat2}
          heading="No recurring expenses yet"
          body="Set up a template for rent, subscriptions, or any expense that repeats — Tracxo creates each one for you on schedule."
          cta={{
            label: "New recurring expense",
            href: `/workspaces/${workspace.id}/recurring/new`,
          }}
        />
      ) : (
        <ul className="surface-acrylic-light divide-y divide-border overflow-hidden rounded-2xl">
          {rows.map((r) => (
            <li key={r.id} className="hover-tint flex items-start justify-between gap-4 px-5 py-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-foreground text-sm">
                    {r.description}
                  </span>
                  {!r.active ? (
                    <Badge variant="neutral" size="xs">
                      Paused
                    </Badge>
                  ) : null}
                </div>
                <div className="truncate text-muted-foreground text-xs">
                  {humanizeRRule(r.rrule)} · {r.payerName} pays
                </div>
                <div className="truncate text-muted-foreground text-xs">
                  Next {formatDate(r.nextRunAt)}
                  {r.lastRunAt ? ` · last ${formatDate(r.lastRunAt)}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Money amount={r.amount} currency={r.currency} className="font-semibold text-sm" />
                <RecurringActions id={r.id} workspaceId={workspace.id} active={r.active} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
