import { vi } from "vitest";

// Vitest hoists `vi.mock(...)` to the top of the importing file. Because of
// that, mocks live next to the test file, not here. This module just exports
// helpers for *configuring* those mocks once they're installed.

export type FakeSessionUser = {
  id: string;
  email: string;
  name: string;
  role?: "user" | "master";
  emailVerified?: boolean;
  defaultCurrency?: string;
};

export type FakeSession = {
  user: FakeSessionUser;
  session: { id: string; userId: string; expiresAt: Date };
};

export function buildSession(user: FakeSessionUser): FakeSession {
  return {
    user: { role: "user", emailVerified: true, defaultCurrency: "INR", ...user },
    session: {
      id: `sess_${user.id}`,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000 * 60),
    },
  };
}

// Convenience for tests: set the current session that `withAuth` will see.
// Pass `null` to simulate signed-out.
export async function setMockSession(session: FakeSession | null): Promise<void> {
  const mod = await import("@/lib/auth/server");
  vi.mocked(mod.getSession).mockResolvedValue(session as never);
}
