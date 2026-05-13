import { RETRY_BACKOFF_SECONDS } from "./constants";

export function computeNextRetry(attemptCount: number, now: Date): Date {
	const idx = Math.max(
		0,
		Math.min(attemptCount, RETRY_BACKOFF_SECONDS.length - 1),
	);
	const delay = RETRY_BACKOFF_SECONDS[idx] ?? 0;
	return new Date(now.getTime() + delay * 1000);
}
