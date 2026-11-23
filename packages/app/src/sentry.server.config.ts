import * as Sentry from "@sentry/nextjs";
import {
	sentryPrivacyOptions,
	sentryTracesSampleRate,
} from "~/modules/observability";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
	environment: process.env.NEXT_PUBLIC_EGAPRO_ENV,

	tracesSampleRate: sentryTracesSampleRate(process.env.NEXT_PUBLIC_EGAPRO_ENV),

	// Enable Sentry whenever a DSN is configured (dev + prod)
	enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

	...sentryPrivacyOptions,
});
