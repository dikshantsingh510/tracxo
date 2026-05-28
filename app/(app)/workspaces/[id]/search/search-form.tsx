import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SearchFilters } from "@/lib/validation/search";

// Plain HTML form — submits via GET so the URL becomes the canonical state.
// Server reads the new searchParams on the next render. Select syncs a hidden
// named input, so the GET submit carries the choice without client wiring.

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
        <Select name="categoryId" defaultValue={filters.categoryId ?? ""}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Paid by">
        <Select name="payerId" defaultValue={filters.payerId ?? ""}>
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      <Label className="text-neutral-700 text-xs dark:text-neutral-300">{label}</Label>
      {children}
    </div>
  );
}
