import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

/**
 * Audit functional — per-clone declaration-state seeding (phase 1.5 of
 * /audit-functional, v2 "DB-bis" model).
 *
 * Each parallel runner gets its OWN cloned database + its OWN app instance
 * (see manage_audit_instances.sh). The funnel is bound to the SESSION SIREN
 * (the ProConnect SIRET — `getEffectiveSiren`), NOT to a selectable company,
 * so isolation is achieved per-DB: every clone holds the SAME session SIREN
 * but a DIFFERENT declaration state. This script writes the branch-class state
 * (workforce / hasCse / GIP prefill / status) onto the session SIREN inside
 * each clone DB.
 *
 * Self-contained SQL, mirroring scripts/audit-cleanup.mjs.
 *
 * Usage:
 *   node scripts/audit-seed-fixtures.mjs <RUN_DIR>
 *
 * Reads: <RUN_DIR>/flows.json          (fixtures[] = branch-class specs)
 *        <RUN_DIR>/instances.map.json  ({ "<fixtureId>": { db, port, ... } })
 *
 * Teardown is handled by `manage_audit_instances.sh teardown` (it DROPs the
 * clone DBs entirely), so this script only seeds.
 *
 * Env: AUDIT_PG_URL_BASE (default postgres://postgres:postgres@localhost:5438)
 */

const PG_URL_BASE =
	process.env.AUDIT_PG_URL_BASE ??
	"postgres://postgres:postgres@localhost:5438";
/** The session SIREN every clone is keyed on (test ProConnect SIRET → SIREN). */
const SESSION_SIREN = "130025265";

/**
 * Apply a branch-class state to the session SIREN inside one clone DB.
 * @param {object} args
 * @param {import("postgres").Sql} args.sql
 * @param {number} args.year
 * @param {{workforce?:number, hasCse?:boolean, gipPrefill?:boolean, status?:string}} args.fixture
 */
