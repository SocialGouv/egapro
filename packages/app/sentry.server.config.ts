import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

	// Performance Monitoring
	tracesSampleRate: 1.0, // Adjust in production (e.g., 0.1 for 10%)

	// Only send errors in production
	enabled: process.env.NODE_ENV === "production",
});
