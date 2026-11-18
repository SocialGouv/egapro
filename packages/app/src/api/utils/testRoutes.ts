import "server-only";

const TEST_ROUTES_ENVS = ["dev"];
const CRASH_TEST_ENVS = ["dev", "preprod"];

/**
 * E2E helper routes (session bypass, test data cleanup) only exist on review apps (dev).
 * They are publicly reachable under `/apiv2/…` (rewritten to `/api/…` by Next), so preprod must not expose them.
 * Reads the raw env var on purpose: `config.env` defaults to "dev" when it is missing,
 * which would enable these routes on a misconfigured production deployment.
 */
export const areTestRoutesEnabled = () => TEST_ROUTES_ENVS.includes(process.env.NEXT_PUBLIC_EGAPRO_ENV ?? "");

/**
 * Crash generator used by the Sentry recette: dev and preprod, never production.
 * Reads the raw env var for the same reason as above.
 */
export const areCrashTestsEnabled = () => CRASH_TEST_ENVS.includes(process.env.NEXT_PUBLIC_EGAPRO_ENV ?? "");
