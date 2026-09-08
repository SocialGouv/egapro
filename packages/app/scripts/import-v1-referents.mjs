import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

import { mapReferentSnapshotFromV1 } from "./import-v1-referents-mapping.mjs";

/** @typedef {import("postgres").Sql} Sql */
/** @typedef {import("./import-v1-referents-mapping.mjs").MappedReferent} MappedReferent */

/**
 * @typedef {Object} ImportCounters
 * @property {number} totalRead
 * @property {number} targetBefore
 * @property {number} imported
 */

const USAGE = "Usage: import-v1-referents [--dry-run]";
const INSERT_BATCH_SIZE = 500;

/**
 * @param {string[]} argv
 * @returns {{ dryRun: boolean }}
 */
export function parseCliArgs(argv) {
	let dryRun = false;
	for (const token of argv) {
		if (token !== "--dry-run") {
			throw new Error(`Unknown argument. ${USAGE}`);
		}
		dryRun = true;
	}
	return { dryRun };
}

/**
 * @param {Sql} sql
 * @returns {Promise<number>}
 */
async function countTargetReferents(sql) {
	const [result] = await sql`
		SELECT COUNT(*)::integer AS count
		FROM app_referent
	`;
	return result?.count ?? 0;
}

/**
 * @param {MappedReferent[]} referents
 * @param {Date} importedAt
 */
function toDatabaseRows(referents, importedAt) {
	return referents.map((referent) => ({
		id: referent.id,
		region: referent.region,
		county: referent.county,
		name: referent.name,
		type: referent.type,
		value: referent.value,
		principal: referent.principal,
		substitute_name: referent.substituteName,
		substitute_email: referent.substituteEmail,
		created_at: importedAt,
		updated_at: importedAt,
	}));
}

/**
 * @param {Object} args
 * @param {Sql} args.legacySql
 * @param {Sql} args.sql
 * @param {boolean} [args.dryRun]
 * @returns {Promise<ImportCounters>}
 */
export async function runImportV1Referents({ legacySql, sql, dryRun = false }) {
	const legacyRows = await legacySql`
		SELECT
			id::text AS id,
			county,
			name,
			principal,
			region,
			type,
			value,
			substitute_name,
			substitute_email
		FROM referent
		ORDER BY id
	`;
	const referents = mapReferentSnapshotFromV1([...legacyRows]);

	if (dryRun) {
		return {
			totalRead: referents.length,
			targetBefore: await countTargetReferents(sql),
			imported: referents.length,
		};
	}

	return sql.begin(async (txRaw) => {
		const tx = /** @type {Sql} */ (/** @type {unknown} */ (txRaw));
		await tx`LOCK TABLE app_referent IN SHARE ROW EXCLUSIVE MODE`;
		const [clock] = await tx`SELECT NOW() AS imported_at`;
		if (!(clock?.imported_at instanceof Date)) {
			throw new Error("Could not read the target database clock");
		}
		const targetBefore = await countTargetReferents(tx);
		await tx`DELETE FROM app_referent`;

		const databaseRows = toDatabaseRows(referents, clock.imported_at);
		for (
			let start = 0;
			start < databaseRows.length;
			start += INSERT_BATCH_SIZE
		) {
			const batch = databaseRows.slice(start, start + INSERT_BATCH_SIZE);
			await tx`
				INSERT INTO app_referent ${tx(
					batch,
					"id",
					"region",
					"county",
					"name",
					"type",
					"value",
					"principal",
					"substitute_name",
					"substitute_email",
					"created_at",
					"updated_at",
				)}
			`;
		}

		return {
			totalRead: referents.length,
			targetBefore,
			imported: referents.length,
		};
	});
}

/**
 * @param {ImportCounters} counters
 * @param {boolean} dryRun
 * @returns {string}
 */
export function formatReport(counters, dryRun) {
	return [
		`${dryRun ? "[dry-run] " : ""}import-v1-referents report`,
		`  total read:    ${counters.totalRead}`,
		`  target before: ${counters.targetBefore}`,
		`  imported:      ${counters.imported}`,
	].join("\n");
}

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

const isMain = (() => {
	const entry = process.argv[1];
	if (!entry) return false;
	try {
		return fileURLToPath(import.meta.url) === realpathSync(entry);
	} catch {
		return false;
	}
})();

if (isMain) {
	let exitCode = 0;
	/** @type {Sql | undefined} */
	let sql;
	/** @type {Sql | undefined} */
	let legacySql;
	try {
		const { dryRun } = parseCliArgs(process.argv.slice(2));

		if (!process.env.LEGACY_DATABASE_URL) {
			throw new Error("LEGACY_DATABASE_URL must be set");
		}

		legacySql = postgres(process.env.LEGACY_DATABASE_URL, { max: 1 });
		sql = postgres(getDatabaseUrl(), { max: 1 });

		const counters = await runImportV1Referents({ legacySql, sql, dryRun });
		console.log(formatReport(counters, dryRun));
	} catch (error) {
		console.error(
			"[import-v1-referents] Failed:",
			error instanceof Error ? error.message : error,
		);
		exitCode = 1;
	} finally {
		await sql?.end();
		await legacySql?.end();
	}
	process.exit(exitCode);
}
