const TRACES_SAMPLE_RATE_IN_PRODUCTION = 0.1;

const TRACES_SAMPLE_RATE_BY_ENVIRONMENT: Record<string, number> = {
	dev: 1,
	preprod: 1,
	prod: TRACES_SAMPLE_RATE_IN_PRODUCTION,
};

// An unknown or missing environment must never reopen full sampling: the three
// Sentry init files run before environment validation, so the value arrives raw.
export function sentryTracesSampleRate(
	environment: string | undefined,
): number {
	const rate =
		environment === undefined
			? undefined
			: TRACES_SAMPLE_RATE_BY_ENVIRONMENT[environment];

	return rate ?? TRACES_SAMPLE_RATE_IN_PRODUCTION;
}
