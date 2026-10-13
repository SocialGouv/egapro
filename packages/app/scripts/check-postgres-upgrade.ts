/**
 * Read-only PostgreSQL upgrade checks (no application/worker bootstrap).
 *
 * pnpm check:postgres-upgrade capture --database application --scope <UUID> --writes-stopped --output before.json
 * pnpm check:postgres-upgrade compare --before before.json --after after.json --expected-major <target>
 *
 * DATABASE_URL is used only for application; NOTIFICATIONS_DATABASE_URL only for
 * notifications, which additionally requires --notifications-confirmed (approved
 * inventory on #4824). No fallback between databases. Reuse one opaque UUID per
 * logical database/environment before and after the intervention. Never use a
 * connection string, hostname or account as scope. Stop writers AND workers.
 * Aggregates cannot prove data integrity: restoration and functional acceptance
 * remain mandatory in the runbook. Existing report files are never overwritten.
 */
import { realpathSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import postgres, { type Sql, type TransactionSql } from "postgres";
import { z } from "zod";
import {
	APPLICATION_TABLES,
	compareReports,
	type DatabaseKind,
	NOTIFICATION_TABLES,
	parseReport,
	reportProblems,
	type UpgradeReport,
} from "./postgres-upgrade-report";

async function captureTable(
	sql: TransactionSql,
	schema: string,
	table: string,
) {
	const [relation] = await sql<{ oid: number | null }[]>`
		SELECT to_regclass(${`${schema}.${table}`})::oid AS oid`;
	if (!relation?.oid) return { present: false, rows: null, structure: null };
	const [count] = await sql<
		{ rows: string }[]
	>`SELECT count(*)::text AS rows FROM ${sql(`${schema}.${table}`)}`;
	// Only a digest leaves the database; defaults/index definitions may contain literals.
	// PostgreSQL 18 adds NOT NULL constraints to pg_constraint. attnotnull already
	// covers them, so omit contype=n to keep fingerprints stable across majors.
	const [structure] = await sql<{ digest: string }[]>`
		SELECT md5(coalesce(string_agg(item, E'\n' ORDER BY item COLLATE "C"), '')) AS digest
		FROM (
			SELECT 'column:' || a.attname || ':' || format_type(a.atttypid, a.atttypmod)
				|| ':' || a.attnotnull::text || ':' || a.attidentity::text || ':' || a.attgenerated::text
				|| ':' || coalesce(pg_get_expr(d.adbin, d.adrelid), '')
				|| ':' || coalesce((SELECT jsonb_agg(e.enumlabel ORDER BY e.enumsortorder)::text
					FROM pg_enum e WHERE e.enumtypid = a.atttypid), '') AS item
			FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
			WHERE a.attrelid = ${relation.oid} AND a.attnum > 0 AND NOT a.attisdropped
			UNION ALL SELECT 'constraint:' || conname || ':' || pg_get_constraintdef(oid)
			FROM pg_constraint WHERE conrelid = ${relation.oid} AND contype <> 'n'
			UNION ALL SELECT 'index:' || pg_get_indexdef(indexrelid)
			FROM pg_index WHERE indrelid = ${relation.oid}
		) AS definitions`;
	if (!count || !structure) throw new Error("Capture incomplète.");
	return { present: true, rows: count.rows, structure: structure.digest };
}

export async function captureReport(
	sql: Sql,
	database: DatabaseKind,
	scope: string,
): Promise<UpgradeReport> {
	// A consistent snapshot plus a server-enforced read-only transaction; no DDL,
	// locks, migration execution, worker startup or backup operation is performed.
	return sql.begin(
		"isolation level repeatable read read only",
		async (transaction) => {
			const [version] = await transaction<
				{ version: string }[]
			>`SELECT current_setting('server_version_num') AS version`;
			const schema = database === "application" ? "public" : "pgboss";
			const names =
				database === "application" ? APPLICATION_TABLES : NOTIFICATION_TABLES;
			const entries = [];
			for (const name of names)
				entries.push([
					name,
					await captureTable(
						transaction,
						name === "audit.action_log" ? "audit" : schema,
						name === "audit.action_log" ? "action_log" : name,
					),
				]);
			const journalSchema = database === "application" ? "drizzle" : "pgboss";
			const journalTable =
				database === "application" ? "__drizzle_migrations" : "version";
			const [journalExists] = await transaction<{ present: boolean }[]>`
			SELECT to_regclass(${`${journalSchema}.${journalTable}`}) IS NOT NULL AS present`;
			let journal = null;
			if (journalExists?.present) {
				// Hashes/timestamps/version metadata only; no migration rows in the report.
				const [aggregate] =
					database === "application"
						? await transaction<{ rows: string; digest: string }[]>`
					SELECT count(*)::text AS rows, md5(coalesce(string_agg(
						jsonb_build_array(id, hash, created_at)::text, E'\n' ORDER BY id), '')) AS digest
					FROM drizzle.__drizzle_migrations`
						: await transaction<{ rows: string; digest: string }[]>`
					SELECT count(*)::text AS rows, md5(coalesce(string_agg(version::text, ',' ORDER BY version), '')) AS digest
					FROM pgboss.version`;
				journal = aggregate ?? null;
			}
			return parseReport({
				format: 1,
				scope,
				database,
				writesStopped: true,
				capturedAt: new Date().toISOString(),
				serverVersion: Number(version?.version),
				tables: Object.fromEntries(entries),
				journal,
			});
		},
	);
}

const USAGE =
	"capture --database application|notifications --scope <UUID> --writes-stopped --output <file> [--notifications-confirmed] | compare --before <file> --after <file> --expected-major <number>";

/** Catch at the boundary: driver, filesystem and validation errors can contain secrets. */
export async function runCli(
	args: string[],
	env: Record<string, string | undefined> = process.env,
): Promise<number> {
	let sql: Sql | undefined;
	try {
		const { values, positionals } = parseArgs({
			args,
			allowPositionals: true,
			options: {
				database: { type: "string" },
				scope: { type: "string" },
				output: { type: "string" },
				"writes-stopped": { type: "boolean" },
				"notifications-confirmed": { type: "boolean" },
				before: { type: "string" },
				after: { type: "string" },
				"expected-major": { type: "string" },
			},
		});
		if (positionals.length !== 1) throw new Error("Invalid mode");
		if (positionals[0] === "capture") {
			const database = z
				.enum(["application", "notifications"])
				.parse(values.database);
			const scope = z.uuid().parse(values.scope);
			if (
				!values.output ||
				!values["writes-stopped"] ||
				values.before ||
				values.after ||
				values["expected-major"]
			)
				throw new Error("Invalid capture options");
			if (database === "notifications" && !values["notifications-confirmed"])
				throw new Error("Inventory confirmation required");
			const connection =
				database === "application"
					? env.DATABASE_URL
					: env.NOTIFICATIONS_DATABASE_URL;
			if (!connection) throw new Error("Missing connection");
			sql = postgres(connection, {
				max: 1,
				connect_timeout: 10,
				onnotice: () => {},
				connection: {
					default_transaction_read_only: true,
					statement_timeout: 60000,
					lock_timeout: 5000,
				},
			});
			const report = await captureReport(sql, database, scope);
			await writeFile(values.output, `${JSON.stringify(report, null, 2)}\n`, {
				flag: "wx",
				mode: 0o600,
			});
			const problems = reportProblems(report);
			for (const problem of problems) console.error(problem);
			console.log(
				"Capture enregistrée. Les agrégats ne remplacent pas la restauration et la recette.",
			);
			return problems.length ? 1 : 0;
		}
		if (positionals[0] === "compare") {
			if (
				!values.before ||
				!values.after ||
				!values["expected-major"] ||
				values.database ||
				values.scope ||
				values.output ||
				values["writes-stopped"] ||
				values["notifications-confirmed"]
			)
				throw new Error("Invalid compare options");
			const before: unknown = JSON.parse(await readFile(values.before, "utf8"));
			const after: unknown = JSON.parse(await readFile(values.after, "utf8"));
			const problems = compareReports(
				before,
				after,
				Number(values["expected-major"]),
			);
			for (const problem of problems) console.error(problem);
			if (!problems.length)
				console.log(
					"Comparaison conforme. Poursuivre la recette et la vérification de restauration.",
				);
			return problems.length ? 1 : 0;
		}
		throw new Error("Invalid mode");
	} catch {
		console.error(
			`Contrôle impossible : vérifier les options, les rapports, les droits et la connexion. Usage : ${USAGE}`,
		);
		return 1;
	} finally {
		try {
			await sql?.end({ timeout: 5 });
		} catch {
			/* Never expose driver errors. */
		}
	}
}

function isMain() {
	try {
		return (
			!!process.argv[1] &&
			fileURLToPath(import.meta.url) === realpathSync(process.argv[1])
		);
	} catch {
		return false;
	}
}
if (isMain()) process.exitCode = await runCli(process.argv.slice(2));
