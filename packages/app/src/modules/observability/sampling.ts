/**
 * Transaction sampling is deliberately coarse: one knob, one default per
 * runtime class. Traces are useful for profiling a few requests, not for
 * paying for every one of them — 100 % in production was an oversight (see
 * #5199), and Sentry's own guidance is to sample traces well below errors.
 */
export const PRODUCTION_TRACES_SAMPLE_RATE = 0.1;
export const NON_PRODUCTION_TRACES_SAMPLE_RATE = 1;

/**
 * Resolves `tracesSampleRate` from the raw `SENTRY_TRACES_SAMPLE_RATE` value.
 *
 * An invalid or out-of-range value falls back to the environment default rather
 * than throwing: Sentry initialisation happens before the app can report
 * anything, so a typo in a ConfigMap must not take the process down. The
 * server and edge runtimes pass `NODE_ENV`; the browser bundle gets it inlined
 * by Next.js, which is why the client keeps the production/non-production
 * default and ignores the server-only variable.
 */
export function resolveTracesSampleRate({
	nodeEnv,
	override,
}: {
	nodeEnv: string | undefined;
	override?: string;
}): number {
	const parsed =
		override === undefined || override.trim() === ""
			? Number.NaN
			: Number(override);
	if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed;

	return nodeEnv === "production"
		? PRODUCTION_TRACES_SAMPLE_RATE
		: NON_PRODUCTION_TRACES_SAMPLE_RATE;
}
