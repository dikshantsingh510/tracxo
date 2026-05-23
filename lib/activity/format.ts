// Turns a raw activity_log row into a human-readable phrase.
// Pure — no DB, no I/O. Easy to unit-test and safe to import client-side.

export type ActivityForFormat = {
  action: string;
  actorName: string | null;
  metadata: unknown;
};

type Meta = Record<string, unknown>;

function readString(m: Meta | null, key: string): string | undefined {
  const v = m?.[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

// Best-effort: serialize a stored bigint-as-string amount + currency to a
// short symbol-less label so the feed stays readable.
function amountLabel(m: Meta | null): string | undefined {
  const raw = readString(m, "amount");
  const currency = readString(m, "currency") ?? "";
  if (!raw) return undefined;
  try {
    // amounts arrive as minor units stringified (e.g. "12500" = 125.00 INR)
    const minor = BigInt(raw);
    const major = Number(minor) / 100;
    const formatted = major.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return currency ? `${currency} ${formatted}` : formatted;
  } catch {
    return raw;
  }
}

const ACTION_TEMPLATES: Record<string, (m: Meta | null, who: string) => string> = {
  "workspace.created": (m, who) => {
    const auto = m?.auto === true ? " (personal space)" : "";
    const name = readString(m, "name");
    return `${who} created ${name ? `“${name}”` : "a workspace"}${auto}`;
  },
  "workspace.renamed": (m, who) => {
    const name = readString(m, "name");
    return `${who} renamed the workspace${name ? ` to “${name}”` : ""}`;
  },
  "workspace.meta_updated": (_m, who) => `${who} updated workspace settings`,
  "workspace.archived": (_m, who) => `${who} archived the workspace`,
  "workspace.restored": (_m, who) => `${who} restored the workspace`,
  "workspace.deleted": (_m, who) => `${who} deleted the workspace`,
  "workspace.ownership_transferred": (_m, who) => `${who} transferred ownership`,

  "invitation.created": (m, who) => {
    const email = readString(m, "email");
    const role = readString(m, "role");
    return `${who} invited ${email ?? "someone"}${role ? ` as ${role}` : ""}`;
  },
  "invitation.revoked": (_m, who) => `${who} revoked an invitation`,
  "member.joined": (_m, who) => `${who} joined the workspace`,
  "member.left": (_m, who) => `${who} left the workspace`,
  "member.removed": (_m, who) => `${who} removed a member`,
  "member.role_changed": (m, who) => {
    const from = readString(m, "from");
    const to = readString(m, "to");
    return `${who} changed a member's role${from && to ? ` from ${from} to ${to}` : ""}`;
  },

  "expense.created": (m, who) => {
    const desc = readString(m, "description");
    const amt = amountLabel(m);
    if (desc && amt) return `${who} added expense “${desc}” for ${amt}`;
    if (desc) return `${who} added expense “${desc}”`;
    return `${who} added an expense`;
  },
  "expense.updated": (m, who) => {
    const desc = readString(m, "description");
    return `${who} updated expense${desc ? ` “${desc}”` : ""}`;
  },
  "expense.deleted": (_m, who) => `${who} deleted an expense`,

  "settlement.created": (m, who) => {
    const amt = amountLabel(m);
    const method = readString(m, "method");
    if (amt && method) return `${who} recorded a ${method} settlement of ${amt}`;
    return `${who} recorded a settlement`;
  },
  "settlement.deleted": (_m, who) => `${who} deleted a settlement`,
};

export function formatActivity(row: ActivityForFormat): string {
  const who = row.actorName ?? "Someone";
  const meta = (
    row.metadata && typeof row.metadata === "object" ? row.metadata : null
  ) as Meta | null;
  const template = ACTION_TEMPLATES[row.action];
  if (template) return template(meta, who);
  // Fallback: still tell the reader something happened, with the raw action
  // so a sharp-eyed user can ask "what's that?" instead of seeing nothing.
  return `${who}: ${row.action}`;
}
