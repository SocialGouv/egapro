export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize Sentry for server-side
    const Sentry = await import("@sentry/nextjs");

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
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Initialize Sentry for edge runtime
    const Sentry = await import("@sentry/nextjs");

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
  }
}
