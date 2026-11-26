import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import {
	replayEventPrivacyIntegration,
	resolveTracesSampleRate,
	sentryPrivacyOptions,
	sentryReplayPrivacyOptions,
} from "~/modules/observability";

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Zod probes `new Function` to compile object parsers, which the CSP refuses and reports on every page.
z.config({ jitless: true });

Sentry.init({
	dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
	release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
	environment: process.env.NEXT_PUBLIC_EGAPRO_ENV,

	// The server-only knob cannot reach the browser bundle; the browser keeps
	// the same production/non-production default (0.1 / 1.0) — #5199.
	tracesSampleRate: resolveTracesSampleRate({ nodeEnv: process.env.NODE_ENV }),

	// Session Replay: sample 10% of sessions, 100% on error
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,

	integrations: [
		Sentry.replayIntegration(sentryReplayPrivacyOptions),
		replayEventPrivacyIntegration,
	],

	// Enable Sentry whenever a DSN is configured (dev + prod)
	enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

	...sentryPrivacyOptions,
});
