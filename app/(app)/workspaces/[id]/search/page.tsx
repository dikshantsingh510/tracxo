import { AuthCard } from "@/components/auth/auth-card";
import { requireSession } from "@/lib/auth/server";
import { formatMoney } from "@/lib/money";
import { listCategories } from "@/lib/queries/categories";
import { getWorkspaceMembers } from "@/lib/queries/members";
import { searchExpenses } from "@/lib/queries/search";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import { searchFiltersSchema } from "@/lib/validation/search";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchForm } from "./search-form";

export const metadata = { title: "Search · Tracxo" };

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const session = await requireSession(`/workspaces/${id}/search`);
  const workspace = await getWorkspaceById(id, session.user.id);
  if (!workspace) notFound();

  const raw = await searchParams;
  const parsed = searchFiltersSchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : "",
    categoryId: typeof raw.categoryId === "string" ? raw.categoryId : "",
    payerId: typeof raw.payerId === "string" ? raw.payerId : "",
    from: typeof raw.from === "string" ? raw.from : "",
    to: typeof raw.to === "string" ? raw.to : "",
    page: typeof raw.page === "string" ? raw.page : "1",
    pageSize: "25",
  });
  // Invalid filters → fall back to an empty default rather than 400ing the
  // page; users can keep refining without losing their session.
  const filters = parsed.success
    ? parsed.data
    : searchFiltersSchema.parse({ page: "1", pageSize: "25" });

  const [{ rows, total }, members, categories] = await Promise.all([
    searchExpenses(workspace.id, filters),
    getWorkspaceMembers(workspace.id),
    listCategories(workspace.id),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link
        href={`/workspaces/${workspace.id}/settings`}
        className="inline-flex items-center text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
      >
        ← Workspace settings
      </Link>
      <AuthCard title="Search expenses" description={`${total} match${total === 1 ? "" : "es"}`}>
        <SearchForm
          workspaceId={workspace.id}
          filters={filters}
          members={members.map((m) => ({ userId: m.userId, name: m.name }))}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />

        {rows.length === 0 ? (
          <p className="mt-4 text-slate-600 text-sm dark:text-slate-400">
            No expenses match these filters.
          </p>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {rows.map((r) => (
                <li key={r.id} className="py-3">
                  <Link
                    href={`/workspaces/${workspace.id}/expenses/${r.id}`}
                    className="block hover:opacity-90"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 truncate font-medium text-slate-900 text-sm dark:text-slate-50">
                          {r.description}
                          {r.categoryName && (
                            <span
                              className="rounded-full px-1.5 py-0.5 font-normal text-[10px]"
                              style={
                                r.categoryColor
                                  ? {
                                      backgroundColor: `${r.categoryColor}1a`,
                                      color: r.categoryColor,
                                    }
                                  : undefined
                              }
                            >
                              {r.categoryName}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-slate-500 text-xs dark:text-slate-400">
                          {r.payerName} paid · {r.expenseDate}
                        </div>
                      </div>
                      <div className="shrink-0 font-semibold text-emerald-700 text-sm dark:text-emerald-400">
                        {formatMoney(r.amount, r.currency)}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <Pagination workspaceId={workspace.id} filters={filters} totalPages={totalPages} />
            )}
          </>
        )}
      </AuthCard>
    </div>
  );
}

function Pagination({
  workspaceId,
  filters,
  totalPages,
}: {
  workspaceId: string;
  filters: {
    q?: string;
    categoryId?: string;
    payerId?: string;
    from?: string;
    to?: string;
    page: number;
  };
  totalPages: number;
}) {
  function pageHref(p: number): string {
    const sp = new URLSearchParams();
    if (filters.q) sp.set("q", filters.q);
    if (filters.categoryId) sp.set("categoryId", filters.categoryId);
    if (filters.payerId) sp.set("payerId", filters.payerId);
    if (filters.from) sp.set("from", filters.from);
    if (filters.to) sp.set("to", filters.to);
    sp.set("page", String(p));
    return `/workspaces/${workspaceId}/search?${sp.toString()}`;
  }
  const prev = Math.max(1, filters.page - 1);
  const next = Math.min(totalPages, filters.page + 1);
  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <Link
        href={pageHref(prev)}
        className={
          filters.page <= 1
            ? "pointer-events-none text-slate-400"
            : "text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
        }
        aria-disabled={filters.page <= 1}
      >
        ← Prev
      </Link>
      <span className="text-slate-500 dark:text-slate-400">
        Page {filters.page} / {totalPages}
      </span>
      <Link
        href={pageHref(next)}
        className={
          filters.page >= totalPages
            ? "pointer-events-none text-slate-400"
            : "text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
        }
        aria-disabled={filters.page >= totalPages}
      >
        Next →
      </Link>
    </div>
  );
}
