"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MorphButton } from "@/components/ui/morph-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createRecurring } from "@/lib/actions/recurring";
import { currencyCodeEnum } from "@/lib/db/schema/auth";
import { parseAmountMinor } from "@/lib/money";

type Member = { userId: string; name: string; email: string };
type Category = { id: string; name: string };
type Freq = "daily" | "weekly" | "monthly" | "yearly";

const FREQ_LABEL: Record<Freq, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

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

  async function doSubmit() {
    if (!description.trim()) {
      toast.error("Description is required");
      throw new Error("invalid");
    }
    const amount = parseAmountMinor(amountStr, currency);
    if (amount === null || amount <= 0n) {
      toast.error("Enter a positive amount");
      throw new Error("invalid");
    }
    const intervalN = Number(interval);
    if (!Number.isInteger(intervalN) || intervalN < 1) {
      toast.error("Interval must be a whole number");
      throw new Error("invalid");
    }
    const ids = Array.from(participants);
    if (ids.length === 0) {
      toast.error("Pick at least one participant");
      throw new Error("invalid");
    }

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
        schedule: { freq, interval: intervalN, dtstart, until: until || undefined },
      });
      toast.success("Recurring expense created");
      router.push(`/workspaces/${workspaceId}/recurring`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
      throw err;
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <Tabs defaultValue="basics">
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="split">Split</TabsTrigger>
        </TabsList>

        {/* Basics */}
        <TabsContent value="basics" className="mt-6 space-y-4">
          <Field label="Description" htmlFor="rec-desc">
            <Input
              id="rec-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rent"
              maxLength={200}
              className="h-11 rounded-xl"
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Amount" htmlFor="rec-amount">
              <Input
                id="rec-amount"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Currency">
              <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyCodeEnum.enumValues.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Paid by">
              <Select value={payerId} onValueChange={(v) => v && setPayerId(v)}>
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Category (optional)">
              <Select
                value={categoryId || "none"}
                onValueChange={(v) => setCategoryId(v && v !== "none" ? v : "")}
              >
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Notes (optional)" htmlFor="rec-notes">
            <textarea
              id="rec-notes"
              className="flex min-h-[72px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
            />
          </Field>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Frequency">
              <Select value={freq} onValueChange={(v) => v && setFreq(v as Freq)}>
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FREQ_LABEL) as Freq[]).map((f) => (
                    <SelectItem key={f} value={f}>
                      {FREQ_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Repeat every" htmlFor="rec-interval">
              <Input
                id="rec-interval"
                inputMode="numeric"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Starts on" htmlFor="rec-start">
              <Input
                id="rec-start"
                type="date"
                value={dtstart}
                onChange={(e) => setDtstart(e.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
            <Field label="Ends on (optional)" htmlFor="rec-end">
              <Input
                id="rec-end"
                type="date"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
                className="h-11 rounded-xl"
              />
            </Field>
          </div>
        </TabsContent>

        {/* Split */}
        <TabsContent value="split" className="mt-6 space-y-3">
          <p className="text-muted-foreground text-sm">
            Split equally between the people you pick.
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {members.map((m) => {
              const checked = participants.has(m.userId);
              return (
                <li key={m.userId}>
                  <label className="hover-tint flex cursor-pointer items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(participants);
                        if (e.target.checked) next.add(m.userId);
                        else next.delete(m.userId);
                        setParticipants(next);
                      }}
                      className="size-4 accent-emerald-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground text-sm">
                        {m.name}
                      </span>
                      <span className="block truncate text-muted-foreground text-xs">
                        {m.email}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </TabsContent>
      </Tabs>

      <MorphButton
        className="w-full"
        idle="Create recurring expense"
        pending="Saving…"
        success="Created"
        onAction={doSubmit}
      />
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-muted-foreground text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}
