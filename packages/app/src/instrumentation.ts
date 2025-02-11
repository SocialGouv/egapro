import * as Sentry from "@sentry/nextjs";

// Hook to capture errors from nested React Server Components
export const onRequestError = (
  error: Error,
  requestInfo: { method: string; route: string; url: string },
  request: Request,
) => {
  Sentry.captureException(error, {
    extra: {
      ...requestInfo,
      requestHeaders: Object.fromEntries(request.headers),
    },
  });
};

// Helper for wrapping server actions with Sentry instrumentation
export const withServerAction = <T>(
  name: string,
  action: () => Promise<T>,
  options?: {
    formData?: FormData;
    headers?: Headers;
    recordResponse?: boolean;
  },
) => {
  return Sentry.withServerActionInstrumentation(
    name,
    {
      formData: options?.formData,
      headers: options?.headers,
      recordResponse: options?.recordResponse ?? false,
    },
    action,
  );
};

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const ENVIRONMENT = process.env.NEXT_PUBLIC_EGAPRO_ENV || "dev";
    const IS_PRODUCTION = ENVIRONMENT === "production";

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: ENVIRONMENT,
      tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
      debug: false,
      enableTracing: true,

      beforeSend(event) {
        if (IS_PRODUCTION && !event.exception) return null;

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
    const ENVIRONMENT = process.env.NEXT_PUBLIC_EGAPRO_ENV || "dev";
    const IS_PRODUCTION = ENVIRONMENT === "production";

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: ENVIRONMENT,
      tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
      debug: false,
      enableTracing: true,

      beforeSend(event) {
        if (IS_PRODUCTION && !event.exception) return null;

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
