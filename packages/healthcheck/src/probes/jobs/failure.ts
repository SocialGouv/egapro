import { describeError, errorCode } from "../errors.js";
import type { ProbeStatus } from "../types.js";

const UNDEFINED_TABLE = "42P01";
const MISCONFIGURED_ERROR_CODES = new Set(["28P01", "28000", "3D000", "42501"]);

/**
 * Classification shared by every job probe.
 *
 * A missing pg-boss or audit schema is `degraded`, not `unavailable`: the
 * worker can read its own database, the scheduled job simply has no trace to
 * read yet.
 */
export function jobStatusFromError(error: unknown): ProbeStatus {
	const code = errorCode(error);
	if (code === UNDEFINED_TABLE) return "degraded";
	return code && MISCONFIGURED_ERROR_CODES.has(code)
		? "misconfigured"
		: "unavailable";
}

export function jobMessageFromError(
	error: unknown,
	secrets: readonly string[],
	fallback: string,
): string {
	if (errorCode(error) === UNDEFINED_TABLE)
		return "schéma de suivi non initialisé";
	return describeError(error, secrets, fallback);
}
