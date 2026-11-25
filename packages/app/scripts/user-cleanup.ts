import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Sql } from "postgres";
import postgres from "postgres";
import { USER_ACCOUNT_INACTIVITY_RETENTION_YEARS } from "~/modules/domain/shared/retention";
import { cleanupErrorDiagnostic } from "./cleanup-error-diagnostic";

/**
 * Account retention sweep, run daily by a CronJob.
 *
 * Anonymised in place, never deleted: eight foreign keys point at
 * `app_user.id` (several `NOT NULL`) and declarations legally kept six years
 * must stay attributable. The clock is the last sign-in
 * (`~/server/auth/config.ts`): a démarche needs a session, so it covers the
 * policy's "dernière démarche ou inactivité du compte".
 *
 * EGAPRO_USER_RETENTION_YEARS overrides the default window;
 * EGAPRO_USER_CLEANUP_DRY_RUN counts candidates without touching them.
 */

type RunUserCleanupArgs = {
	sql: Sql;
	retentionYears: number;
	now?: Date;
	dryRun?: boolean;
};

type UserCleanupResult = {
	anonymizedAccounts: number;
	retentionYears: number;
	cutoff: Date;
	dryRun: boolean;
};

const USER_CLEANUP_ACTION = "system.user_cleanup";
const USER_CLEANUP_CATEGORY = "system";
const USER_CLEANUP_FAILURE_CODE = "USER_CLEANUP_FAILED";

function getDatabaseUrl(): string {
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

function toPositiveInt(raw: string | undefined, fallback: number): number {
	if (raw === undefined || raw === null || raw === "") return fallback;
	const n = Number(raw);
	if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
		throw new Error(
			`Invalid retention value: "${raw}". Expected a positive integer.`,
		);
	}
	return n;
}

function toBoolean(raw: string | undefined): boolean {
	return raw === "true" || raw === "1";
}

/**
 * Anonymise every account whose last sign-in is older than the retention
 * window. The boundary is strict: an account whose last activity is exactly
 * `retentionYears` old is kept, like the declaration sweep.
 */
export async function runUserCleanup({
	sql,
	retentionYears,
	now = new Date(),
	dryRun = false,
}: RunUserCleanupArgs): Promise<UserCleanupResult> {
	const { anonymizedAccounts, cutoff } = await sql.begin(async (tx) => {
		// Date arithmetic stays in SQL: `make_interval` is exact where a JS
		// `setFullYear` slips on leap days.
		const cutoffRows = await tx<{ cutoff: Date }[]>`
			SELECT (${now}::timestamptz - make_interval(years => ${retentionYears})) AS cutoff
		`;
		const sweepCutoff = cutoffRows[0]?.cutoff;
		if (!sweepCutoff) throw new Error("Could not compute the retention cutoff");

		const eligibleRows = await tx<{ id: string }[]>`
			SELECT id FROM app_user
			WHERE anonymized_at IS NULL AND last_activity_at < ${sweepCutoff}
		`;
		const ids = eligibleRows.map((row) => row.id);

		if (ids.length === 0 || dryRun) {
			return { anonymizedAccounts: ids.length, cutoff: sweepCutoff };
		}

		// `.invalid` is reserved by RFC 2606: unroutable, unique per account,
		// and it frees the original address for a fresh sign-up. No ProConnect
		// identity can ever match it. The `anonymized_at IS NULL` guard keeps a
		// concurrent or replayed run idempotent.
		// Re-checking the predicate here skips a sign-in committed since the SELECT.
		const updated = await tx<{ id: string }[]>`
			UPDATE app_user SET
				first_name = NULL,
				last_name = NULL,
				phone = NULL,
				email = 'compte-supprime-' || id || '@invalid',
				is_admin = false,
				anonymized_at = now()
			WHERE id = ANY(${ids})
				AND anonymized_at IS NULL
				AND last_activity_at < ${sweepCutoff}
			RETURNING id
		`;
		const anonymizedIds = updated.map((row) => row.id);

		if (anonymizedIds.length === 0) {
			return { anonymizedAccounts: 0, cutoff: sweepCutoff };
		}

		// Company membership is personal data: which employer a person
		// declared for goes with the account.
		await tx`DELETE FROM app_user_company WHERE user_id = ANY(${anonymizedIds})`;
		// Locks are ephemeral session state; a dead account must not appear as
		// holding one. Declarations themselves are never touched.
		await tx`DELETE FROM app_declaration_lock WHERE locked_by_user_id = ANY(${anonymizedIds})`;
		await tx`
			DELETE FROM app_representation_declaration_lock
			WHERE locked_by_user_id = ANY(${anonymizedIds})
		`;

		return {
			anonymizedAccounts: anonymizedIds.length,
			cutoff: sweepCutoff,
		};
	});

	// Self-audit runs outside the transaction: a failure to insert the audit row
	// must not roll back completed anonymisations. Counters only — never an
	// identifier or an address.
	try {
		await sql`
			INSERT INTO audit.action_log (id, created_at, action, category, status, metadata)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${USER_CLEANUP_ACTION},
				${USER_CLEANUP_CATEGORY},
				'success',
				${sql.json({
					anonymizedAccounts,
					retentionYears,
					cutoff: cutoff.toISOString(),
					dryRun,
				})}
			)
		`;
	} catch {
		console.error("[user-cleanup] Self-audit insert failed");
	}

	return { anonymizedAccounts, retentionYears, cutoff, dryRun };
}

// The original exception can contain identifiers or deleted data: never persist it.
export async function logUserCleanupFailure(
	sql: Sql,
	_error: unknown,
): Promise<void> {
	try {
		await sql`
			INSERT INTO audit.action_log (id, created_at, action, category, status, error_message)
			VALUES (
				${crypto.randomUUID()},
				${new Date()},
				${USER_CLEANUP_ACTION},
				${USER_CLEANUP_CATEGORY},
				'failure',
				${USER_CLEANUP_FAILURE_CODE}
			)
		`;
	} catch {
		console.error("[user-cleanup] Failed to record failure in audit log");
	}
}

const isMain = ((): boolean => {
	const entry = process.argv[1];
	if (!entry) return false;
	// realpathSync resolves symlinks from pnpm content-addressable store or Docker bind-mounts
	try {
		return fileURLToPath(import.meta.url) === realpathSync(entry);
	} catch {
		return false;
	}
})();

if (isMain) {
	const retentionYears = toPositiveInt(
		process.env.EGAPRO_USER_RETENTION_YEARS,
		USER_ACCOUNT_INACTIVITY_RETENTION_YEARS,
	);
	const dryRun = toBoolean(process.env.EGAPRO_USER_CLEANUP_DRY_RUN);

	const sql = postgres(getDatabaseUrl(), { max: 1 });

	let exitCode = 0;
	try {
		const result = await runUserCleanup({ sql, retentionYears, dryRun });
		console.log(
			`[user-cleanup] Success — anonymizedAccounts=${result.anonymizedAccounts} retentionYears=${result.retentionYears} cutoff=${result.cutoff.toISOString()} dryRun=${result.dryRun}`,
		);
	} catch (error) {
		console.error(
			"[user-cleanup] Failed:",
			USER_CLEANUP_FAILURE_CODE,
			cleanupErrorDiagnostic(error),
		);
		await logUserCleanupFailure(sql, error);
		exitCode = 1;
	} finally {
		await sql.end();
	}
	process.exit(exitCode);
}
