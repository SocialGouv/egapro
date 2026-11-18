import type { Sql } from "postgres";

import { describeError, errorCode } from "./errors.js";
import { startTimer } from "./timing.js";
import type { Probe, ProbeStatus } from "./types.js";

const PGBOSS_TIMEOUT_MS = 5000;
const PGBOSS_INTERVAL_SECONDS = 60;
const PGBOSS_QUEUE_NAME = "email-notification";
const UNDEFINED_TABLE = "42P01";
const MISCONFIGURED_ERROR_CODES = new Set(["28P01", "28000", "3D000", "42501"]);

type QueueDepthRow = {
	pending: number;
	oldestAgeSeconds: number | null;
};

export type QueueLimits = {
	maxPending: number;
	maxAgeSeconds: number;
};

export type PgbossProbeOptions = {
	sql: Sql | null;
	limits: QueueLimits | null;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
};

export function createPgbossProbe({
	sql,
	limits,
	secrets,
	intervalSeconds = PGBOSS_INTERVAL_SECONDS,
	timeoutMs = PGBOSS_TIMEOUT_MS,
}: PgbossProbeOptions): Probe {
	return {
		key: "pgboss-queue",
		label: "File des e-mails (pg-boss)",
		criticality: "important",
		kind: "internal",
		intervalSeconds,
		timeoutMs,
		async probe() {
			if (!sql || !limits) {
				return {
					status: "operational",
					latencyMs: 0,
					message: "non configuré",
				};
			}

			const elapsed = startTimer();
			try {
				const rows = await sql<QueueDepthRow[]>`
					SELECT
						count(*)::int AS pending,
						max(extract(epoch FROM (now() - created_on)))::int AS "oldestAgeSeconds"
					FROM pgboss.job
					WHERE name = ${PGBOSS_QUEUE_NAME} AND state IN ('created', 'retry')
				`;
				const depth = rows[0] ?? { pending: 0, oldestAgeSeconds: null };
				const tooDeep = depth.pending > limits.maxPending;
				const tooOld =
					depth.oldestAgeSeconds !== null &&
					depth.oldestAgeSeconds > limits.maxAgeSeconds;

				if (!tooDeep && !tooOld) {
					return { status: "operational", latencyMs: elapsed() };
				}

				return {
					status: "degraded",
					latencyMs: elapsed(),
					message: degradedMessage(depth, limits),
				};
			} catch (error) {
				if (errorCode(error) === UNDEFINED_TABLE) {
					return {
						status: "degraded",
						latencyMs: elapsed(),
						message: "file pg-boss non initialisée",
					};
				}

				return {
					status: statusFromError(error),
					latencyMs: elapsed(),
					message: describeError(
						error,
						secrets,
						"connexion à la file pg-boss impossible",
					),
				};
			}
		},
	};
}

function degradedMessage(
	{ pending, oldestAgeSeconds }: QueueDepthRow,
	{ maxPending, maxAgeSeconds }: QueueLimits,
): string {
	const parts: string[] = [];
	if (pending > maxPending) {
		parts.push(`${pending} jobs en attente (seuil ${maxPending})`);
	}
	if (oldestAgeSeconds !== null && oldestAgeSeconds > maxAgeSeconds) {
		parts.push(
			`le plus ancien depuis ${Math.ceil(oldestAgeSeconds / 60)} min (seuil ${Math.round(maxAgeSeconds / 60)} min)`,
		);
	}
	return parts.join(", ");
}

function statusFromError(error: unknown): ProbeStatus {
	const code = errorCode(error);
	return code && MISCONFIGURED_ERROR_CODES.has(code)
		? "misconfigured"
		: "unavailable";
}
