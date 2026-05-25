"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRecurring } from "@/lib/actions/recurring";
import { currencyCodeEnum } from "@/lib/db/schema/auth";
import { parseAmountMinor } from "@/lib/money";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Member = { userId: string; name: string; email: string };
type Category = { id: string; name: string };
type Freq = "daily" | "weekly" | "monthly" | "yearly";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function RecurringForm({
  workspaceId,
  workspaceCurrency,
  actorUserId,
  members,
  categories,
}: {
  workspaceId: string;
  workspaceCurrency: string;
  actorUserId: string;
  members: Member[];
  categories: Category[];
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [currency, setCurrency] = useState(workspaceCurrency);
  const [payerId, setPayerId] = useState(actorUserId);
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [freq, setFreq] = useState<Freq>("monthly");
  const [interval, setInterval] = useState("1");
  const [dtstart, setDtstart] = useState(today);
  const [until, setUntil] = useState("");
  const [participants, setParticipants] = useState<Set<string>>(
    () => new Set(members.map((m) => m.userId)),
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return toast.error("Description is required");
    const amount = parseAmountMinor(amountStr, currency);
    if (amount === null || amount <= 0n) return toast.error("Enter a positive amount");
    const intervalN = Number(interval);
    if (!Number.isInteger(intervalN) || intervalN < 1)
      return toast.error("Interval must be a whole number");
    const ids = Array.from(participants);
    if (ids.length === 0) return toast.error("Pick at least one participant");

    setBusy(true);
    try {
      await createRecurring({
        workspaceId,
        payerId,
        amount,
        currency,
        description: description.trim(),
        categoryId: categoryId || undefined,
        notes: notes.trim() || undefined,
        split: { mode: "equal", participantIds: ids },
        schedule: {
          freq,
          interval: intervalN,
          dtstart,
          until: until || undefined,
        },
      });
      toast.success("Recurring expense created");
      router.push(`/workspaces/${workspaceId}/recurring`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Description">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Rent"
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
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Category (optional)">
          <select
            className={SELECT_CLASS}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">— Uncategorized —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Frequency">
          <select
            className={SELECT_CLASS}
            value={freq}
            onChange={(e) => setFreq(e.target.value as Freq)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </Field>
        <Field label="Every">
          <Input
            inputMode="numeric"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          />
        </Field>
        <Field label="Starts on">
          <Input type="date" value={dtstart} onChange={(e) => setDtstart(e.target.value)} />
        </Field>
        <Field label="Ends on (optional)">
          <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
        </Field>
      </div>

      <div className="space-y-2 rounded-md border border-slate-200/70 p-3 dark:border-slate-800/70">
        <Label className="text-slate-700 text-xs dark:text-slate-300">Split equally between</Label>
        {members.map((m) => {
          const checked = participants.has(m.userId);
          return (
            <label key={m.userId} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const next = new Set(participants);
                  if (e.target.checked) next.add(m.userId);
                  else next.delete(m.userId);
                  setParticipants(next);
                }}
              />
              <span className="text-slate-900 dark:text-slate-50">{m.name}</span>
              <span className="text-slate-500 text-xs dark:text-slate-400">{m.email}</span>
            </label>
          );
        })}
      </div>

      <Field label="Notes (optional)">
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
        />
      </Field>

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Saving…" : "Create recurring expense"}
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
