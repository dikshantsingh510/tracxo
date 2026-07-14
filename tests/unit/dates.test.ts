import { describe, expect, it } from "vitest";

import { daysUntil, formatDate, formatDateTime, timeAgo, todayIsoDate } from "@/lib/dates";

// 2026-03-05T09:11:00Z → 14:41 IST (UTC+5:30)
const SAMPLE = "2026-03-05T09:11:00.000Z";

describe("formatDateTime", () => {
  it("renders pinned IST regardless of process TZ", () => {
    const out = formatDateTime(SAMPLE);
    expect(out).toContain("5 Mar");
    expect(out.toLowerCase()).toContain("2:41");
  });

  it("accepts Date objects and ISO strings identically", () => {
    expect(formatDateTime(new Date(SAMPLE))).toBe(formatDateTime(SAMPLE));
  });

  it("crosses the date line correctly near IST midnight", () => {
    // 20:00 UTC = 01:30 IST next day
    expect(formatDateTime("2026-03-05T20:00:00.000Z")).toContain("6 Mar");
  });
});

describe("formatDate", () => {
  it("renders day month year in IST", () => {
    expect(formatDate(SAMPLE)).toBe("5 Mar 2026");
  });

  it("rolls to next day after IST midnight", () => {
    expect(formatDate("2026-12-31T19:00:00.000Z")).toBe("1 Jan 2027");
  });
});

describe("timeAgo", () => {
  const now = new Date(SAMPLE).getTime();

  it("returns 'just now' under a minute", () => {
    expect(timeAgo(new Date(now - 30_000), now)).toBe("just now");
    expect(timeAgo(new Date(now), now)).toBe("just now");
  });

  it("returns minutes bucket", () => {
    expect(timeAgo(new Date(now - 60_000), now)).toBe("1m ago");
    expect(timeAgo(new Date(now - 59 * 60_000), now)).toBe("59m ago");
  });

  it("returns hours bucket", () => {
    expect(timeAgo(new Date(now - 60 * 60_000), now)).toBe("1h ago");
    expect(timeAgo(new Date(now - 23 * 60 * 60_000), now)).toBe("23h ago");
  });

  it("returns days bucket", () => {
    expect(timeAgo(new Date(now - 24 * 60 * 60_000), now)).toBe("1d ago");
    expect(timeAgo(new Date(now - 29 * 24 * 60 * 60_000), now)).toBe("29d ago");
  });

  it("falls back to absolute date at 30 days", () => {
    const old = new Date(now - 30 * 24 * 60 * 60_000);
    expect(timeAgo(old, now)).toBe(formatDate(old));
  });
});

describe("daysUntil", () => {
  const now = new Date(SAMPLE).getTime();
  const DAY = 24 * 60 * 60 * 1000;

  it("is 0 or less for past/now instants", () => {
    expect(daysUntil(new Date(now), now)).toBe(0);
    expect(daysUntil(new Date(now - DAY), now)).toBeLessThanOrEqual(0);
  });

  it("ceils partial days up", () => {
    expect(daysUntil(new Date(now + 1), now)).toBe(1);
    expect(daysUntil(new Date(now + DAY), now)).toBe(1);
    expect(daysUntil(new Date(now + DAY + 1), now)).toBe(2);
  });

  it("counts full days", () => {
    expect(daysUntil(new Date(now + 7 * DAY), now)).toBe(7);
  });
});

describe("todayIsoDate", () => {
  it("returns YYYY-MM-DD", () => {
    expect(todayIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches the UTC calendar date", () => {
    expect(todayIsoDate()).toBe(new Date().toISOString().slice(0, 10));
  });
});
