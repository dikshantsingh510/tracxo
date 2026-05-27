import { ArrowRight, Handshake, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { requireSession } from "@/lib/auth/server";
import { listSettlements } from "@/lib/queries/settlements";
import { getWorkspaceById } from "@/lib/queries/workspaces";

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
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">Settlements</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {rows.length} settlement{rows.length === 1 ? "" : "s"} in {workspace.name}
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href={`/workspaces/${workspace.id}/settlements/new`}>
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              Record settlement
            </Link>
          }
        />
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={Handshake}
          heading="No settlements yet"
          body="Record one from a suggested transfer on the balances page."
          cta={{
            label: "Open balances",
            href: `/workspaces/${workspace.id}/balances`,
          }}
        />
      ) : (
        <ul className="surface-acrylic-light divide-y divide-border overflow-hidden rounded-2xl">
          {rows.map((s) => (
            <li key={s.id} className="hover-tint px-5 py-4">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-foreground text-sm">
                    <span className="font-semibold">{s.fromName}</span>
                    <ArrowRight
                      className="size-3.5 text-muted-foreground"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span className="font-semibold">{s.toName}</span>
                  </div>
                  <div className="mt-0.5 truncate text-muted-foreground text-xs">
                    {new Date(s.settledAt).toISOString().slice(0, 10)} ·{" "}
                    {METHOD_LABEL[s.method] ?? s.method}
                    {s.note ? ` · ${s.note}` : ""}
                  </div>
                </div>
                <Money
                  amount={s.amount}
                  currency={s.currency}
                  tone="success"
                  className="shrink-0 font-semibold text-sm"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
