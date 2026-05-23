import {
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  resetPasswordSchema,
  signupSchema,
  verifyOtpSchema,
} from "@/lib/validation/auth";
import { describe, expect, it } from "vitest";

describe("emailSchema", () => {
  it("accepts a valid address and lowercases / trims", () => {
    const out = emailSchema.parse("  USER@Example.COM ");
    expect(out).toBe("user@example.com");
  });

  it.each(["", "not-an-email", "missing@", "@nohost", `${"a".repeat(255)}@a.com`])(
    "rejects %p",
    (bad) => {
      expect(() => emailSchema.parse(bad)).toThrow();
    },
  );
});

describe("passwordSchema", () => {
  it("accepts a strong password with letter + digit", () => {
    expect(passwordSchema.parse("hunter22")).toBe("hunter22");
  });

  it.each([
    ["short1", "too short (< 8)"],
    ["nodigitshere", "no digit"],
    ["12345678", "no letter"],
    ["a".repeat(129), "too long (> 128)"],
  ])("rejects %p (%s)", (bad) => {
    expect(() => passwordSchema.parse(bad)).toThrow();
  });
});

describe("loginSchema", () => {
  it("requires both email and password", () => {
    expect(() => loginSchema.parse({ email: "", password: "" })).toThrow();
    expect(loginSchema.parse({ email: "u@x.com", password: "anything" })).toEqual({
      email: "u@x.com",
      password: "anything",
    });
  });
});

describe("signupSchema", () => {
  it("trims name", () => {
    const out = signupSchema.parse({
      name: "  Alice  ",
      email: "a@b.com",
      password: "hunter22",
    });
    expect(out.name).toBe("Alice");
  });

  it("rejects empty name and weak password", () => {
    expect(() =>
      signupSchema.parse({ name: " ", email: "a@b.com", password: "hunter22" }),
    ).toThrow();
    expect(() => signupSchema.parse({ name: "A", email: "a@b.com", password: "short1" })).toThrow();
  });
});

describe("forgotPasswordSchema", () => {
  it("requires email", () => {
    expect(forgotPasswordSchema.parse({ email: "u@x.com" })).toEqual({ email: "u@x.com" });
    expect(() => forgotPasswordSchema.parse({ email: "" })).toThrow();
  });
});

describe("resetPasswordSchema", () => {
  it("requires both passwords to match", () => {
    expect(() =>
      resetPasswordSchema.parse({ password: "hunter22", confirmPassword: "hunter23" }),
    ).toThrow(/match/i);
  });

  it("accepts matching strong passwords", () => {
    const out = resetPasswordSchema.parse({
      password: "hunter22",
      confirmPassword: "hunter22",
    });
    expect(out.password).toBe("hunter22");
  });
});

describe("verifyOtpSchema", () => {
  it.each(["12345", "1234567", "abc123", ""])("rejects bad OTP %p", (bad) => {
    expect(() => verifyOtpSchema.parse({ email: "u@x.com", otp: bad })).toThrow();
  });

  it("accepts a 6-digit numeric OTP", () => {
    expect(verifyOtpSchema.parse({ email: "u@x.com", otp: "123456" }).otp).toBe("123456");
  });
});
