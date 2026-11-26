import "server-only";

import * as Sentry from "@sentry/nextjs";

/**
 * External dependencies whose failure used to end in a `console.error` or a
 * silent `null`. Kept closed so a typo cannot invent a new Sentry group, and so
 * every call site groups under `["dependency", <name>]` instead of opening one
 * issue per occurrence.
 */
export const DEPENDENCIES = [
	"valkey",
	"weez",
	"suit",
	"s3",
	"queue",
	"matomo",
] as const;

export type Dependency = (typeof DEPENDENCIES)[number];

/**
 * One event per dependency per window. A dependency that is down fails on every
 * request that needs it — without this, a Valkey or WEEZ outage would post one
 * event per request and burn the Sentry quota for the duration of the incident.
 * The fingerprint already merges them into a single issue, so the first event
 * carries all the diagnostic value; later ones only add volume.
 */
const REPORT_WINDOW_MS = 60_000;
const lastReportedAt = new Map<Dependency, number>();

/**
 * Reports a dependency failure without duplicating an existing capture.
 *
 * Call it only where the failure would otherwise be lost — swallowed into a
 * degraded result, or logged and dropped. When the error propagates to an error
 * boundary or `onRequestError`, that layer already captures it and adding a
 * second call would open a twin issue.
 *
 * `extra` must stay bounded and free of personal data: it multiplies the
 * grouping keys in Sentry, and the privacy filter only masks e-mails and
 * SIREN/SIRET — it is not a licence to send payloads.
 */
export function captureDependencyFailure(
	dependency: Dependency,
	error: unknown,
	extra?: Record<string, string | number | boolean>,
	{ throttleMs = REPORT_WINDOW_MS }: { throttleMs?: number } = {},
): void {
	const now = Date.now();
	const lastReported = lastReportedAt.get(dependency);
	if (
		throttleMs > 0 &&
		lastReported !== undefined &&
		now - lastReported < throttleMs
	)
		return;
	lastReportedAt.set(dependency, now);

	const reported =
		error instanceof Error ? error : new Error(String(error), { cause: error });

	Sentry.captureException(reported, {
		fingerprint: ["dependency", dependency],
		tags: { dependency },
		...(extra === undefined ? {} : { extra }),
	});
}
