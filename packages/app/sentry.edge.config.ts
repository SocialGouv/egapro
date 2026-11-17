// This file configures the initialization of Sentry for edge runtimes
// The config you add here will be used whenever your app runs on the edge

import { SENTRY_DATA_COLLECTION } from "@common/sentryDataCollection";
import { SENTRY_ENVIRONMENT, SENTRY_IS_PRODUCTION, SENTRY_SAMPLE_RATES } from "@common/sentryConfig";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Basic configuration
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  debug: false,
  dist: process.env.NEXT_PUBLIC_GITHUB_SHA || "dev",

  dataCollection: SENTRY_DATA_COLLECTION,

  // Performance monitoring and source maps
  attachStacktrace: true, // Attach stack traces to all messages
  normalizeDepth: 10, // Increase stack trace depth for better context
  tracesSampleRate: SENTRY_SAMPLE_RATES.traces,
  maxBreadcrumbs: 100, // Increase from default 100 to capture more context

  // Error tracking configuration
  sampleRate: SENTRY_SAMPLE_RATES.errors,

  beforeSend(event) {
    // Filter out non-error events in production
    if (SENTRY_IS_PRODUCTION && !event.exception) return null;

    // Filter out known unnecessary errors
    const ignoreErrors = [
      "ResizeObserver loop limit exceeded",
      "Network request failed",
      /^Loading chunk .* failed/,
      /^Loading CSS chunk .* failed/,
    ];

    if (
      event.exception &&
      ignoreErrors.some(pattern => {
        if (typeof pattern === "string") {
          return event.exception?.values?.[0]?.value?.includes(pattern);
        }
        return pattern.test(event.exception?.values?.[0]?.value || "");
      })
    ) {
      return null;
    }

    return event;
  },
});
