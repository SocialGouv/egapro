// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { commonConfig } from "./sentry.config.common";

Sentry.init({
  ...commonConfig,

  // Server-specific settings
  integrations: [
    Sentry.httpIntegration(),
    Sentry.expressIntegration(),
    Sentry.onUncaughtExceptionIntegration(),
    Sentry.onUnhandledRejectionIntegration()
  ],

  // Additional server configuration
  autoSessionTracking: true,
  serverName: process.env.HOSTNAME,
  
  // Specific sampling for server-side
  tracesSampler: (samplingContext) => {
    // Adjust sampling based on the operation
    if (samplingContext.transactionContext?.name?.includes("healthcheck")) {
      return 0.0; // Don't sample healthchecks
    }
    if (samplingContext.transactionContext?.name?.includes("/api/")) {
      return 0.5; // Sample 50% of API calls
    }
    return 0.1; // Default sample rate
  },
});
