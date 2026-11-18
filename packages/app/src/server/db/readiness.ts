import "server-only";

import postgres, { type Sql } from "postgres";

import { env } from "~/env";

const READINESS_DEADLINE_MS = 2000;
const READINESS_CACHE_MS = 1000;

/**
 * `/api/readyz` sits on the catch-all ingress, so anyone can call it. Two
 * consequences, handled here rather than at the edge (the chart exposes a
 * single `path: /` rule, and nginx vs Traefik snippets would diverge):
 *
 * - a burst of anonymous calls must not multiply `SELECT 1` on the dedicated
 *   `max: 1` pool — concurrent callers share one in-flight check;
 * - a burst must not either — results are reused for `cacheMs`, so the query
 *   rate is capped at one per window whatever the traffic.
 *
 * The residual signal (200 vs 503) only tells what any 5xx page already tells,
 * and the route reads no data.
 */
export function createReadinessCheck(
	sql: Sql,
	deadlineMs = READINESS_DEADLINE_MS,
	cacheMs = READINESS_CACHE_MS,
): () => Promise<boolean> {
	let cached: { value: boolean; expiresAt: number } | null = null;
	let inFlight: Promise<boolean> | null = null;

	const run = async (): Promise<boolean> => {
		try {
			await withDeadline(sql`SELECT 1`, deadlineMs);
			return true;
		} catch {
			return false;
		}
	};

	return async () => {
		if (cached && Date.now() < cached.expiresAt) return cached.value;

		inFlight ??= run()
			.then((value) => {
				cached = { value, expiresAt: Date.now() + cacheMs };
				return value;
			})
			.finally(() => {
				inFlight = null;
			});

		return inFlight;
	};
}

// A dedicated pool: the shared client carries the 60 s statement timeout of the
// business queries, and a wedged database would hold the probe far past the
// kubelet deadline — the pod would keep receiving traffic it cannot serve.
function buildReadinessClient(): Sql {
	return postgres(env.DATABASE_URL, {
		max: 1,
		connect_timeout: 2,
		connection: { statement_timeout: READINESS_DEADLINE_MS },
	});
}

const globalForReadiness = globalThis as unknown as {
	readinessSql: Sql | undefined;
};

const readinessSql = globalForReadiness.readinessSql ?? buildReadinessClient();
if (env.NODE_ENV !== "production") {
	globalForReadiness.readinessSql = readinessSql;
}

export const checkDatabaseReadiness = createReadinessCheck(readinessSql);

function withDeadline<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new Error("readiness deadline exceeded")),
			ms,
		);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error: unknown) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}
