import { InvalidUpiVpaError, buildUpiDeepLink, isValidVpa } from "@/lib/upi";
import { describe, expect, it } from "vitest";

describe("isValidVpa", () => {
  it.each(["name@bank", "user.name_42-foo@hdfc", "x1@ybl"])("accepts %p", (v) => {
    expect(isValidVpa(v)).toBe(true);
  });

  it.each([null, undefined, "", "no-at-sign", "@bank", "user@", "user@bank!"])(
    "rejects %p",
    (v) => {
      expect(isValidVpa(v as never)).toBe(false);
    },
  );
});

describe("buildUpiDeepLink", () => {
  it("emits a well-formed upi:// URL with all required params", () => {
    const out = buildUpiDeepLink({
      vpa: "alice@hdfc",
      payeeName: "Alice",
      amountDecimal: "123.45",
      note: "Dinner",
    });
    // VPA is not percent-encoded per the NPCI grammar.
    expect(out).toContain("pa=alice%40hdfc");
    // Other fields are URL-encoded.
    expect(out).toContain("pn=Alice");
    expect(out).toContain("am=123.45");
    expect(out).toContain("cu=INR");
    expect(out).toContain("tn=Dinner");
    expect(out.startsWith("upi://pay?")).toBe(true);
  });

  it("URL-encodes special characters in payee name and note", () => {
    const out = buildUpiDeepLink({
      vpa: "alice@hdfc",
      payeeName: "Alice & Bob",
      amountDecimal: "1.00",
      note: "Trip to Goa",
    });
    expect(out).toContain("pn=Alice+%26+Bob");
    expect(out).toContain("tn=Trip+to+Goa");
  });

  it("truncates note to 80 chars", () => {
    const long = "x".repeat(120);
    const out = buildUpiDeepLink({
      vpa: "ab@cd",
      payeeName: "x",
      amountDecimal: "1.00",
      note: long,
    });
    const tn = new URL(out.replace("upi://", "https://")).searchParams.get("tn");
    expect(tn?.length).toBe(80);
  });

  it("throws on invalid VPA", () => {
    expect(() => buildUpiDeepLink({ vpa: "bad", payeeName: "x", amountDecimal: "1.00" })).toThrow(
      InvalidUpiVpaError,
    );
  });

  it("throws on amount with more than 2 decimals", () => {
    expect(() =>
      buildUpiDeepLink({ vpa: "ab@cd", payeeName: "x", amountDecimal: "1.234" }),
    ).toThrow(/Invalid UPI amount/);
  });

  it("accepts integer amount and zero decimals", () => {
    expect(buildUpiDeepLink({ vpa: "ab@cd", payeeName: "x", amountDecimal: "100" })).toContain(
      "am=100",
    );
  });
});
