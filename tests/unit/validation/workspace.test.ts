import { currencyCodeEnum } from "@/lib/db/schema/auth";
import {
  createWorkspaceSchema,
  renameWorkspaceSchema,
  updateWorkspaceMetaSchema,
  workspaceIdSchema,
} from "@/lib/validation/workspace";
import { describe, expect, it } from "vitest";

describe("createWorkspaceSchema", () => {
  it("accepts a minimal valid workspace", () => {
    const out = createWorkspaceSchema.parse({
      name: "Goa Trip",
      icon: "",
      defaultCurrency: "INR",
    });
    expect(out.name).toBe("Goa Trip");
    expect(out.defaultCurrency).toBe("INR");
  });

  it("trims name and rejects empty", () => {
    expect(
      createWorkspaceSchema.parse({ name: "  X  ", icon: "", defaultCurrency: "INR" }).name,
    ).toBe("X");
    expect(() =>
      createWorkspaceSchema.parse({ name: "   ", icon: "", defaultCurrency: "INR" }),
    ).toThrow();
  });

  it("rejects names longer than 100 chars", () => {
    expect(() =>
      createWorkspaceSchema.parse({
        name: "a".repeat(101),
        icon: "",
        defaultCurrency: "INR",
      }),
    ).toThrow();
  });

  it("rejects unknown currency codes (must match DB pgEnum)", () => {
    expect(() =>
      createWorkspaceSchema.parse({ name: "ok", icon: "", defaultCurrency: "JPY" }),
    ).toThrow();
  });

  it.each(currencyCodeEnum.enumValues)("accepts known currency %s", (c) => {
    const out = createWorkspaceSchema.parse({ name: "ok", icon: "", defaultCurrency: c });
    expect(out.defaultCurrency).toBe(c);
  });

  it("accepts an empty icon (optional)", () => {
    expect(createWorkspaceSchema.parse({ name: "x", icon: "", defaultCurrency: "INR" }).icon).toBe(
      "",
    );
  });

  it("rejects icons longer than 64 chars", () => {
    expect(() =>
      createWorkspaceSchema.parse({
        name: "x",
        icon: "a".repeat(65),
        defaultCurrency: "INR",
      }),
    ).toThrow();
  });
});

describe("renameWorkspaceSchema", () => {
  it("requires id and name", () => {
    expect(() => renameWorkspaceSchema.parse({ id: "", name: "x" })).toThrow();
    expect(() => renameWorkspaceSchema.parse({ id: "abc", name: "" })).toThrow();
    expect(renameWorkspaceSchema.parse({ id: "abc", name: "Renamed" })).toEqual({
      id: "abc",
      name: "Renamed",
    });
  });
});

describe("updateWorkspaceMetaSchema", () => {
  it("requires id and a valid currency", () => {
    expect(() =>
      updateWorkspaceMetaSchema.parse({ id: "", icon: "", defaultCurrency: "INR" }),
    ).toThrow();
    expect(() =>
      updateWorkspaceMetaSchema.parse({ id: "abc", icon: "", defaultCurrency: "ZZZ" }),
    ).toThrow();
    const out = updateWorkspaceMetaSchema.parse({
      id: "abc",
      icon: "🌴",
      defaultCurrency: "INR",
    });
    expect(out).toEqual({ id: "abc", icon: "🌴", defaultCurrency: "INR" });
  });
});

describe("workspaceIdSchema", () => {
  it("requires id", () => {
    expect(() => workspaceIdSchema.parse({ id: "" })).toThrow();
    expect(workspaceIdSchema.parse({ id: "abc" })).toEqual({ id: "abc" });
  });
});
