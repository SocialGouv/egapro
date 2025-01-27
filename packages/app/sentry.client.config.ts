// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { Replay } from "@sentry/replay";

const ENVIRONMENT = process.env.EGAPRO_ENV || "development";
const IS_PRODUCTION = ENVIRONMENT === "production";

Sentry.init({
  dsn: "https://28b6186c058a49fc94ee665667e44612@sentry.fabrique.social.gouv.fr/99",
  environment: ENVIRONMENT,

  // Optimal sample rates based on environment
  tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: IS_PRODUCTION ? 0.1 : 0.5,

  debug: !IS_PRODUCTION,

  // Enable performance monitoring through traces
  enableTracing: true,

  // Track releases for better error monitoring
  release: process.env.NEXT_PUBLIC_GITHUB_SHA || "development",

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

  integrations: [
    new Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
