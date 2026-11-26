import type { Sql } from "postgres";

import { sanitizeMessage } from "../sanitize.js";
import { startTimer } from "./timing.js";
import type { Probe, ProbeStatus } from "./types.js";

const MISCONFIGURED_ERROR_CODES = new Set(["28P01", "28000", "3D000", "42501"]);

const POSTGRES_TIMEOUT_MS = 5000;
const POSTGRES_INTERVAL_SECONDS = 60;

export type PostgresProbeOptions = {
	sql: Sql;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
};

export function createPostgresProbe({
	sql,
	secrets,
	intervalSeconds = POSTGRES_INTERVAL_SECONDS,
	timeoutMs = POSTGRES_TIMEOUT_MS,
}: PostgresProbeOptions): Probe {
	return {
		key: "postgres-app",
		label: "PostgreSQL (application)",
		criticality: "critical",
		kind: "internal",
		intervalSeconds,
		timeoutMs,
		async probe() {
			const elapsed = startTimer();
			try {
				await sql`SELECT 1`;
				return { status: "operational", latencyMs: elapsed() };
			} catch (error) {
				return {
					status: statusFromError(error),
					latencyMs: elapsed(),
					message: sanitizeMessage(error, secrets),
				};
			}
		},
	};
}

function statusFromError(error: unknown): ProbeStatus {
	const code =
		typeof error === "object" && error !== null && "code" in error
			? (error as { code?: unknown }).code
			: undefined;

	return typeof code === "string" && MISCONFIGURED_ERROR_CODES.has(code)
		? "misconfigured"
		: "unavailable";
}
