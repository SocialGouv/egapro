import * as Sentry from "@sentry/nextjs";
import {
	resolveTracesSampleRate,
	sentryPrivacyOptions,
} from "~/modules/observability";

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
	environment: process.env.NEXT_PUBLIC_EGAPRO_ENV,

	// 10 % of transactions in production, 100 % elsewhere unless overridden by
	// SENTRY_TRACES_SAMPLE_RATE (#5199).
	tracesSampleRate: resolveTracesSampleRate({
		nodeEnv: process.env.NODE_ENV,
		override: process.env.SENTRY_TRACES_SAMPLE_RATE,
	}),

	// Enable Sentry whenever a DSN is configured (dev + prod)
	enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

	...sentryPrivacyOptions,
});
