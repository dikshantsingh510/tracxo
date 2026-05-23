// Money is bigint minor units (paise / cents). All UI conversion happens here.

const FRACTION_DIGITS_BY_CURRENCY: Record<string, number> = {
  INR: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  AUD: 2,
  SGD: 2,
};

function fractionDigits(currency: string): number {
  return FRACTION_DIGITS_BY_CURRENCY[currency] ?? 2;
}

export function formatMoney(minor: bigint, currency: string, locale = "en-IN"): string {
  const digits = fractionDigits(currency);
  const divisor = 10 ** digits;
  const major = Number(minor) / divisor;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(major);
  } catch {
    return `${currency} ${major.toFixed(digits)}`;
  }
}

// Accepts a user-typed decimal string ("123.45") and converts to bigint minor.
// Returns null when the input is empty/invalid.
export function parseAmountMinor(input: string, currency: string): bigint | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const digits = fractionDigits(currency);
  const [whole, frac = ""] = trimmed.split(".");
  const paddedFrac = (frac + "0".repeat(digits)).slice(0, digits);
  try {
    return BigInt(whole) * BigInt(10 ** digits) + BigInt(paddedFrac || "0");
  } catch {
    return null;
  }
}

// bigint minor → string with major-unit decimal (no currency symbol).
// Useful for prefilling form inputs.
export function minorToDecimalString(minor: bigint, currency: string): string {
  const digits = fractionDigits(currency);
  const sign = minor < 0n ? "-" : "";
  const abs = minor < 0n ? -minor : minor;
  const divisor = BigInt(10 ** digits);
  const whole = abs / divisor;
  const frac = abs % divisor;
  return `${sign}${whole}.${frac.toString().padStart(digits, "0")}`;
}
