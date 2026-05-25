import { searchFiltersSchema } from "@/lib/validation/search";
import { describe, expect, it } from "vitest";

describe("search filters schema", () => {
  it("defaults page=1 pageSize=25", () => {
    const r = searchFiltersSchema.parse({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(25);
  });

  it("coerces page from string", () => {
    expect(searchFiltersSchema.parse({ page: "3" }).page).toBe(3);
  });

  it("clamps pageSize via min/max", () => {
    expect(searchFiltersSchema.safeParse({ pageSize: "1" }).success).toBe(false);
    expect(searchFiltersSchema.safeParse({ pageSize: "200" }).success).toBe(false);
  });

  it("rejects badly formed dates", () => {
    expect(searchFiltersSchema.safeParse({ from: "2026/06/01" }).success).toBe(false);
    expect(searchFiltersSchema.safeParse({ from: "2026-06-01" }).success).toBe(true);
  });

  it("trims q + caps length", () => {
    const big = "x".repeat(121);
    expect(searchFiltersSchema.safeParse({ q: big }).success).toBe(false);
    expect(searchFiltersSchema.parse({ q: "  hello  " }).q).toBe("hello");
  });
});
