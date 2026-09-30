import "server-only";

const TEST_ROUTES_ENVS = ["dev", "preprod"];

/**
 * E2E helper routes (session bypass, test data cleanup) only exist on dev and preprod.
 * Reads the raw env var on purpose: `config.env` defaults to "dev" when it is missing,
 * which would enable these routes on a misconfigured production deployment.
 */
export const areTestRoutesEnabled = () => TEST_ROUTES_ENVS.includes(process.env.NEXT_PUBLIC_EGAPRO_ENV ?? "");
