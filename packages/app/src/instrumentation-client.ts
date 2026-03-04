import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
	environment: process.env.NEXT_PUBLIC_EGAPRO_ENV,

	// Capture 100% of traces in dev, adjust in production (e.g., 0.1 for 10%)
	tracesSampleRate: 1.0,

	// Session Replay: sample 10% of sessions, 100% on error
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,

	integrations: [Sentry.replayIntegration()],

	// Enable Sentry whenever a DSN is configured (dev + prod)
	enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});

// Capture route transitions for performance tracing in App Router
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
