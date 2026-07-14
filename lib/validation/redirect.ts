// Post-auth redirect sanitizer.
//
// A bare `startsWith("/")` check is an open redirect: browsers treat
// `//evil.com` as protocol-relative (→ https://evil.com) and `/\evil.com`
// the same way (backslash normalizes to slash). Both pass a "/" prefix
// test. Only same-origin paths may survive.

const SAFE_PATH = /^\/(?![/\\])/;

// biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control characters is the point
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export function safeRedirectPath(raw: string | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  // Reject (never trim-and-accept): whitespace padding can smuggle a scheme
  // past naive prefix checks after browser normalization.
  if (raw !== raw.trim()) return fallback;
  if (CONTROL_CHARS.test(raw)) return fallback;
  if (raw.includes("\\")) return fallback;
  if (!SAFE_PATH.test(raw)) return fallback;
  return raw;
}
