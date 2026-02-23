import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		AUTH_SECRET: z.string().optional(),
		DATABASE_URL: z.string().url().optional(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		EGAPRO_PROCONNECT_CLIENT_ID: z.string().optional(),
		EGAPRO_PROCONNECT_CLIENT_SECRET: z.string().optional(),
		EGAPRO_PROCONNECT_ISSUER: z.string().url().optional(),
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
		DATABASE_URL: process.env.DATABASE_URL,
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
