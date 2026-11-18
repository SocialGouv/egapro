import "server-only";

import postgres, { type Sql } from "postgres";

import { env } from "~/env";

const READINESS_DEADLINE_MS = 2000;

export function createReadinessCheck(
	sql: Sql,
	deadlineMs = READINESS_DEADLINE_MS,
): () => Promise<boolean> {
	return async () => {
		try {
			await withDeadline(sql`SELECT 1`, deadlineMs);
			return true;
		} catch {
			return false;
		}
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
