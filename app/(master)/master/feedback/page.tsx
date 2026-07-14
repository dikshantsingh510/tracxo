import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatDateTime } from "@/lib/dates";
import { type FeedbackStatus, type FeedbackType, listFeedback } from "@/lib/queries/feedback";
import { cn } from "@/lib/utils";
import { FeedbackStatusSelect } from "./feedback-status-select";

export const metadata: Metadata = { title: "Master · Feedback" };

const STATUSES: FeedbackStatus[] = ["new", "triaged", "resolved", "wont_fix"];

const TYPE_VARIANT: Record<FeedbackType, "danger" | "info" | "neutral" | "success"> = {
  bug: "danger",
  idea: "info",
  general: "neutral",
  praise: "success",
};

export default async function MasterFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter =
    status && (STATUSES as string[]).includes(status) ? (status as FeedbackStatus) : undefined;
  const rows = await listFeedback({ status: filter });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">
            Feedback{" "}
            <span className="font-normal text-lg text-muted-foreground">({rows.length})</span>
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            User-submitted bugs, ideas, and notes.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-1.5">
          <FilterPill href="/master/feedback" active={!filter} label="All" />
          {STATUSES.map((s) => (
            <FilterPill
              key={s}
              href={`/master/feedback?status=${s}`}
              active={filter === s}
              label={s.replace("_", " ")}
            />
          ))}
        </nav>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          variant="no-results"
          heading={filter ? `No “${filter.replace("_", " ")}” feedback` : "No feedback yet"}
          body={
            filter
              ? "Try a different status filter."
              : "User feedback submitted from the app will appear here."
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="surface-acrylic-light rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant={TYPE_VARIANT[r.type]} size="xs" className="capitalize">
                  {r.type}
                </Badge>
                <span className="text-muted-foreground">
                  {r.submitterName ?? "Removed user"}
                  {r.submitterEmail ? ` · ${r.submitterEmail}` : ""}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span className="text-muted-foreground">{formatDateTime(r.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-foreground text-sm">{r.message}</p>
              {r.pageUrl || r.userAgent ? (
                <div className="mt-2 space-y-0.5 text-muted-foreground text-xs">
                  {r.pageUrl ? <div className="truncate">page: {r.pageUrl}</div> : null}
                  {r.userAgent ? <div className="truncate">ua: {r.userAgent}</div> : null}
                </div>
              ) : null}
              <div className="mt-3 flex items-center justify-between gap-2 border-border border-t pt-3">
                <FeedbackStatusSelect id={r.id} status={r.status} />
                {r.resolvedAt ? (
                  <span className="text-muted-foreground text-xs">
                    closed {formatDate(r.resolvedAt)}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1 font-medium text-sm capitalize transition-colors",
        active
          ? "bg-emerald-600 text-white dark:bg-emerald-500"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
