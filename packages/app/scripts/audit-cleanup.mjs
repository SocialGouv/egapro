import path from "node:path";
import postgres from "postgres";

/**
 * Audit log cleanup — direct DB access.
 *
 * Replaces the former curl-based CronJob (POST /api/audit/cleanup) so the
 * cleanup runs without going through the HTTP layer. Same CNIL-compliant
 * retention buckets as before:
 *  - short retention (180 d by default): categories in SHORT_RETENTION_CATEGORIES
 *    (high-volume access logs containing IP addresses)
 *  - long retention (365 d by default): every other category (security logs)
 *
 * Both DELETEs and the self-audit INSERT run inside a single transaction — if
 * anything fails, the whole operation rolls back and the next daily run
 * re-attempts the purge.
 *
 * Env vars:
 *  - DATABASE_URL (or POSTGRES_* fallback, same convention as migrate.mjs)
 *  - EGAPRO_AUDIT_RETENTION_SHORT_DAYS (optional, default 180)
 *  - EGAPRO_AUDIT_RETENTION_LONG_DAYS  (optional, default 365)
 *
 * Issue: #3268 (cleanup jobs use direct DB access instead of HTTP endpoints).
 */

/** @typedef {import("postgres").Sql} Sql */

/**
 * @typedef {Object} CleanupResult
 * @property {number} deletedShort
 * @property {number} deletedLong
 * @property {number} deletedTotal
 */

const SHORT_RETENTION_CATEGORIES = ["read_sensitive", "public_search"];
const AUDIT_CLEANUP_ACTION = "system.audit_cleanup";
const AUDIT_CLEANUP_CATEGORY = "system";

const DEFAULT_SHORT_RETENTION_DAYS = 180;
const DEFAULT_LONG_RETENTION_DAYS = 365;

/** @returns {string} */
function getDatabaseUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

	const {
		POSTGRES_USER,
		POSTGRES_PASSWORD,
		POSTGRES_HOST,
		POSTGRES_PORT,
		POSTGRES_DB,
		POSTGRES_SSLMODE,
	} = process.env;

	if (POSTGRES_HOST && POSTGRES_DB) {
		const user = encodeURIComponent(POSTGRES_USER ?? "postgres");
		const password = POSTGRES_PASSWORD
			? `:${encodeURIComponent(POSTGRES_PASSWORD)}`
			: "";
		const port = POSTGRES_PORT ?? "5432";
		const sslmode = POSTGRES_SSLMODE ? `?sslmode=${POSTGRES_SSLMODE}` : "";
		return `postgresql://${user}${password}@${POSTGRES_HOST}:${port}/${POSTGRES_DB}${sslmode}`;
	}

	throw new Error("DATABASE_URL or POSTGRES_HOST+POSTGRES_DB must be set");
}

/**
 * @param {Date} ref
 * @param {number} days
 * @returns {Date}
 */
function subtractDays(ref, days) {
	const result = new Date(ref);
	result.setUTCDate(result.getUTCDate() - days);
	return result;
}

/**
 * @param {string | undefined} raw
 * @param {number} fallback
 * @returns {number}
 */
function toPositiveInt(raw, fallback) {
	if (raw === undefined || raw === null || raw === "") return fallback;
	const n = Number(raw);
	if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
		throw new Error(
			`Invalid retention value: "${raw}". Expected a positive integer.`,
		);
	}
	return n;
}

/**
 * Core cleanup routine. Exported so the integration test can drive it against
 * an ephemeral `postgres` client without spawning a child process.
 *
 * @param {Object} args
 * @param {Sql} args.sql
 * @param {number} args.shortRetentionDays
 * @param {number} args.longRetentionDays
 * @param {Date} [args.now]
 * @returns {Promise<CleanupResult>}
 */
export async function runAuditCleanup({
	sql,
	shortRetentionDays,
	longRetentionDays,
	now = new Date(),
}) {
	const shortThreshold = subtractDays(now, shortRetentionDays);
	const longThreshold = subtractDays(now, longRetentionDays);

	return await sql.begin(async (txRaw) => {
		// postgres-js `TransactionSql` is declared as `Omit<Sql, ...>`, which
		// — quirk of TS's `Omit` — strips the call signatures on Sql. Cast
		// back to Sql so we can use the template-tag + dynamic-array helper.
		const tx = /** @type {Sql} */ (/** @type {unknown} */ (txRaw));
		const shortResult = await tx`
			DELETE FROM audit.action_log
			WHERE category = ANY(${SHORT_RETENTION_CATEGORIES})
			AND created_at < ${shortThreshold}
		`;
		const longResult = await tx`
			DELETE FROM audit.action_log
			WHERE category <> ALL(${SHORT_RETENTION_CATEGORIES})
			AND created_at < ${longThreshold}
		`;

		const deletedShort = Number(shortResult.count ?? 0);
		const deletedLong = Number(longResult.count ?? 0);
		const deletedTotal = deletedShort + deletedLong;

		// `created_at` is NOT NULL with no SQL-level default — the drizzle
		// schema supplies `$defaultFn(() => new Date())` at the ORM layer,
		// which the raw SQL path has to replicate explicitly.
		await tx`
			INSERT INTO audit.action_log (id, created_at, action, category, status, metadata)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${AUDIT_CLEANUP_ACTION},
				${AUDIT_CLEANUP_CATEGORY},
				'success',
				${tx.json({
					deletedShort,
					deletedLong,
					deletedTotal,
					shortRetentionDays,
					longRetentionDays,
				})}
			)
		`;

		return { deletedShort, deletedLong, deletedTotal };
	});
}

/**
 * @param {Sql} sql
 * @param {unknown} error
 */
async function logFailure(sql, error) {
	const message = error instanceof Error ? error.message : "Unknown error";
	try {
		await sql`
			INSERT INTO audit.action_log (id, created_at, action, category, status, error_message)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${AUDIT_CLEANUP_ACTION},
				${AUDIT_CLEANUP_CATEGORY},
				'failure',
				${message}
			)
		`;
	} catch (auditError) {
		console.error(
			"[audit-cleanup] Failed to record failure in audit log:",
			auditError,
		);
	}
}

const isMain = (() => {
	const entry = process.argv[1];
	if (!entry) return false;
	return import.meta.url === `file://${path.resolve(entry)}`;
})();

if (isMain) {
	const shortRetentionDays = toPositiveInt(
		process.env.EGAPRO_AUDIT_RETENTION_SHORT_DAYS,
		DEFAULT_SHORT_RETENTION_DAYS,
	);
	const longRetentionDays = toPositiveInt(
		process.env.EGAPRO_AUDIT_RETENTION_LONG_DAYS,
		DEFAULT_LONG_RETENTION_DAYS,
	);

	const sql = postgres(getDatabaseUrl(), { max: 1 });

	try {
		const result = await runAuditCleanup({
			sql,
			shortRetentionDays,
			longRetentionDays,
		});
		console.log(
			`[audit-cleanup] Success — deletedShort=${result.deletedShort} deletedLong=${result.deletedLong} deletedTotal=${result.deletedTotal}`,
		);
		await sql.end();
		process.exit(0);
	} catch (error) {
		console.error("[audit-cleanup] Failed:", error);
		await logFailure(sql, error);
		await sql.end();
		process.exit(1);
	}
}
