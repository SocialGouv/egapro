export const SENTRY_DSN = "https://28b6186c058a49fc94ee665667e44612@sentry.fabrique.social.gouv.fr/99";

export const commonConfig = {
  dsn: SENTRY_DSN,
  environment: process.env.EGAPRO_ENV || "dev",
  release: process.env.NEXT_PUBLIC_VERSION || "development",
  
  // Performance
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Debug settings
  debug: process.env.NODE_ENV !== "production",
  
  // Additional configurations
  maxBreadcrumbs: 50,
  attachStacktrace: true,
  
  beforeSend(event: any) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return event;
  },
  
  // Ignore specific errors
  ignoreErrors: [
    // Add common false positives or known third-party errors
    "ResizeObserver loop limit exceeded",
    "Network request failed",
  ],
};
