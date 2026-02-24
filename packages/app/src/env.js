import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Build DATABASE_URL from individual POSTGRES_* env vars when not provided directly.
 * This is needed because Kubernetes provides individual PG connection parameters via the pg-app secret.
 */
function buildDatabaseUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

	const {
		POSTGRES_USER,
		POSTGRES_PASSWORD,
		POSTGRES_HOST,
		POSTGRES_PORT,
		POSTGRES_DB,
		POSTGRES_SSLMODE,
	} = process.env;

	if (POSTGRES_HOST && POSTGRES_DB) {
		const user = encodeURIComponent(POSTGRES_USER ?? "postgres");
		const password = POSTGRES_PASSWORD
			? `:${encodeURIComponent(POSTGRES_PASSWORD)}`
			: "";
		const port = POSTGRES_PORT ?? "5432";
		const sslmode = POSTGRES_SSLMODE ? `?sslmode=${POSTGRES_SSLMODE}` : "";
		return `postgresql://${user}${password}@${POSTGRES_HOST}:${port}/${POSTGRES_DB}${sslmode}`;
	}

	return undefined;
}

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		AUTH_SECRET: z.string(),
		DATABASE_URL: z.string().url(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		EGAPRO_PROCONNECT_CLIENT_ID: z.string(),
		EGAPRO_PROCONNECT_CLIENT_SECRET: z.string(),
		EGAPRO_PROCONNECT_ISSUER: z.string().url(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
		NEXT_PUBLIC_MATOMO_URL: z.string().url().optional(),
		NEXT_PUBLIC_MATOMO_SITE_ID: z.string().optional(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		AUTH_SECRET: process.env.AUTH_SECRET,
		DATABASE_URL: buildDatabaseUrl(),
		NODE_ENV: process.env.NODE_ENV,
		EGAPRO_PROCONNECT_CLIENT_ID: process.env.EGAPRO_PROCONNECT_CLIENT_ID,
		EGAPRO_PROCONNECT_CLIENT_SECRET:
			process.env.EGAPRO_PROCONNECT_CLIENT_SECRET,
		EGAPRO_PROCONNECT_ISSUER: process.env.EGAPRO_PROCONNECT_ISSUER,
		NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
		NEXT_PUBLIC_MATOMO_URL: process.env.NEXT_PUBLIC_MATOMO_URL,
		NEXT_PUBLIC_MATOMO_SITE_ID: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
