import { type FeedbackStatus, listFeedback } from "@/lib/queries/feedback";
import type { Metadata } from "next";
import Link from "next/link";
import { FeedbackStatusSelect } from "./feedback-status-select";

export const metadata: Metadata = { title: "Master · Feedback" };

const STATUSES: FeedbackStatus[] = ["new", "triaged", "resolved", "wont_fix"];
const TYPE_BADGE: Record<string, string> = {
  bug: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  idea: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  general: "bg-slate-200/60 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300",
  praise: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-semibold text-2xl tracking-tight">
          Feedback{" "}
          <span className="text-slate-500 text-sm dark:text-slate-400">({rows.length})</span>
        </h1>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/master/feedback"
            className={`rounded-md px-2 py-1 ${!filter ? "bg-slate-200/60 dark:bg-slate-800/60" : "hover:bg-slate-100 dark:hover:bg-slate-900"}`}
          >
            All
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/master/feedback?status=${s}`}
              className={`rounded-md px-2 py-1 capitalize ${filter === s ? "bg-slate-200/60 dark:bg-slate-800/60" : "hover:bg-slate-100 dark:hover:bg-slate-900"}`}
            >
              {s.replace("_", " ")}
            </Link>
          ))}
        </nav>
      </div>

      {rows.length === 0 ? (
        <p className="surface-acrylic-light rounded-xl p-6 text-slate-600 text-sm dark:text-slate-400">
          No feedback{filter ? ` with status “${filter}”` : ""} yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="surface-acrylic-light rounded-xl p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium capitalize ${TYPE_BADGE[r.type] ?? ""}`}
                >
                  {r.type}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {r.submitterName ?? "Removed user"}
                  {r.submitterEmail ? ` · ${r.submitterEmail}` : ""}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 16)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-slate-900 text-sm dark:text-slate-50">
                {r.message}
              </p>
              {(r.pageUrl || r.userAgent) && (
                <div className="mt-2 space-y-0.5 text-slate-500 text-xs dark:text-slate-400">
                  {r.pageUrl && <div>page: {r.pageUrl}</div>}
                  {r.userAgent && <div className="truncate">ua: {r.userAgent}</div>}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-2">
                <FeedbackStatusSelect id={r.id} status={r.status} />
                {r.resolvedAt && (
                  <span className="text-slate-500 text-xs dark:text-slate-400">
                    closed {new Date(r.resolvedAt).toISOString().slice(0, 10)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
