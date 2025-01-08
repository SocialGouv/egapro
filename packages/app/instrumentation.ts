import type * as Sentry from '@sentry/nextjs';

export function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = require("@sentry/nextjs");
    const { commonConfig } = require("./sentry.config.common");

    Sentry.init({
      ...commonConfig,
      
      // Edge-specific settings
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
      ],

      // Specific sampling for edge runtime
      tracesSampler: ({name}: {name: string}) => {
        if (name.includes("/_next/")) {
          return 0.0; // Don't sample Next.js internal requests
        }
        return 0.1; // Default sample rate
      },
    });
  }
}
