import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify",
  "/privacy",
  "/terms",
]);

const PUBLIC_PREFIXES = [
  "/invite/",
  "/api/auth/",
  "/api/cron/",
  "/api/health",
  "/_next/",
  "/static/",
];

// Better Auth default session cookie name. Update if better-auth config overrides it.
const SESSION_COOKIE = "better-auth.session_token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.cookies.get(SESSION_COOKIE);

  // (app) and (master) require a session. Master role is re-verified in the
  // (master) layout via withMasterAuth — cookie alone cannot prove role.
  // See docs/PROMPT.md §15.4: middleware is not the trust boundary, server
  // actions and route guards re-check.
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on every path except Next static assets, image optimizer, and files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
