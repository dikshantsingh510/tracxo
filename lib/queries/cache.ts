import "server-only";

import { unstable_cache } from "next/cache";

// `unstable_cache` JSON-serializes its return value, and JSON.stringify throws
// on `bigint` ("Do not know how to serialize a BigInt"). Money is stored as
// bigint minor units everywhere, so any cached money query would crash.
//
// This wrapper serializes the result ourselves with a bigint-aware replacer
// (so what `unstable_cache` stores is a plain JSON string) and revives bigints
// on the way out — keeping the bigint API intact at the call boundary.

const BIGINT_TAG = "__bigint__";

function replacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? { [BIGINT_TAG]: value.toString() } : value;
}

function reviver(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && BIGINT_TAG in value) {
    return BigInt((value as Record<string, string>)[BIGINT_TAG]);
  }
  return value;
}

export async function cachedJson<R>(
  thunk: () => Promise<R>,
  keyParts: string[],
  options: { tags: string[] },
): Promise<R> {
  const json = await unstable_cache(
    async () => JSON.stringify(await thunk(), replacer),
    keyParts,
    options,
  )();
  return JSON.parse(json, reviver) as R;
}
