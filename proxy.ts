import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
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

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // `getSessionCookie` handles cookiePrefix + __Secure- prefix automatically,
  // so this stays in sync with lib/auth/index.ts without hardcoding. Note:
  // presence-check only — server actions / route guards re-verify via
  // `withAuth` since the cookie is signed but not validated here.
  // See PROMPT.md §15.4: proxy is not the trust boundary.
  const sessionCookie = getSessionCookie(req, { cookiePrefix: "tracxo" });

  if (!sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname + req.nextUrl.search);
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
