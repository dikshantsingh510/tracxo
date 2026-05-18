# Tracxo

> Splitwise, but actually fast — with one-tap UPI settlement.

A real-time shared-expense tracker for flatmates, friends, and travel groups. Frosted-glass UI, keyboard-first, built on the latest Next.js + React.

**Status:** v0.1.0 — scaffold + auth groundwork. Not yet production-ready.

---

## Stack

Pinned versions. Do not bump without coordination.

| Layer       | Tech                                                                 |
| ----------- | -------------------------------------------------------------------- |
| Runtime     | Node.js 20+, pnpm                                                    |
| Framework   | Next.js 16.2.6 (App Router, Turbopack, React Compiler) + React 19.2  |
| Styling     | Tailwind v4 + shadcn/ui primitives                                   |
| State       | TanStack Query/Table, nuqs (URL state), zustand (client state)       |
| Forms       | react-hook-form + Zod                                                |
| DB / ORM    | Drizzle ORM + `@neondatabase/serverless` (Neon HTTP driver)          |
| Auth        | Better Auth (email/password + Google OAuth + OTP)                    |
| Email       | Resend + `@react-email/components`                                   |
| Money math  | dinero.js (amounts stored as `bigint` minor units)                   |
| Lint/format | Biome (no ESLint, no Prettier)                                       |

---

## Prerequisites

- Node.js 20+
- pnpm 9+ (this repo is pnpm-only — `npm` and `yarn` will not work)
- A Neon Postgres database (free tier fine)
- A Resend account (for transactional email)

---

## Quick start

```bash
pnpm install
cp .env.example .env.local      # fill in DATABASE_URL, auth secrets, Resend key
pnpm dev                        # http://localhost:3000
```

See `.env.example` for the full list of required environment variables.

---

## Scripts

```bash
pnpm dev          # Next.js dev server (Turbopack)
pnpm build        # production build
pnpm start        # production server
pnpm lint         # biome check .
pnpm lint:fix     # biome check --write .
pnpm format       # biome format --write .
pnpm typecheck    # tsc --noEmit
```

Database, test, and e2e scripts will land as those layers are wired up.

---

## Project layout

```
app/
  (marketing)/    public landing — / , /privacy, /terms
  (auth)/         login, signup, OTP, password reset
  (app)/          authenticated app shell (gated by proxy.ts)
  (master)/       internal admin panel (role-gated)
  api/            route handlers (auth callbacks, SSE, cron)
components/
  expense, settlement, workspace, master, marketing, ui, providers
lib/
  actions/        Server Actions ('use server')
  auth/           Better Auth config + helpers
  db/             Drizzle schema + client
  queries/        cached reads (unstable_cache + tags)
  validation/     Zod schemas
emails/           Resend templates
tests/            unit + e2e
proxy.ts          Next 16 edge proxy (session-cookie gate)
```

---

## Conventions

- **Server Components by default.** Add `'use client'` only when needed.
- **No `useEffect` for data fetching.** Use Server Components, Server Actions, or TanStack Query.
- **Money is `bigint` in minor units** (paise/cents). Never `number`.
- **IDs are UUID v7** via `crypto.randomUUID()`.
- **Migrations:** `pnpm db:generate` (never hand-edit SQL). Two-step renames. Never `DROP TABLE` without explicit approval.
- **Branching:** work on `feat/*`, `fix/*`, `chore/*` branches and open a PR to `main`. Direct pushes to `main` are reserved for emergencies.

---

## Docs

Full project spec (`PROMPT.md`, `PRODUCT.md`, `DESIGN.md`, `tracxo-reference.pdf`) lives in `docs/` — **local only, not committed**. Ask the maintainer for the latest copy.

---

## License

Private — all rights reserved.
