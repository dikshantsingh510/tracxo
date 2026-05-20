import "server-only";

import { type Session, getSession } from "./server";

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

// Wraps a Server Action so the session is fetched + verified before the action
// body runs. Per PROMPT.md §15.4, every mutation Server Action MUST go through
// `withAuth` — proxy.ts only gates page navigation, not action POSTs.
//
// Usage:
//   export const createExpense = withAuth(async (session, input: CreateInput) => {
//     // session.user.id is guaranteed here
//   });
export function withAuth<Args extends unknown[], Result>(
  action: (session: Session, ...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => {
    const session = await getSession();
    if (!session) throw new UnauthorizedError();
    return action(session, ...args);
  };
}

// Same as `withAuth` but also requires the user to have the `master` role.
// Used by Server Actions under `(master)/master`.
export function withMasterAuth<Args extends unknown[], Result>(
  action: (session: Session, ...args: Args) => Promise<Result>,
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => {
    const session = await getSession();
    if (!session) throw new UnauthorizedError();
    if (session.user.role !== "master") throw new ForbiddenError();
    return action(session, ...args);
  };
}
