// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const ENVIRONMENT = process.env.NEXT_PUBLIC_EGAPRO_ENV || "development";
const IS_PRODUCTION = ENVIRONMENT === "production";

Sentry.init({
  // Basic configuration
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: ENVIRONMENT,
  debug: true, // Temporarily enable debug mode to troubleshoot

  // Performance monitoring
  enableTracing: true,
  tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0, // Sample 10% of traces in prod, all in dev

  // Error tracking configuration
  sampleRate: 1.0, // Capture all errors
  autoSessionTracking: true, // Enable automatic session tracking
  sendClientReports: true, // Enable immediate client reports

  beforeSend(event) {
    // Filter out non-error events in production
    if (IS_PRODUCTION && !event.exception) return null;

    // Filter out known unnecessary errors
    const ignoreErrors = [
      "ResizeObserver loop limit exceeded",
      "Network request failed",
      /^Loading chunk .* failed/,
      /^Loading CSS chunk .* failed/,
      /^ECONNREFUSED/,
      /^ECONNRESET/,
      /^ETIMEDOUT/,
      "Database connection timeout",
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
