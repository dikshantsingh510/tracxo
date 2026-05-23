// Empty stub for the `server-only` package, which throws at import time when
// pulled into client bundles. In Vitest there is no Next build pipeline to
// strip it, so we alias the import to this no-op via vitest.config.ts.
export {};
