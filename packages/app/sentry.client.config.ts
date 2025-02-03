// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { replayIntegration } from "@sentry/nextjs";

const ENVIRONMENT = process.env.NEXT_PUBLIC_EGAPRO_ENV || "development";
const IS_PRODUCTION = ENVIRONMENT === "production";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: ENVIRONMENT,
  tunnel: "/api/monitoring/envelope",
  // Optimal sample rates based on environment
  tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 0.5,

  debug: true, // Temporarily enable debug mode to troubleshoot

  // Development-specific settings
  maxBreadcrumbs: 10,
  autoSessionTracking: false,
  sendClientReports: true, // Enable immediate client reports
  sampleRate: 1.0, // Capture all errors in development

  // Enable performance monitoring through traces
  enableTracing: true,

  beforeSend(event) {
    console.log("Sentry beforeSend called with event:", {
      eventId: event.event_id,
      type: event.type,
      exception: event.exception?.values?.[0],
      environment: event.environment,
    });

    // Filter out non-error events in production
    if (IS_PRODUCTION && !event.exception) {
      console.log("Filtering out non-error event in production");
      return null;
    }

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

  integrations: [
    replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
