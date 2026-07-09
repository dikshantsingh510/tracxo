"use client";

import { useEffect } from "react";

import { ErrorView } from "@/components/shared/error-view";

// Segment boundary: renders inside the (app) layout, so the sidebar and
// topbar survive a crash in any workspace page.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("(app) segment error:", error.digest ?? error);
  }, [error]);

  return (
    <ErrorView
      title="Something went wrong"
      description="This page hit an unexpected error. Your data is safe — try again, or head back to your workspaces."
      reset={reset}
      homeHref="/workspaces"
    />
  );
}
