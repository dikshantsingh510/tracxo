"use client";

import { useEffect } from "react";

import { ErrorView } from "@/components/shared/error-view";

// Sits next to master/layout.tsx so crashes render inside the master shell.
export default function MasterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("(master) segment error:", error.digest ?? error);
  }, [error]);

  return (
    <ErrorView
      title="Something went wrong"
      description="This admin page hit an unexpected error. Try again, or head back to the overview."
      reset={reset}
      homeHref="/master"
    />
  );
}
