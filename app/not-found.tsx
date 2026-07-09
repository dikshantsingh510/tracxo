import { Compass } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

// Root not-found: also the landing spot for requireMaster()'s notFound(),
// so it must not leak whether a master route exists.
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="surface-acrylic-light flex max-w-md flex-col items-center gap-4 rounded-2xl px-8 py-12 text-center">
        <Compass aria-hidden strokeWidth={1.75} className="size-12 text-muted-foreground" />
        <div className="flex max-w-sm flex-col gap-2">
          <h1 className="font-semibold text-foreground text-xl tracking-tight">Page not found</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The page you're looking for doesn't exist or has moved.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/">Go home</Link>} />
      </div>
    </div>
  );
}
