import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SearchFilters } from "@/lib/validation/search";

// Plain HTML form — submits via GET so the URL becomes the canonical state.
// Server reads the new searchParams on the next render. No client JS needed.
const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function SearchForm({
  workspaceId,
  filters,
  members,
  categories,
}: {
  workspaceId: string;
  filters: SearchFilters;
  members: Array<{ userId: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <form
      method="GET"
      action={`/workspaces/${workspaceId}/search`}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <Field label="Search text" className="sm:col-span-2">
        <Input
          name="q"
          defaultValue={filters.q}
          placeholder="Description or notes"
          maxLength={120}
        />
      </Field>

      <Field label="Category">
        <select className={SELECT_CLASS} name="categoryId" defaultValue={filters.categoryId ?? ""}>
          <option value="">Any</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Paid by">
        <select className={SELECT_CLASS} name="payerId" defaultValue={filters.payerId ?? ""}>
          <option value="">Any</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="From">
        <Input name="from" type="date" defaultValue={filters.from} />
      </Field>

      <Field label="To">
        <Input name="to" type="date" defaultValue={filters.to} />
      </Field>

      <div className="flex items-end gap-2 sm:col-span-2">
        <Button type="submit">Apply</Button>
        <a
          href={`/workspaces/${workspaceId}/search`}
          className="text-emerald-700 text-sm underline-offset-4 hover:underline dark:text-emerald-400"
        >
          Reset
        </a>
      </div>
    </form>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`.trim()}>
      <Label className="text-slate-700 text-xs dark:text-slate-300">{label}</Label>
      {children}
    </div>
  );
}
