"use client";

import { useEffect, useState } from "react";

import { formatDateTime, timeAgo } from "@/lib/dates";

// Hydration-safe relative timestamp. SSR and the first client render both
// see `now === null` and emit the same deterministic absolute time, so there
// is nothing to mismatch; the relative form only appears after mount.
export function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);

  return (
    <time dateTime={iso} className={className}>
      {now === null ? formatDateTime(iso) : timeAgo(iso, now)}
    </time>
  );
}
