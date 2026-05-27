import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

// DESIGN.md §3.4 — Money formatting.
// Always tabular-nums. Color tone follows balance semantics:
//   plain    — neutral, the default for "expense totals" (just a fact)
//   success  — positive balance (you are owed)
//   danger   — negative balance (you owe)
//   muted    — zero / settled
//   auto     — pick from amount sign (positive → success, negative → danger, zero → muted)
//
// Sign rules:
//   auto           — show "-" on negative, nothing on positive (default)
//   always         — show leading "+" on positive (use in balance lists where +/- contrast matters)
//   negative-only  — show "-" on negative, nothing on positive (same as auto, here for clarity)

type Tone = "plain" | "success" | "danger" | "muted" | "auto";
type SignMode = "auto" | "always" | "negative-only";

type Props = {
  amount: bigint;
  currency: string;
  locale?: string;
  tone?: Tone;
  sign?: SignMode;
  className?: string;
};

const TONE_CLASS: Record<Exclude<Tone, "auto">, string> = {
  plain: "text-foreground",
  success: "text-emerald-700 dark:text-emerald-400",
  danger: "text-rose-700 dark:text-rose-400",
  muted: "text-muted-foreground",
};

function resolveTone(amount: bigint, tone: Tone): Exclude<Tone, "auto"> {
  if (tone !== "auto") return tone;
  if (amount > 0n) return "success";
  if (amount < 0n) return "danger";
  return "muted";
}

export function Money({
  amount,
  currency,
  locale = "en-IN",
  tone = "plain",
  sign = "auto",
  className,
}: Props) {
  const resolved = resolveTone(amount, tone);
  // formatMoney already handles "-" for negatives via Intl; the only thing
  // we add is the optional leading "+" for positives in `always` mode.
  const formatted = formatMoney(amount, currency, locale);
  const display = sign === "always" && amount > 0n ? `+${formatted}` : formatted;

  return <span className={cn("tabular-nums", TONE_CLASS[resolved], className)}>{display}</span>;
}
