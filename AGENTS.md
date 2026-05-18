<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Tracxo project guides

Source of truth lives in `docs/`:

- `docs/PROMPT.md` — engineering operating manual (pinned versions, hard rules, workflow). Read first, every session.
- `docs/PRODUCT.md` — feature specification (v1 scope).
- `docs/DESIGN.md` — UI design system ("Frosted Emerald", Windows 11 Fluent-inspired).
- `docs/CLAUDE.md` — Claude Code session guide (architecture, commands, traps).
- `docs/tracxo-reference.pdf` — full project dossier (hosting, roadmap, future plans).

Treat `docs/PROMPT.md` as authoritative — if a request conflicts with it, surface the conflict rather than silently diverging.
