// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { browserTracingIntegration, browserProfilingIntegration, replayIntegration } from "@sentry/nextjs";
import { commonConfig } from "./sentry.config.common";

Sentry.init({
  ...commonConfig,

  // Session Replay configuration
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  integrations: [
    replayIntegration({
      // Privacy settings
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
      
      // Network
      networkDetailAllowUrls: [
        // Add allowed URLs for network capturing
        "https://api.egapro.fabrique.social.gouv.fr",
      ],
      networkRequestHeaders: ["method", "referrer"],
      networkResponseHeaders: ["content-type", "content-length"],
    }),
    browserTracingIntegration(),
    browserProfilingIntegration(),
  ],
    tracePropagationTargets: [
      "localhost",
      "egapro.fabrique.social.gouv.fr",
    ],
  // Enable profiling
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
