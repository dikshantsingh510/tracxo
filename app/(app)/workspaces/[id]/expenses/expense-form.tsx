"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createExpense, updateExpense } from "@/lib/actions/expenses";
import { currencyCodeEnum } from "@/lib/db/schema/auth";
import { minorToDecimalString, parseAmountMinor } from "@/lib/money";
import type { SplitInput } from "@/lib/validation/expense";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Member = { userId: string; name: string; email: string };
type Category = { id: string; name: string };
type Mode = "equal" | "unequal" | "percentage" | "share" | "itemized";

type Initial = {
  id: string;
  version: number;
  description: string;
  amount: bigint;
  currency: string;
  category: string;
  categoryId: string | null;
  notes: string;
  expenseDate: string;
  paidBy: string;
  splitMode: Mode;
  splits: Array<{ userId: string; shareAmount: bigint; rawInput: unknown }>;
};

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function ExpenseForm(
  props:
    | {
        mode: "create";
        workspaceId: string;
        workspaceCurrency: string;
        actorUserId: string;
        members: Member[];
        categories: Category[];
      }
    | {
        mode: "edit";
        workspaceId: string;
        workspaceCurrency: string;
        actorUserId: string;
        members: Member[];
        categories: Category[];
        initial: Initial;
      },
) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : null;

  const [description, setDescription] = useState(initial?.description ?? "");
  const [amountStr, setAmountStr] = useState(
    initial ? minorToDecimalString(initial.amount, initial.currency) : "",
  );
  const [currency, setCurrency] = useState(initial?.currency ?? props.workspaceCurrency);
  const [paidBy, setPaidBy] = useState(initial?.paidBy ?? props.actorUserId);
  const [expenseDate, setExpenseDate] = useState(
    initial?.expenseDate ?? new Date().toISOString().slice(0, 10),
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [splitMode, setSplitMode] = useState<Mode>(initial?.splitMode ?? "equal");

  // For `equal` mode — set of participating userIds.
  const [equalParticipants, setEqualParticipants] = useState<Set<string>>(() => {
    if (initial && initial.splitMode === "equal") {
      return new Set(initial.splits.map((s) => s.userId));
    }
    return new Set(props.members.map((m) => m.userId));
  });

  // For `unequal`, `percentage`, `share`, `itemized` modes — per-member input values.
  // Stored as strings to keep form ergonomics simple.
  const [rowValues, setRowValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (initial && initial.splitMode !== "equal") {
      for (const s of initial.splits) {
        if (initial.splitMode === "unequal" || initial.splitMode === "itemized") {
          map[s.userId] = minorToDecimalString(s.shareAmount, initial.currency);
        } else if (initial.splitMode === "percentage") {
          const raw = s.rawInput as { pct?: number };
          map[s.userId] = String(raw?.pct ?? 0);
        } else if (initial.splitMode === "share") {
          const raw = s.rawInput as { units?: number };
          map[s.userId] = String(raw?.units ?? 0);
        }
      }
    } else {
      for (const m of props.members) map[m.userId] = "";
    }
    return map;
  });

  const totalMinor = useMemo(() => parseAmountMinor(amountStr, currency), [amountStr, currency]);

  function buildSplit(): SplitInput | { error: string } {
    if (splitMode === "equal") {
      const ids = Array.from(equalParticipants);
      if (ids.length === 0) return { error: "Pick at least one participant" };
      return { mode: "equal", participantIds: ids };
    }

    if (splitMode === "unequal" || splitMode === "itemized") {
      const rows: Array<{ userId: string; amount: bigint; label?: string }> = [];
      for (const m of props.members) {
        const v = (rowValues[m.userId] || "").trim();
        if (!v || v === "0" || v === "0.00") continue;
        const minor = parseAmountMinor(v, currency);
        if (minor === null) return { error: `Invalid amount for ${m.name}` };
        rows.push({ userId: m.userId, amount: minor });
      }
      if (rows.length === 0) return { error: "Enter at least one amount" };
      return splitMode === "unequal"
        ? { mode: "unequal", rows: rows.map(({ userId, amount }) => ({ userId, amount })) }
        : { mode: "itemized", rows };
    }

    if (splitMode === "percentage") {
      const rows: Array<{ userId: string; pct: number }> = [];
      for (const m of props.members) {
        const v = (rowValues[m.userId] || "").trim();
        if (!v) continue;
        const pct = Number(v);
        if (!Number.isFinite(pct) || pct < 0) return { error: `Invalid percentage for ${m.name}` };
        rows.push({ userId: m.userId, pct });
      }
      if (rows.length === 0) return { error: "Enter percentages" };
      return { mode: "percentage", rows };
    }

    // share
    const rows: Array<{ userId: string; units: number }> = [];
    for (const m of props.members) {
      const v = (rowValues[m.userId] || "").trim();
      if (!v) continue;
      const units = Number(v);
      if (!Number.isInteger(units) || units < 0) return { error: `Invalid shares for ${m.name}` };
      rows.push({ userId: m.userId, units });
    }
    if (rows.length === 0) return { error: "Enter shares" };
    return { mode: "share", rows };
  }

  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return toast.error("Description is required");
    if (totalMinor === null || totalMinor <= 0n) {
      return toast.error("Enter a positive amount");
    }
    const split = buildSplit();
    if ("error" in split) return toast.error(split.error);

    setSubmitting(true);
    try {
      if (isEdit) {
        const initial = props.initial;
        await updateExpense({
          id: initial.id,
          workspaceId: props.workspaceId,
          version: initial.version,
          paidBy,
          amount: totalMinor,
          currency,
          description: description.trim(),
          category: "",
          categoryId: categoryId || undefined,
          notes,
          expenseDate,
          split,
        });
        toast.success("Expense updated");
        router.push(`/workspaces/${props.workspaceId}/expenses/${initial.id}`);
      } else {
        const { id } = await createExpense({
          workspaceId: props.workspaceId,
          paidBy,
          amount: totalMinor,
          currency,
          description: description.trim(),
          category: "",
          categoryId: categoryId || undefined,
          notes,
          expenseDate,
          split,
        });
        toast.success("Expense created");
        router.push(`/workspaces/${props.workspaceId}/expenses/${id}`);
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save expense");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Description">
        <Input
          autoFocus
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dinner at Bombil"
          maxLength={200}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount">
          <Input
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
          />
        </Field>
        <Field label="Currency">
          <select
            className={SELECT_CLASS}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {currencyCodeEnum.enumValues.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Paid by">
          <select
            className={SELECT_CLASS}
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
          >
            {props.members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
        </Field>
      </div>

      <Field label="Category (optional)">
        <select
          className={SELECT_CLASS}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">— Uncategorized —</option>
          {props.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Split mode">
        <select
          className={SELECT_CLASS}
          value={splitMode}
          onChange={(e) => setSplitMode(e.target.value as Mode)}
        >
          <option value="equal">Equal — divide evenly</option>
          <option value="unequal">Unequal — enter amount per person</option>
          <option value="percentage">Percentage — sums to 100</option>
          <option value="share">Shares — proportional units</option>
          <option value="itemized">Itemized — one row per item</option>
        </select>
      </Field>

      <SplitEditor
        mode={splitMode}
        members={props.members}
        equalParticipants={equalParticipants}
        setEqualParticipants={setEqualParticipants}
        rowValues={rowValues}
        setRowValues={setRowValues}
      />

      <Field label="Notes (optional)">
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
        />
      </Field>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : isEdit ? "Save changes" : "Create expense"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-700 text-xs dark:text-slate-300">{label}</Label>
      {children}
    </div>
  );
}

function SplitEditor({
  mode,
  members,
  equalParticipants,
  setEqualParticipants,
  rowValues,
  setRowValues,
}: {
  mode: Mode;
  members: Member[];
  equalParticipants: Set<string>;
  setEqualParticipants: (s: Set<string>) => void;
  rowValues: Record<string, string>;
  setRowValues: (r: Record<string, string>) => void;
}) {
  if (mode === "equal") {
    return (
      <div className="space-y-2 rounded-md border border-slate-200/70 p-3 dark:border-slate-800/70">
        {members.map((m) => {
          const checked = equalParticipants.has(m.userId);
          return (
            <label key={m.userId} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const next = new Set(equalParticipants);
                  if (e.target.checked) next.add(m.userId);
                  else next.delete(m.userId);
                  setEqualParticipants(next);
                }}
              />
              <span className="text-slate-900 dark:text-slate-50">{m.name}</span>
              <span className="text-slate-500 text-xs dark:text-slate-400">{m.email}</span>
            </label>
          );
        })}
      </div>
    );
  }

  const placeholder = mode === "percentage" ? "%" : mode === "share" ? "units" : "0.00";

  return (
    <div className="space-y-2 rounded-md border border-slate-200/70 p-3 dark:border-slate-800/70">
      {members.map((m) => (
        <div key={m.userId} className="flex items-center gap-3 text-sm">
          <div className="flex-1 truncate text-slate-900 dark:text-slate-50">{m.name}</div>
          <Input
            className="w-32"
            inputMode={mode === "share" ? "numeric" : "decimal"}
            value={rowValues[m.userId] ?? ""}
            onChange={(e) => setRowValues({ ...rowValues, [m.userId]: e.target.value })}
            placeholder={placeholder}
          />
        </div>
      ))}
    </div>
  );
}
