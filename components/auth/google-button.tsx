"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth/client";
import { useState } from "react";
import { toast } from "sonner";

export function GoogleButton({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL: next });
    } catch (err) {
      toast.error("Could not start Google sign-in");
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="group h-11 w-full justify-center gap-2.5 rounded-xl font-medium text-base transition hover:shadow-md"
      onClick={onClick}
      disabled={loading}
    >
      <GoogleIcon className="size-5 transition-transform group-hover:scale-110" />
      {loading ? "Opening Google…" : "Continue with Google"}
    </Button>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden focusable="false">
      <title>Google</title>
      <path
        d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.51h3.232c1.89-1.741 2.981-4.305 2.981-7.351Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.964-.895 6.618-2.422l-3.232-2.51c-.896.6-2.041.955-3.386.955-2.605 0-4.81-1.76-5.598-4.123H3.064v2.59A9.997 9.997 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.402 13.9A6.005 6.005 0 0 1 6.09 12c0-.66.114-1.3.312-1.9V7.51H3.064A9.997 9.997 0 0 0 2 12c0 1.614.386 3.14 1.064 4.49l3.338-2.59Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.977c1.47 0 2.787.506 3.823 1.5l2.868-2.868C16.96 2.99 14.696 2 12 2 8.075 2 4.682 4.244 3.064 7.51l3.338 2.59C7.19 7.737 9.395 5.977 12 5.977Z"
        fill="#EA4335"
      />
    </svg>
  );
}
