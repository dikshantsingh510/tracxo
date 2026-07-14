import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/validation/redirect";

const NUL = String.fromCharCode(0);
const US = String.fromCharCode(31);
const DEL = String.fromCharCode(127);

describe("safeRedirectPath", () => {
  it("accepts same-origin paths", () => {
    expect(safeRedirectPath("/")).toBe("/");
    expect(safeRedirectPath("/workspaces/abc")).toBe("/workspaces/abc");
    expect(safeRedirectPath("/a?b=c")).toBe("/a?b=c");
    expect(safeRedirectPath("/a#frag")).toBe("/a#frag");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("//evil.com/workspaces")).toBe("/");
  });

  it("rejects backslash variants", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe("/");
    expect(safeRedirectPath("\\/evil.com")).toBe("/");
    expect(safeRedirectPath("/workspaces\\..\\x")).toBe("/");
  });

  it("rejects absolute URLs and schemes", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath("http://evil.com/")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
    expect(safeRedirectPath("data:text/html,x")).toBe("/");
  });

  it("rejects whitespace padding instead of trimming", () => {
    expect(safeRedirectPath(" /workspaces")).toBe("/");
    expect(safeRedirectPath("/workspaces ")).toBe("/");
    expect(safeRedirectPath("\t//evil.com")).toBe("/");
    expect(safeRedirectPath("\n/x")).toBe("/");
  });

  it("rejects embedded control characters", () => {
    expect(safeRedirectPath(`/a${NUL}b`)).toBe("/");
    expect(safeRedirectPath(`/a${US}b`)).toBe("/");
    expect(safeRedirectPath(`/a${DEL}b`)).toBe("/");
  });

  it("falls back for empty or missing input", () => {
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
    expect(safeRedirectPath("workspaces")).toBe("/");
  });

  it("honors a custom fallback", () => {
    expect(safeRedirectPath("//evil.com", "/login")).toBe("/login");
    expect(safeRedirectPath(undefined, "/login")).toBe("/login");
  });
});
