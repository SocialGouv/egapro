import type { AuditCategory } from "../types";

/**
 * Retention period (days) per audit category — CNIL recommendation:
 *  - Access logs / sensitive reads (high volume, contains IP)            → 6 months
 *  - Auth events / mutations / exports / system actions (security logs)  → 12 months
 *
 * Default values applied by `scripts/audit-cleanup.ts`, which lets
 * `EGAPRO_AUDIT_RETENTION_SHORT_DAYS`, `EGAPRO_AUDIT_RETENTION_LONG_DAYS` and
 * `EGAPRO_ADMIN_IMPERSONATION_RETENTION_DAYS` override them.
 */
export const AUDIT_RETENTION_DAYS_SHORT = 180;
export const AUDIT_RETENTION_DAYS_LONG = 365;
export const ADMIN_IMPERSONATION_RETENTION_DAYS = 365;

/**
 * Categories under the short retention policy.
 * The cleanup job uses this set to compute the per-category threshold.
 */
export const SHORT_RETENTION_CATEGORIES: ReadonlyArray<AuditCategory> = [
	"read_sensitive",
	"public_search",
];
