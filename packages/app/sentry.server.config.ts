// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { config } from "@common/config";
import * as Sentry from "@sentry/nextjs";

const ENVIRONMENT = config.env;
const IS_PRODUCTION = ENVIRONMENT === "production";

// Check for Cypress test environment
const isCypressTest = process.env.CYPRESS === "true";

Sentry.init({
  // Basic configuration
  dsn: isCypressTest ? undefined : config.sentry.dsn, // Disable Sentry in Cypress
  environment: ENVIRONMENT,
  debug: true, // Temporarily enable debug mode to troubleshoot
  dist: config.githubSha,

  // Performance monitoring and source maps
  // enableTracing: true,
  enableTracing: false, // temp disable trying to reduce race condition error bubbling up
  attachStacktrace: true, // Attach stack traces to all messages
  normalizeDepth: 10, // Increase stack trace depth for better context
  tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0, // Sample 10% of traces in prod, all in dev
  maxBreadcrumbs: 100, // Increase from default 100 to capture more context

  // Error tracking configuration
  sampleRate: 0.1,
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
