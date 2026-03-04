import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
	environment: process.env.NEXT_PUBLIC_EGAPRO_ENV,

	// Capture 100% of traces in dev, adjust in production (e.g., 0.1 for 10%)
	tracesSampleRate: 1.0,

	// Enable Sentry whenever a DSN is configured (dev + prod)
	enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
