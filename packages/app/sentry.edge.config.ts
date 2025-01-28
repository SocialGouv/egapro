// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const ENVIRONMENT = process.env.NEXT_PUBLIC_EGAPRO_ENV || "dev";
const IS_PRODUCTION = ENVIRONMENT === "production";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: ENVIRONMENT,

  // Optimal sample rates based on environment
  tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable performance monitoring through traces
  enableTracing: true,

  // Track releases for better error monitoring
  release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_GITHUB_SHA || ENVIRONMENT,

  beforeSend(event) {
    // Filter out non-error events in production
    if (IS_PRODUCTION && !event.exception) return null;

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
