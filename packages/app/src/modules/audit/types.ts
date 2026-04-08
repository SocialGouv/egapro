/**
 * Audit log categories — drive retention policy and ease SQL filtering.
 *
 * Retention thresholds are defined per-category in `shared/constants.ts`.
 */
export type AuditCategory =
	| "auth"
	| "mutation"
	| "read_sensitive"
	| "export"
	| "system";

export type AuditStatus = "success" | "failure";

export type AuditMetadata = Record<string, unknown>;
