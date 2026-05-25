import "server-only";

import type { RecurringFreq, RecurringScheduleInput } from "@/lib/validation/recurring";
import { Frequency, RRule } from "rrule";

const FREQ_MAP: Record<RecurringFreq, Frequency> = {
  daily: Frequency.DAILY,
  weekly: Frequency.WEEKLY,
  monthly: Frequency.MONTHLY,
  yearly: Frequency.YEARLY,
};

// rrule needs UTC anchors — naive Date(yyyy-mm-dd) is parsed in local TZ which
// shifts the first occurrence across the date line for users east of UTC.
function parseYmdAsUtc(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function buildRRule({ freq, interval, until, dtstart }: RecurringScheduleInput): RRule {
  return new RRule({
    freq: FREQ_MAP[freq],
    interval,
    dtstart: parseYmdAsUtc(dtstart),
    until: until ? parseYmdAsUtc(until) : null,
  });
}

export function ruleToString(rule: RRule): string {
  return rule.toString();
}

export function parseRRule(rruleStr: string): RRule {
  return RRule.fromString(rruleStr);
}

// Computes the next firing strictly AFTER `from`. Returns null if the rule is
// exhausted (past `until` or finished count). Caller should mark the template
// inactive when null is returned.
export function nextRunAfter(rruleStr: string, from: Date): Date | null {
  const rule = parseRRule(rruleStr);
  const next = rule.after(from, false);
  return next ?? null;
}

// Used at template creation — first occurrence is dtstart itself, on or after
// today. If dtstart is in the past, advance to the next valid slot so we don't
// immediately generate a backlog of missed runs.
export function firstRunAtOrAfter(rule: RRule, now: Date): Date | null {
  return rule.after(now, true) ?? null;
}

// Human-readable form used in the UI ("every 2 weeks until 1 Aug 2026").
export function humanizeRRule(rruleStr: string): string {
  try {
    return parseRRule(rruleStr).toText();
  } catch {
    return rruleStr;
  }
}
