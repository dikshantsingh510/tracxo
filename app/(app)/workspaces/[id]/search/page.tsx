import { ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Chip } from "@/components/ui/filter-chips";
import { Money } from "@/components/ui/money";
import { requireSession } from "@/lib/auth/server";
import { listCategories } from "@/lib/queries/categories";
import { getWorkspaceMembers } from "@/lib/queries/members";
import { searchExpenses } from "@/lib/queries/search";
import { getWorkspaceById } from "@/lib/queries/workspaces";
import { searchFiltersSchema } from "@/lib/validation/search";
import { SearchForm } from "./search-form";

export const metadata = { title: "Search · Tracxo" };

function buildHref(
  workspaceId: string,
  filters: {
    q?: string;
    categoryId?: string;
    payerId?: string;
    from?: string;
    to?: string;
  },
  page?: number,
  remove?: string,
): string {
  const sp = new URLSearchParams();
  const keys: (keyof typeof filters)[] = ["q", "categoryId", "payerId", "from", "to"];
  for (const k of keys) {
    if (k === remove) continue;
    const v = filters[k];
    if (v) sp.set(k, v);
  }
  if (page && page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return `/workspaces/${workspaceId}/search${qs ? `?${qs}` : ""}`;
}

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
  const filters = parsed.success
    ? parsed.data
    : searchFiltersSchema.parse({ page: "1", pageSize: "25" });

  const [{ rows, total }, members, categories] = await Promise.all([
    searchExpenses(workspace.id, filters),
    getWorkspaceMembers(workspace.id),
    listCategories(workspace.id),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  // Build dismissible chips for active filters
  const chips: Chip[] = [];
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”` });
  if (filters.categoryId) {
    const cat = categories.find((c) => c.id === filters.categoryId);
    chips.push({ key: "categoryId", label: `Category: ${cat?.name ?? filters.categoryId}` });
  }
  if (filters.payerId) {
    const m = members.find((p) => p.userId === filters.payerId);
    chips.push({ key: "payerId", label: `Paid by: ${m?.name ?? filters.payerId}` });
  }
  if (filters.from) chips.push({ key: "from", label: `From: ${filters.from}` });
  if (filters.to) chips.push({ key: "to", label: `To: ${filters.to}` });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-semibold text-3xl text-foreground tracking-[-0.02em]">Search</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {total} match{total === 1 ? "" : "es"} in {workspace.name}
        </p>
      </header>

      <section className="surface-acrylic-light rounded-2xl p-5">
        <SearchForm
          workspaceId={workspace.id}
          filters={filters}
          members={members.map((m) => ({ userId: m.userId, name: m.name }))}
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </section>

      <FilterChipsClient workspaceId={workspace.id} filters={filters} chips={chips} />

      {rows.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          heading="No results"
          body="Try adjusting your filters or clearing them entirely."
          cta={
            chips.length > 0
              ? { label: "Clear all filters", href: `/workspaces/${workspace.id}/search` }
              : undefined
          }
        />
      ) : (
        <ul className="surface-acrylic-light divide-y divide-border overflow-hidden rounded-2xl">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/workspaces/${workspace.id}/expenses/${r.id}`}
                className="hover-tint block px-5 py-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 truncate font-medium text-foreground">
                      <span className="truncate">{r.description}</span>
                      {r.categoryName ? (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 font-normal text-[10px]"
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
                      ) : null}
                    </div>
                    <div className="mt-0.5 truncate text-muted-foreground text-xs">
                      {r.payerName} paid · {r.expenseDate}
                    </div>
                  </div>
                  <Money
                    amount={r.amount}
                    currency={r.currency}
                    tone="plain"
                    className="shrink-0 font-semibold"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <Pagination workspaceId={workspace.id} filters={filters} totalPages={totalPages} />
      ) : null}
    </div>
  );
}

// Tiny client wrapper that turns chip-remove into a href navigation — keeps
// the page itself a Server Component.
function FilterChipsClient({
  workspaceId,
  filters,
  chips,
}: {
  workspaceId: string;
  filters: {
    q?: string;
    categoryId?: string;
    payerId?: string;
    from?: string;
    to?: string;
  };
  chips: Chip[];
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link
          key={c.key}
          href={buildHref(workspaceId, filters, undefined, c.key)}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-secondary px-3 text-secondary-foreground text-xs transition-colors hover:bg-muted"
          aria-label={`Remove filter: ${c.label}`}
        >
          {c.label}
          <span aria-hidden className="opacity-60">
            ×
          </span>
        </Link>
      ))}
      {chips.length > 1 ? (
        <Button
          variant="link"
          size="sm"
          nativeButton={false}
          render={<Link href={`/workspaces/${workspaceId}/search`}>Clear all</Link>}
        />
      ) : null}
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
  const prev = Math.max(1, filters.page - 1);
  const next = Math.min(totalPages, filters.page + 1);
  const prevDisabled = filters.page <= 1;
  const nextDisabled = filters.page >= totalPages;
  return (
    <div className="flex items-center justify-between text-sm">
      {prevDisabled ? (
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft className="size-3.5" strokeWidth={2} />
          Prev
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link href={buildHref(workspaceId, filters, prev)}>
              <ChevronLeft className="size-3.5" strokeWidth={2} />
              Prev
            </Link>
          }
        />
      )}
      <span className="text-muted-foreground">
        Page {filters.page} / {totalPages}
      </span>
      {nextDisabled ? (
        <Button variant="outline" size="sm" disabled>
          Next
          <ChevronRight className="size-3.5" strokeWidth={2} />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link href={buildHref(workspaceId, filters, next)}>
              Next
              <ChevronRight className="size-3.5" strokeWidth={2} />
            </Link>
          }
        />
      )}
    </div>
  );
}
