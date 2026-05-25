import {
  buildRRule,
  firstRunAtOrAfter,
  humanizeRRule,
  nextRunAfter,
  ruleToString,
} from "@/lib/recurring/rrule";
import { describe, expect, it } from "vitest";

describe("rrule helper", () => {
  it("monthly interval 1 advances by one month", () => {
    const rule = buildRRule({ freq: "monthly", interval: 1, dtstart: "2026-06-01" });
    const rruleStr = ruleToString(rule);
    const after = new Date(Date.UTC(2026, 5, 1)); // 2026-06-01
    const next = nextRunAfter(rruleStr, after);
    expect(next).toBeInstanceOf(Date);
    expect(next?.toISOString().slice(0, 10)).toBe("2026-07-01");
  });

  it("weekly interval 2 advances by two weeks", () => {
    const rule = buildRRule({ freq: "weekly", interval: 2, dtstart: "2026-06-01" });
    const rruleStr = ruleToString(rule);
    const start = new Date(Date.UTC(2026, 5, 1));
    const next = nextRunAfter(rruleStr, start);
    expect(next?.toISOString().slice(0, 10)).toBe("2026-06-15");
  });

  it("returns null past the until date", () => {
    const rule = buildRRule({
      freq: "daily",
      interval: 1,
      dtstart: "2026-06-01",
      until: "2026-06-03",
    });
    const rruleStr = ruleToString(rule);
    const past = new Date(Date.UTC(2026, 5, 10));
    expect(nextRunAfter(rruleStr, past)).toBeNull();
  });

  it("firstRunAtOrAfter snaps a past dtstart forward", () => {
    const rule = buildRRule({ freq: "monthly", interval: 1, dtstart: "2024-01-01" });
    const now = new Date(Date.UTC(2026, 5, 15));
    const first = firstRunAtOrAfter(rule, now);
    expect(first).toBeInstanceOf(Date);
    expect((first as Date).getTime()).toBeGreaterThanOrEqual(now.getTime());
  });

  it("humanizeRRule produces a readable string", () => {
    const rule = buildRRule({ freq: "monthly", interval: 1, dtstart: "2026-06-01" });
    expect(humanizeRRule(ruleToString(rule)).toLowerCase()).toContain("month");
  });
});
