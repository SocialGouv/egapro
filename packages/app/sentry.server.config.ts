// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Guard import to allow disabling Sentry instrumentation during debugging.
// When SENTRY_DISABLED=true we avoid importing @sentry/nextjs entirely to
// prevent build/runtime instrumentation hooks (eg. require-in-the-middle) from
// being evaluated.
let Sentry: any = undefined;
if (process.env.SENTRY_DISABLED === "true") {
  // Sentry disabled: do not import or initialize
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require("@sentry/nextjs");
}

const ENVIRONMENT = process.env.NEXT_PUBLIC_EGAPRO_ENV || "development";
const IS_PRODUCTION = ENVIRONMENT === "production";

// Check for Cypress test environment
const isCypressTest = process.env.CYPRESS === "true";

Sentry.init({
  // Basic configuration
  dsn: isCypressTest ? undefined : process.env.NEXT_PUBLIC_SENTRY_DSN, // Disable Sentry in Cypress
  environment: ENVIRONMENT,
  debug: true, // Temporarily enable debug mode to troubleshoot
  dist: process.env.NEXT_PUBLIC_GITHUB_SHA || "dev",

  // Performance monitoring and source maps
  attachStacktrace: true, // Attach stack traces to all messages
  normalizeDepth: 10, // Increase stack trace depth for better context
  tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0, // Sample 10% of traces in prod, all in dev
  maxBreadcrumbs: 100, // Increase from default 100 to capture more context

  // Error tracking configuration
  sampleRate: 0.1,
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
      "Hydration failed",
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
