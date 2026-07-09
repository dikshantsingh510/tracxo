"use client";

import { useEffect } from "react";

import { ErrorView } from "@/components/shared/error-view";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("(auth) segment error:", error.digest ?? error);
  }, [error]);

  return (
    <ErrorView
      title="Something went wrong signing you in"
      description="An unexpected error interrupted the flow. Try again, or return to the login page."
      reset={reset}
      homeHref="/login"
    />
  );
}
