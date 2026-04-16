import "server-only";

import { and, inArray, lt, notInArray } from "drizzle-orm";
import { SHORT_RETENTION_CATEGORIES } from "~/modules/audit";
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
 *  - **short** retention applies to the categories listed in
 *    `SHORT_RETENTION_CATEGORIES` (high-volume access logs that contain IP
 *    addresses — e.g. `read_sensitive`, `public_search`).
 *  - **long** retention applies to every other category (security logs).
 *
 * Both DELETEs run inside a single transaction so the operation is atomic —
 * if the second statement fails, the first is rolled back and the next cron
 * run re-attempts the full purge.
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
	const shortCategories = [...SHORT_RETENTION_CATEGORIES];

	const [shortResult, longResult] = await db.transaction(async (tx) => {
		const short = await tx
			.delete(actionLogs)
			.where(
				and(
					inArray(actionLogs.category, shortCategories),
					lt(actionLogs.createdAt, shortThreshold),
				),
			);
		const long = await tx
			.delete(actionLogs)
			.where(
				and(
					notInArray(actionLogs.category, shortCategories),
					lt(actionLogs.createdAt, longThreshold),
				),
			);
		return [short, long] as const;
	});

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
 *
 * `postgres-js` v3 returns `count` as a **string** (e.g. `"12"`), so we
 * explicitly coerce via `Number()` to avoid string concatenation when the
 * caller sums short + long counts.
 */
function extractAffectedRowCount(result: unknown): number {
	if (typeof result === "object" && result !== null) {
		const r = result as { count?: unknown; rowCount?: unknown };
		const raw = r.count ?? r.rowCount;
		if (raw !== undefined && raw !== null) {
			const n = Number(raw);
			return Number.isFinite(n) ? n : 0;
		}
	}
	return 0;
}
