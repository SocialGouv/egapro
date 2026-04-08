import "server-only";

import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { actionLogs } from "~/server/db/auditSchema";

export type CleanupResult = {
	deletedShort: number;
	deletedLong: number;
	deletedTotal: number;
};

/**
 * Delete every `audit.action_log` row older than its retention threshold.
 *
 * Two CNIL-compliant buckets:
 *  - **short** retention applies to `read_sensitive` (high-volume access logs
 *    that contain IP addresses).
 *  - **long** retention applies to every other category (security logs).
 *
 * The function performs two targeted DELETE statements rather than a single
 * statement with a CASE expression — clearer to debug, identical performance
 * given the existing `(category, created_at)` index.
 */
export async function cleanupAuditLogs({
	shortRetentionDays,
	longRetentionDays,
	now = new Date(),
}: {
	shortRetentionDays: number;
	longRetentionDays: number;
	now?: Date;
}): Promise<CleanupResult> {
	const shortThreshold = subtractDays(now, shortRetentionDays);
	const longThreshold = subtractDays(now, longRetentionDays);

	const shortResult = await db
		.delete(actionLogs)
		.where(
			sql`${actionLogs.category} = 'read_sensitive' AND ${actionLogs.createdAt} < ${shortThreshold}`,
		);

	const longResult = await db
		.delete(actionLogs)
		.where(
			sql`${actionLogs.category} <> 'read_sensitive' AND ${actionLogs.createdAt} < ${longThreshold}`,
		);

	const deletedShort = extractAffectedRowCount(shortResult);
	const deletedLong = extractAffectedRowCount(longResult);

	return {
		deletedShort,
		deletedLong,
		deletedTotal: deletedShort + deletedLong,
	};
}

/**
 * Subtract `days` days from the reference date, returning a new Date.
 * (Domain layer does not yet expose date arithmetic helpers, and adding one
 * just for this caller would be premature.)
 */
function subtractDays(ref: Date, days: number): Date {
	const result = new Date(ref);
	result.setUTCDate(result.getUTCDate() - days);
	return result;
}

/**
 * postgres-js delete returns a result that exposes a `count` property; older
 * versions returned `rowCount`. Accept both shapes.
 */
function extractAffectedRowCount(result: unknown): number {
	if (typeof result === "object" && result !== null) {
		const r = result as { count?: number; rowCount?: number };
		return r.count ?? r.rowCount ?? 0;
	}
	return 0;
}
