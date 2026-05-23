// UPI deep-link generator. Per NPCI spec the amount goes on the wire as a
// decimal string with up to 2 decimal places — NOT minor units. The caller is
// responsible for converting from bigint paise before calling.
//
// Spec reference (informal): https://www.npci.org.in/PDF/npci/upi/circular/
//   Common-URL-Specification-of-UPI-Linking.pdf
//
// Resulting shape:
//   upi://pay?pa=<vpa>&pn=<payee name>&am=<decimal>&cu=<currency>&tn=<note>

const VPA_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

export class InvalidUpiVpaError extends Error {
  readonly status = 400;
  constructor(vpa: string) {
    super(`Invalid UPI VPA: ${vpa}`);
    this.name = "InvalidUpiVpaError";
  }
}

export function isValidVpa(vpa: string | null | undefined): vpa is string {
  return typeof vpa === "string" && VPA_RE.test(vpa);
}

// `amountDecimal` must already be a "123.45"-style string. Convert from
// bigint minor via lib/money's minorToDecimalString before calling.
function isValidAmountDecimal(amountDecimal: string): boolean {
  return /^\d{1,12}(\.\d{1,2})?$/.test(amountDecimal);
}

export function buildUpiDeepLink(params: {
  vpa: string;
  payeeName: string;
  amountDecimal: string;
  currency?: string; // ISO 4217 — defaults to INR (UPI's native currency)
  note?: string;
}): string {
  const { vpa, payeeName, amountDecimal, currency = "INR", note } = params;
  if (!isValidVpa(vpa)) throw new InvalidUpiVpaError(vpa);
  if (!isValidAmountDecimal(amountDecimal)) {
    throw new Error(`Invalid UPI amount: ${amountDecimal}`);
  }
  // UPI's `pa` value should not be percent-encoded — VPAs are URL-safe by
  // grammar. Other fields ARE encoded per the spec.
  const search = new URLSearchParams();
  search.set("pa", vpa);
  search.set("pn", payeeName);
  search.set("am", amountDecimal);
  search.set("cu", currency);
  if (note && note.trim().length > 0) search.set("tn", note.trim().slice(0, 80));
  return `upi://pay?${search.toString()}`;
}
