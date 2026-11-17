export type SentryEnvironment = "dev" | "preprod" | "prod";

export interface SentrySampleRates {
  errors: number;
  replaysOnError: number;
  replaysSession: number;
  traces: number;
}

export const toSentryEnvironment = (rawEnvironment: string | undefined): SentryEnvironment =>
  rawEnvironment === "prod" || rawEnvironment === "preprod" ? rawEnvironment : "dev";

// Errors are always sent in full: sampling them would make alerting and the test-event recette probabilistic.
// Cost is bounded by traces and replays, throttled only in production.
export const getSentrySampleRates = (environment: SentryEnvironment): SentrySampleRates => ({
  errors: 1,
  traces: environment === "prod" ? 0.1 : 1,
  replaysSession: environment === "prod" ? 0.1 : 0.5,
  replaysOnError: 1,
});

export const SENTRY_ENVIRONMENT = toSentryEnvironment(process.env.NEXT_PUBLIC_EGAPRO_ENV);

export const SENTRY_IS_PRODUCTION = SENTRY_ENVIRONMENT === "prod";

export const SENTRY_SAMPLE_RATES = getSentrySampleRates(SENTRY_ENVIRONMENT);
