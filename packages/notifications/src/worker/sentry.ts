import * as Sentry from "@sentry/node";

export type WorkerSentryConfig = {
	dsn: string | undefined;
	environment: string | undefined;
	release?: string | undefined;
};

/**
 * Initialises the SDK for the standalone notifications worker.
 *
 * The worker cannot reuse `~/modules/observability` (a Next.js app module, and
 * this package ships as its own deployed tree), so the privacy contract is
 * enforced structurally instead of by sharing a scrubber: `beforeSend` drops
 * the request, the free-text message and every breadcrumb payload, and replaces
 * each exception value with its type. What remains — stack, fingerprint, tags
 * and the bounded `extra` we pass — cannot carry an e-mail or a SIREN. Call
 * sites must therefore never put free text or user data in `extra`.
 */
export function initWorkerSentry({
	dsn,
	environment,
	release,
}: WorkerSentryConfig): void {
	if (!dsn) return;

	Sentry.init({
		dsn,
		environment,
		release,
		// The worker is a batch consumer: spans would only add noise.
		tracesSampleRate: 0,
		beforeSend: redactEvent,
	});
}

export type JobFailureContext = {
	attempt: number;
	/** Queue job type, a bounded enum — never the payload. */
	type: string;
	phase: "render" | "transport";
};

export function captureJobFailure(
	error: unknown,
	context: JobFailureContext,
): void {
	Sentry.captureException(toError(error), {
		// One group per queue, not one per mail: the dependency is the SMTP relay
		// on the transport phase, the template engine on the render phase.
		fingerprint: [
			"dependency",
			context.phase === "transport" ? "smtp" : "mail-render",
		],
		tags: { dependency: "smtp", phase: context.phase },
		extra: {
			attempt: context.attempt,
			type: context.type,
			phase: context.phase,
		},
	});
}

export function captureQueueConnectionFailure(
	error: unknown,
	attempts: number,
) {
	Sentry.captureException(toError(error), {
		fingerprint: ["dependency", "queue"],
		tags: { dependency: "queue" },
		extra: { attempts },
	});
}

function toError(error: unknown): Error {
	return error instanceof Error
		? error
		: new Error(String(error), { cause: error });
}

function redactEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
	delete event.request;
	delete event.message;

	for (const exception of event.exception?.values ?? []) {
		exception.value = exception.type ?? "[redacted]";
	}
	for (const breadcrumb of event.breadcrumbs ?? []) {
		delete breadcrumb.data;
	}

	return event;
}
