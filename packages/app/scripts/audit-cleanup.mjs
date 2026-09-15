import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
 * The two DELETEs are atomic (single transaction). The success self-audit is
 * appended after the transaction commits — a failure writing the audit row
 * must not roll back work we already accomplished. Cleanup failures go
 * through `logFailure`, which inserts outside any transaction so the record
 * survives the rollback.
 *
 * Also purges `app_receipt_outbox`: it carries `recipient_email`, `user_id`
 * and `siren` on every row with no retention of its own, unlike
 * `audit.action_log` and the declarations it was written to acknowledge.
 * Only terminal rows (`sent` / `failed`) past retention are removed —
 * `pending`/`sending` rows are live work for `replayPendingReceipts` and are
 * never touched here, however old.
 *
 * Env vars:
 *  - DATABASE_URL (or POSTGRES_* fallback, same convention as migrate.mjs)
 *  - EGAPRO_AUDIT_RETENTION_SHORT_DAYS (optional, default 180)
 *  - EGAPRO_AUDIT_RETENTION_LONG_DAYS  (optional, default 365)
 *  - EGAPRO_RECEIPT_OUTBOX_RETENTION_DAYS (optional, default 365)
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

const RECEIPT_OUTBOX_CLEANUP_ACTION = "system.receipt_outbox_cleanup";
const RECEIPT_OUTBOX_SETTLED_STATUSES = ["sent", "failed"];

const DEFAULT_SHORT_RETENTION_DAYS = 180;
const DEFAULT_LONG_RETENTION_DAYS = 365;
const DEFAULT_RECEIPT_OUTBOX_RETENTION_DAYS = 365;

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

	const summary = await sql.begin(async (txRaw) => {
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
		return {
			deletedShort,
			deletedLong,
			deletedTotal: deletedShort + deletedLong,
		};
	});

	// Self-audit runs OUTSIDE the transaction so a failure to record the
	// audit row (constraint violation, disk full, etc.) cannot roll back
	// cleanup work that has already been committed. We still log success
	// via an INSERT so the cleanup cron is visible in `audit.action_log`.
	// `created_at` is NOT NULL with no SQL-level default — the drizzle
	// schema supplies `$defaultFn(() => new Date())` at the ORM layer,
	// which the raw SQL path has to replicate explicitly.
	try {
		await sql`
			INSERT INTO audit.action_log (id, created_at, action, category, status, metadata)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${AUDIT_CLEANUP_ACTION},
				${AUDIT_CLEANUP_CATEGORY},
				'success',
				${sql.json({
					deletedShort: summary.deletedShort,
					deletedLong: summary.deletedLong,
					deletedTotal: summary.deletedTotal,
					shortRetentionDays,
					longRetentionDays,
				})}
			)
		`;
	} catch (auditError) {
		console.error(
			"[audit-cleanup] Cleanup succeeded but self-audit insert failed:",
			auditError,
		);
	}

	return summary;
}

/**
 * @param {Sql} sql
 * @param {string} action
 * @param {unknown} error
 * @param {string} [logPrefix]
 */
async function logFailure(sql, action, error, logPrefix = "audit-cleanup") {
	const message = error instanceof Error ? error.message : "Unknown error";
	try {
		await sql`
			INSERT INTO audit.action_log (id, created_at, action, category, status, error_message)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${action},
				${AUDIT_CLEANUP_CATEGORY},
				'failure',
				${message}
			)
		`;
	} catch (auditError) {
		console.error(
			`[${logPrefix}] Failed to record failure in audit log:`,
			auditError,
		);
	}
}

/**
 * Purge of `app_receipt_outbox`. Exported for the same reason as
 * `runAuditCleanup` — the integration test drives it directly.
 *
 * @param {Object} args
 * @param {Sql} args.sql
 * @param {number} args.retentionDays
 * @param {Date} [args.now]
 * @returns {Promise<{ deleted: number }>}
 */
export async function runReceiptOutboxCleanup({
	sql,
	retentionDays,
	now = new Date(),
}) {
	const threshold = subtractDays(now, retentionDays);

	const deleted = await sql`
		DELETE FROM app_receipt_outbox
		WHERE status = ANY(${RECEIPT_OUTBOX_SETTLED_STATUSES})
		AND updated_at < ${threshold}
	`;

	const deletedCount = Number(deleted.count ?? 0);

	try {
		await sql`
			INSERT INTO audit.action_log (id, created_at, action, category, status, metadata)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${RECEIPT_OUTBOX_CLEANUP_ACTION},
				${AUDIT_CLEANUP_CATEGORY},
				'success',
				${sql.json({ deleted: deletedCount, retentionDays })}
			)
		`;
	} catch (auditError) {
		console.error(
			"[receipt-outbox-cleanup] Cleanup succeeded but self-audit insert failed:",
			auditError,
		);
	}

	return { deleted: deletedCount };
}

const isMain = (() => {
	const entry = process.argv[1];
	if (!entry) return false;
	// `realpathSync` resolves symlinks — needed because pnpm's content-
	// addressable store or Docker bind-mounts may hand Node a symlink path
	// that doesn't match `import.meta.url`'s canonicalized form.
	try {
		return fileURLToPath(import.meta.url) === realpathSync(entry);
	} catch {
		return false;
	}
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
	const receiptOutboxRetentionDays = toPositiveInt(
		process.env.EGAPRO_RECEIPT_OUTBOX_RETENTION_DAYS,
		DEFAULT_RECEIPT_OUTBOX_RETENTION_DAYS,
	);

	const sql = postgres(getDatabaseUrl(), { max: 1 });
	let failed = false;

	try {
		const result = await runAuditCleanup({
			sql,
			shortRetentionDays,
			longRetentionDays,
		});
		console.log(
			`[audit-cleanup] Success — deletedShort=${result.deletedShort} deletedLong=${result.deletedLong} deletedTotal=${result.deletedTotal}`,
		);
	} catch (error) {
		console.error("[audit-cleanup] Failed:", error);
		await logFailure(sql, AUDIT_CLEANUP_ACTION, error, "audit-cleanup");
		failed = true;
	}

	// Independent of the audit-log cleanup above: one purge failing must not
	// skip the other, and each gets its own self-audit row.
	try {
		const result = await runReceiptOutboxCleanup({
			sql,
			retentionDays: receiptOutboxRetentionDays,
		});
		console.log(`[receipt-outbox-cleanup] Success — deleted=${result.deleted}`);
	} catch (error) {
		console.error("[receipt-outbox-cleanup] Failed:", error);
		await logFailure(
			sql,
			RECEIPT_OUTBOX_CLEANUP_ACTION,
			error,
			"receipt-outbox-cleanup",
		);
		failed = true;
	}

	await sql.end();
	process.exit(failed ? 1 : 0);
}
