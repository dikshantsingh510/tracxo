# Tests

Three layers — run separately or together.

## Setup

Integration + e2e tests require a separate Neon branch so they can `TRUNCATE` freely without touching dev data.

1. In Neon console: Branches → "Create branch from main".
2. Copy the new branch's HTTP connection string.
3. Add to `.env.local`:
   ```
   DATABASE_URL_TEST=postgres://user:pass@host/db?sslmode=require
   ```
4. (e2e only, on first run) `pnpm exec playwright install chromium`.

If `DATABASE_URL_TEST` is unset, integration tests skip themselves and e2e tests will error on boot.

## Commands

| Command | What it runs |
|---|---|
| `pnpm test` | Vitest — unit + integration |
| `pnpm test:unit` | Vitest unit project only (no DB) |
| `pnpm test:integration` | Vitest integration project only |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:cov` | Vitest + v8 coverage |
| `pnpm e2e` | Playwright (boots dev server on port 3100 against test DB) |
| `pnpm e2e:ui` | Playwright in interactive UI mode |

## Layout

```
tests/
├── unit/                      # zero-IO, fast
│   └── validation/*.test.ts
├── integration/               # against DATABASE_URL_TEST
│   ├── _setup.ts              # truncate + migrate
│   ├── actions/*.test.ts
│   └── workspace/*.test.ts
├── e2e/                       # Playwright, against booted dev server
│   ├── helpers/{auth,db}.ts
│   └── *.spec.ts
└── utils/                     # shared helpers (mock-next, seed)
```

## Conventions

- **Unit tests** — pure logic, validation schemas, formatting. No mocks (you don't need them).
- **Integration tests** — call Server Actions directly. Module mocks for `next/cache` (no Next request context) and `@/lib/auth/server` (controllable session). DB truncated before each test.
- **E2E tests** — drive the real browser through the real app. OTP is read from the `verification` table since email transport is stubbed until PR #15.

## Adding new tests

- Validation changes → add a unit test.
- New Server Action → add an integration test next to the existing ones (cover happy path + permission boundary + invalid input).
- New user-visible flow → add an e2e test covering the golden path.
