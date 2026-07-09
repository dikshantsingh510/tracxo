"use client";

import { useEffect } from "react";

import "./globals.css";

// Last-resort boundary: replaces the root layout entirely, so it must render
// its own <html>/<body> and stay dependency-light (no ThemeProvider — tokens
// below work in both light and dark via the class-less :root defaults).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("global error:", error.digest ?? error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 antialiased">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card px-8 py-12 text-center">
          <h1 className="font-semibold text-foreground text-xl tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The app hit an unexpected error and could not recover. Reloading usually fixes it.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="h-8 rounded-lg bg-primary px-3 font-medium text-primary-foreground text-sm"
            >
              Try again
            </button>
            <a
              href="/"
              className="flex h-8 items-center rounded-lg border border-border bg-background px-3 font-medium text-foreground text-sm"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
