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

function buildNotificationsDatabaseUrl() {
	if (process.env.NOTIFICATIONS_DATABASE_URL)
		return process.env.NOTIFICATIONS_DATABASE_URL;

	const {
		NOTIFICATIONS_POSTGRES_USER,
		NOTIFICATIONS_POSTGRES_PASSWORD,
		NOTIFICATIONS_POSTGRES_HOST,
		NOTIFICATIONS_POSTGRES_PORT,
		NOTIFICATIONS_POSTGRES_DB,
		NOTIFICATIONS_POSTGRES_SSLMODE,
	} = process.env;

	if (NOTIFICATIONS_POSTGRES_HOST && NOTIFICATIONS_POSTGRES_DB) {
		const user = encodeURIComponent(NOTIFICATIONS_POSTGRES_USER ?? "postgres");
		const password = NOTIFICATIONS_POSTGRES_PASSWORD
			? `:${encodeURIComponent(NOTIFICATIONS_POSTGRES_PASSWORD)}`
			: "";
		const port = NOTIFICATIONS_POSTGRES_PORT ?? "5432";
		const sslmode = NOTIFICATIONS_POSTGRES_SSLMODE
			? `?sslmode=${NOTIFICATIONS_POSTGRES_SSLMODE}`
			: "";
		return `postgresql://${user}${password}@${NOTIFICATIONS_POSTGRES_HOST}:${port}/${NOTIFICATIONS_POSTGRES_DB}${sslmode}`;
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
		// Dedicated PG for the notifications queue (pg-boss). Optional by
		// design: if the URL is missing or the DB is unreachable, the app
		// keeps working — enqueue calls degrade gracefully (audit "failure",
		// no email sent) instead of blocking the business mutation.
		NOTIFICATIONS_DATABASE_URL: z.string().url().optional(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		EGAPRO_PROCONNECT_CLIENT_ID: z.string(),
		EGAPRO_PROCONNECT_CLIENT_SECRET: z.string(),
		EGAPRO_PROCONNECT_ISSUER: z.string().url(),
		EGAPRO_WEEZ_API_URL: z.string().url(),
		EGAPRO_SUIT_API_URL: z.string().url(),
		// Shared secret injected by the APISIX gateway (plugin `proxy-rewrite`)
		// into `X-Gateway-Forwarded` on every SUIT request it proxies. The
		// middleware (`src/middleware.ts`) verifies this header on
		// `/api/v1/:path*` as a belt-and-suspenders protection against any
		// in-cluster pod hitting the app pod directly and bypassing APISIX's
		// Bearer auth + rate-limit. Stored in the `suit` sealed-secret and
		// mounted on both the APISIX pod (to inject) and the app pod (to verify).
		EGAPRO_GATEWAY_SHARED_SECRET: z.string().min(32),
		S3_ENDPOINT: z.string().url(),
		S3_REGION: z.string(),
		S3_ACCESS_KEY_ID: z.string(),
		S3_SECRET_ACCESS_KEY: z.string(),
		S3_BUCKET_NAME: z.string(),
		CLAMAV_HOST: z.string(),
		CLAMAV_PORT: z.coerce.number(),
		NEXTAUTH_URL: z.string().url(),
		EGAPRO_GIP_MDS_API_URL: z.string().url().optional(),
		EGAPRO_GIP_MDS_API_TOKEN: z.string().optional(),
		EGAPRO_MOCK_SUIT_SANCTION: z.coerce.boolean().optional().default(false),
		/**
		 * Comma-separated list of emails that should be granted the admin role
		 * on login. The flag is then persisted in the `app_user.is_admin` column.
		 */
		ADMIN_EMAILS: z.string().optional().default(""),
		// Audit log (issue #3174) — retention thresholds (CNIL: 6 months for
		// access logs, 12 months for security logs). Consumed directly by the
		// audit-cleanup CronJob (packages/app/scripts/audit-cleanup.mjs, issue
		// #3268) — no HTTP trigger in play anymore.
		EGAPRO_AUDIT_RETENTION_SHORT_DAYS: z.coerce
			.number()
			.int()
			.positive()
			.default(180),
		EGAPRO_AUDIT_RETENTION_LONG_DAYS: z.coerce
			.number()
			.int()
			.positive()
			.default(365),
		MAIL_ENABLED: z
			.enum(["true", "false"])
			.default("false")
			.transform((v) => v === "true"),
		SMTP_HOST: z.string().optional().default(""),
		SMTP_PORT: z.coerce.number().int().positive().default(1025),
		SMTP_USER: z.string().optional(),
		SMTP_PASS: z.string().optional(),
		SMTP_SECURE: z
			.string()
			.default("false")
			.transform((v) => v.toLowerCase() === "true"),
		MAIL_FROM: z.string().default("no-reply@egapro.local"),
		// pg-boss tunables — retryLimit + retryBackoff control the per-job
		// retry policy. retryDelay is the base backoff in seconds; pg-boss
		// applies an exponential factor when retryBackoff=true.
		NOTIFICATIONS_RETRY_LIMIT: z.coerce.number().int().positive().default(5),
		NOTIFICATIONS_RETRY_DELAY_SECONDS: z.coerce
			.number()
			.int()
			.positive()
			.default(60),
		NOTIFICATIONS_WORKER_BATCH_SIZE: z.coerce
			.number()
			.int()
			.positive()
			.default(10),
		// Valkey cache URL — optional. When absent, the custom
		// cache handler (cache-handler.cjs) gracefully degrades to no-op.
		// The handler reads process.env.VALKEY_URL directly (it runs outside
		// the app module graph), but we declare it here for validation and docs.
		VALKEY_URL: z.url().optional(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_EGAPRO_ENV: z
			.enum(["dev", "preprod", "prod"])
			.optional()
			.default("dev"),
		NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
		NEXT_PUBLIC_SENTRY_RELEASE: z.string().optional(),
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
		NOTIFICATIONS_DATABASE_URL: buildNotificationsDatabaseUrl(),
		NODE_ENV: process.env.NODE_ENV,
		EGAPRO_PROCONNECT_CLIENT_ID: process.env.EGAPRO_PROCONNECT_CLIENT_ID,
		EGAPRO_PROCONNECT_CLIENT_SECRET:
			process.env.EGAPRO_PROCONNECT_CLIENT_SECRET,
		EGAPRO_PROCONNECT_ISSUER: process.env.EGAPRO_PROCONNECT_ISSUER,
		EGAPRO_WEEZ_API_URL: process.env.EGAPRO_WEEZ_API_URL,
		EGAPRO_SUIT_API_URL: process.env.EGAPRO_SUIT_API_URL,
		EGAPRO_GATEWAY_SHARED_SECRET: process.env.EGAPRO_GATEWAY_SHARED_SECRET,
		S3_ENDPOINT: process.env.S3_ENDPOINT,
		S3_REGION: process.env.S3_REGION,
		S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
		S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
		S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
		CLAMAV_HOST: process.env.CLAMAV_HOST,
		CLAMAV_PORT: process.env.CLAMAV_PORT,
		NEXTAUTH_URL: process.env.NEXTAUTH_URL,
		EGAPRO_GIP_MDS_API_URL: process.env.EGAPRO_GIP_MDS_API_URL,
		EGAPRO_GIP_MDS_API_TOKEN: process.env.EGAPRO_GIP_MDS_API_TOKEN,
		EGAPRO_MOCK_SUIT_SANCTION: process.env.EGAPRO_MOCK_SUIT_SANCTION,
		ADMIN_EMAILS: process.env.ADMIN_EMAILS,
		EGAPRO_AUDIT_RETENTION_SHORT_DAYS:
			process.env.EGAPRO_AUDIT_RETENTION_SHORT_DAYS,
		EGAPRO_AUDIT_RETENTION_LONG_DAYS:
			process.env.EGAPRO_AUDIT_RETENTION_LONG_DAYS,
		MAIL_ENABLED: process.env.MAIL_ENABLED,
		SMTP_HOST: process.env.SMTP_HOST,
		SMTP_PORT: process.env.SMTP_PORT,
		SMTP_USER: process.env.SMTP_USER,
		SMTP_PASS: process.env.SMTP_PASS,
		SMTP_SECURE: process.env.SMTP_SECURE,
		MAIL_FROM: process.env.MAIL_FROM,
		NOTIFICATIONS_RETRY_LIMIT: process.env.NOTIFICATIONS_RETRY_LIMIT,
		NOTIFICATIONS_RETRY_DELAY_SECONDS:
			process.env.NOTIFICATIONS_RETRY_DELAY_SECONDS,
		NOTIFICATIONS_WORKER_BATCH_SIZE:
			process.env.NOTIFICATIONS_WORKER_BATCH_SIZE,
		VALKEY_URL: process.env.VALKEY_URL,
		NEXT_PUBLIC_EGAPRO_ENV: process.env.NEXT_PUBLIC_EGAPRO_ENV,
		NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
		NEXT_PUBLIC_SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
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