async function seedState({ sql, year, fixture }) {
	const workforce = Number.isFinite(fixture.workforce)
		? fixture.workforce
		: null;
	const hasCse = typeof fixture.hasCse === "boolean" ? fixture.hasCse : null;
	// Map the fixture's conceptual status onto a valid declaration_status enum
	// value (the cartographer may use a human label like "submitted"). Unknown
	// values fall back to a "post-draft / already submitted" state so the
	// redirect/guard paths still exercise correctly.
	const VALID_STATUS = new Set([
		"draft",
		"awaiting_compliance_path_choice",
		"corrective_actions_chosen",
		"joint_evaluation_chosen",
		"awaiting_revision_choice",
		"revised_joint_evaluation_chosen",
		"awaiting_cse_opinion",
		"demarche_completed",
	]);
	const rawStatus =
		typeof fixture.status === "string" ? fixture.status : "draft";
	const status = VALID_STATUS.has(rawStatus) ? rawStatus : "demarche_completed";

	// Company context for the session SIREN.
	await sql`
		UPDATE app_company SET workforce = ${workforce}, has_cse = ${hasCse}, updated_at = NOW()
		WHERE siren = ${SESSION_SIREN}
	`;

	// Reset the current-year declaration to the desired starting state.
	// (mirrors the e2e resetDeclarationToDraft + clears the year's children so
	// each branch-class starts from a clean funnel.)
	await sql`
		DELETE FROM app_employee_category WHERE job_category_id IN (
			SELECT jc.id FROM app_job_category jc
			JOIN app_declaration d ON d.id = jc.declaration_id
			WHERE d.siren = ${SESSION_SIREN} AND d.year = ${year})
	`;
	await sql`DELETE FROM app_job_category WHERE declaration_id IN (
		SELECT id FROM app_declaration WHERE siren = ${SESSION_SIREN} AND year = ${year})`;
	await sql`DELETE FROM app_cse_opinion WHERE declaration_id IN (
		SELECT id FROM app_declaration WHERE siren = ${SESSION_SIREN} AND year = ${year})`;
	await sql`DELETE FROM app_file WHERE declaration_id IN (
		SELECT id FROM app_declaration WHERE siren = ${SESSION_SIREN} AND year = ${year})`;
	await sql`DELETE FROM app_declaration_status_history WHERE declaration_id IN (
		SELECT id FROM app_declaration WHERE siren = ${SESSION_SIREN} AND year = ${year})`;

	const existing = await sql`
		SELECT id FROM app_declaration
		WHERE siren = ${SESSION_SIREN} AND year = ${year} AND cancelled_at IS NULL LIMIT 1
	`;
	if (existing.length === 0) {
		// Create from scratch if the clone had no current-year declaration.
		const users = await sql`
			SELECT user_id FROM app_user_company WHERE siren = ${SESSION_SIREN} LIMIT 1`;
		const userId = users[0]?.user_id;
		if (!userId)
			throw new Error(
				`Clone has no user linked to session SIREN ${SESSION_SIREN}.`,
			);
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, current_step, status, created_at, updated_at)
			VALUES (gen_random_uuid(), ${SESSION_SIREN}, ${year}, ${userId}, 1, ${status}, NOW(), NOW())
		`;
	} else {
		await sql`
			UPDATE app_declaration
			SET status = ${status}, current_step = 1,
			    first_declaration_path_choice = NULL, second_declaration_path_choice = NULL,
			    total_women = NULL, total_men = NULL, draft = NULL, draft_updated_at = NULL,
			    updated_at = NOW()
			WHERE siren = ${SESSION_SIREN} AND year = ${year}
		`;
	}

	// Optional GIP-MDS prefill row.
	if (fixture.gipPrefill) {
		await sql`
			INSERT INTO app_gip_mds_data
				(siren, year, imported_at, workforce_ema, global_hourly_mean_gap, variable_hourly_mean_gap)
			VALUES (${SESSION_SIREN}, ${year}, NOW(), ${workforce}, 3.2, 1.5)
			ON CONFLICT (siren, year) DO NOTHING
		`;
	}
}

async function run(runDir) {
	const flows = JSON.parse(
		await readFile(path.join(runDir, "flows.json"), "utf8"),
	);
	const map = JSON.parse(
		await readFile(path.join(runDir, "instances.map.json"), "utf8"),
	);
	const fixtures = Array.isArray(flows.fixtures) ? flows.fixtures : [];
	if (fixtures.length === 0) throw new Error("No fixtures in flows.json");

	for (const fixture of fixtures) {
		const entry = map[fixture.id];
		if (!entry?.db) {
			console.warn(
				`[audit-seed] no clone DB for fixture ${fixture.id} — skipped`,
			);
			continue;
		}
		const sql = postgres(`${PG_URL_BASE}/${entry.db}`, { max: 1 });
		try {
			const yearRows =
				await sql`SELECT EXTRACT(YEAR FROM CURRENT_DATE)::int AS year`;
			const year = yearRows[0]?.year ?? new Date().getUTCFullYear();
			await seedState({ sql, year, fixture });
			console.log(
				`[audit-seed] ${fixture.id} → db=${entry.db} (workforce=${fixture.workforce ?? "-"}, hasCse=${fixture.hasCse ?? "-"}, gipPrefill=${!!fixture.gipPrefill}, status=${fixture.status ?? "draft"})`,
			);
		} finally {
			await sql.end();
		}
	}
	console.log(`[audit-seed] Seeded state into ${fixtures.length} clone DB(s).`);
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
	const runDir = process.argv[2];
	if (!runDir) {
		console.error("Usage: node scripts/audit-seed-fixtures.mjs <RUN_DIR>");
		process.exit(1);
	}
	try {
		await run(runDir);
		process.exit(0);
	} catch (error) {
		console.error(
			"[audit-seed] Failed:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

export { seedState };
