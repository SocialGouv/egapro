export const DEFAULT_MAX_ATTEMPTS = 5;

export const RETRY_BACKOFF_SECONDS = [
	60,
	5 * 60,
	30 * 60,
	2 * 60 * 60,
	12 * 60 * 60,
] as const;
