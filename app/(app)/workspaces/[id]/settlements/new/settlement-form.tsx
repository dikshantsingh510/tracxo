"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSettlement } from "@/lib/actions/settlements";
import { currencyCodeEnum } from "@/lib/db/schema/auth";
import { minorToDecimalString, parseAmountMinor } from "@/lib/money";
import { buildUpiDeepLink, isValidVpa } from "@/lib/upi";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Member = { userId: string; name: string; email: string };
type Method = "upi" | "cash" | "bank_transfer" | "other";

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function SettlementForm({
  workspaceId,
  workspaceCurrency,
  actorUserId,
  members,
  preset,
  recipientUpiVpa,
}: {
  workspaceId: string;
  workspaceCurrency: string;
  actorUserId: string;
  members: Member[];
  preset: {
    fromUserId: string;
    toUserId: string;
    amountDecimal: string;
    currency: string;
  };
  recipientUpiVpa: string | null;
}) {
  const router = useRouter();
  const [fromUserId, setFromUserId] = useState(preset.fromUserId);
  const [toUserId, setToUserId] = useState(preset.toUserId);
  const [amountStr, setAmountStr] = useState(preset.amountDecimal);
  const [currency, setCurrency] = useState(preset.currency || workspaceCurrency);
  const [method, setMethod] = useState<Method>("upi");
  const [note, setNote] = useState("");
  const [settledAt, setSettledAt] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const recipient = useMemo(() => members.find((m) => m.userId === toUserId), [members, toUserId]);

  // UPI deep link is only meaningful when:
  //   - method === "upi"
  //   - the actor is paying (from === actor)
  //   - the recipient has a saved VPA
  //   - amount parses cleanly
  const upiHref = useMemo(() => {
    if (method !== "upi") return null;
    if (fromUserId !== actorUserId) return null;
    if (!isValidVpa(recipientUpiVpa)) return null;
    const minor = parseAmountMinor(amountStr, currency);
    if (minor === null || minor <= 0n) return null;
    try {
      return buildUpiDeepLink({
        vpa: recipientUpiVpa,
        payeeName: recipient?.name ?? "Recipient",
        amountDecimal: minorToDecimalString(minor, currency),
        currency,
        note: note || "Tracxo settlement",
      });
    } catch {
      return null;
    }
  }, [method, fromUserId, actorUserId, recipientUpiVpa, amountStr, currency, recipient, note]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fromUserId === toUserId) return toast.error("From and To must be different");
    const minor = parseAmountMinor(amountStr, currency);
    if (minor === null || minor <= 0n) return toast.error("Enter a positive amount");

    setSubmitting(true);
    try {
      await createSettlement({
        workspaceId,
        fromUserId,
        toUserId,
        amount: minor,
        currency,
        method,
        note,
        settledAt,
      });
      toast.success("Settlement recorded");
      router.push(`/workspaces/${workspaceId}/balances`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record settlement");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="From">
          <select
            className={SELECT_CLASS}
            value={fromUserId}
            onChange={(e) => setFromUserId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
                {m.userId === actorUserId ? " (you)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="To">
          <select
            className={SELECT_CLASS}
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount">
          <Input
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
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
        <Field label="Method">
          <select
            className={SELECT_CLASS}
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
          >
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Settled on">
          <Input type="date" value={settledAt} onChange={(e) => setSettledAt(e.target.value)} />
        </Field>
      </div>

      <Field label="Note (optional)">
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder="Goa trip dinner"
        />
      </Field>

      {upiHref && (
        <a
          href={upiHref}
          className="inline-flex h-9 w-full items-center justify-center rounded-md border border-emerald-300/60 bg-emerald-50 px-4 font-medium text-emerald-800 text-sm transition hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
        >
          Open UPI app to pay {recipient?.name}
        </a>
      )}
      {method === "upi" && !upiHref && fromUserId === actorUserId && !recipientUpiVpa && (
        <p className="text-neutral-500 text-xs dark:text-neutral-400">
          {recipient?.name} hasn&apos;t saved a UPI ID. Settlement will still be recorded.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Recording…" : "Record settlement"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-neutral-700 text-xs dark:text-neutral-300">{label}</Label>
      {children}
    </div>
  );
}
