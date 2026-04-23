/**
 * Local dev seed for the K8 admin conformity stats page.
 *
 * Populates synthetic companies + submitted declarations across four campaign
 * years (currentYear-3 … currentYear) so that `/admin/stats/conformite` has
 * enough data to exercise every filter (year / workforce bucket / NAF sector)
 * and show a plausible year-over-year delta on the KPI tile.
 *
 * Idempotent: each run upserts the same deterministic rows — feel free to run
 * it repeatedly or after resetting the DB.
 *
 * Usage (from packages/app):
 *   pnpm seed:conformite        # insert / refresh the fixture
 *   pnpm seed:conformite clean  # remove the fixture
 *
 * Env: DATABASE_URL (or POSTGRES_* as with the other scripts in this folder).
 */

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const SEED_DECLARANT_EMAIL = "seed-conformite@egapro.local";
const SEED_DECLARANT_ID = "seed-conformite-declarant-0000-0000000";

/** 777XXXXXX SIRENs are reserved for this fixture. */
const SIREN_PREFIX = "777";
/** Generates one company per (bucket × sector) combination, 5 × 8 = 40. */
const WORKFORCE_BUCKETS = [20, 60, 120, 180, 300];
const NAF_SAMPLE_CODES = [
	"A01.11Z", // A — Agriculture
	"C10.11Z", // C — Industrie manufacturière
	"F41.10A", // F — Construction
	"G47.11B", // G — Commerce
	"J62.01Z", // J — Information & communication
	"K64.19Z", // K — Activités financières et d'assurance
	"M70.10Z", // M — Activités spécialisées
	"Q86.10Z", // Q — Santé humaine
];
/** Number of most-recent campaign years to seed (current year + N-1 … N-3). */
const CAMPAIGN_YEARS_BACK = 4;

/**
 * Hard-fail when the script is about to talk to a production database.
 *
 * Defence in depth on top of the `EGAPRO_AUTO_SEED_CONFORMITE` opt-in
 * flag and the `.kontinuous/env/dev` scoping: even a configuration
 * mistake that leaks the flag into preprod or prod cannot end up
 * overwriting real declarations with synthetic ones.
 *
 * Signals that prevent execution, in priority order:
 *  - `NEXT_PUBLIC_EGAPRO_ENV` equals `"prod"` / `"production"` / `"preprod"`
 *    (set by kontinuous `app.vars`, matches the values in
 *    `.kontinuous/env/{prod,preprod}/`).
 *  - `EGAPRO_ENV` same values (some scripts read this non-public form).
 *
 * Explicit bypass for CI / emergency: `EGAPRO_ALLOW_SEED_IN_PROD=true`.
 * Leaves the seed usable from a break-glass terminal if someone ever
 * needs it — but that is a deliberate, logged decision.
 */
function assertNotProduction() {
	if (process.env.EGAPRO_ALLOW_SEED_IN_PROD === "true") return;
	const signals = [process.env.NEXT_PUBLIC_EGAPRO_ENV, process.env.EGAPRO_ENV]
		.filter((v) => typeof v === "string" && v.length > 0)
		.map((v) => v.toLowerCase());
	const forbidden = ["prod", "production", "preprod", "preproduction"];
	const hit = signals.find((v) => forbidden.includes(v));
	if (hit) {
		console.error(
			`[seed-conformite] refusing to run against a ${hit} environment. Set EGAPRO_ALLOW_SEED_IN_PROD=true to override.`,
		);
		process.exit(1);
	}
}

function getDatabaseUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
	const user = encodeURIComponent(process.env.POSTGRES_USER ?? "postgres");
	const password = process.env.POSTGRES_PASSWORD
		? `:${encodeURIComponent(process.env.POSTGRES_PASSWORD)}`
		: "";
	const host = process.env.POSTGRES_HOST ?? "localhost";
	const port = process.env.POSTGRES_PORT ?? "5438";
	const db = process.env.POSTGRES_DB ?? "egapro";
	return `postgresql://${user}${password}@${host}:${port}/${db}`;
}

/**
 * Deterministic hash → [0, 1) pseudo-random, so re-runs are stable.
 * @param {number} n
 */
function pseudoRandom(n) {
	const hash = (n * 2654435761) >>> 0;
	return hash / 2 ** 32;
}

/**
 * Decide whether a (siren, year) pair is flagged as alert. We drift the base
 * rate down over time so the delta badge is visible (improvement), and we add
 * a small NAF-sector bias so the sector filter visibly changes the result.
 *
 * @param {number} companyIndex
 * @param {number} yearsBeforeCurrent  0 = current year, 1 = N-1, ...
 * @param {string} nafCode
 */
function shouldHaveAlertGap(companyIndex, yearsBeforeCurrent, nafCode) {
	// Gentle downward drift: older years sit around 50%, the current year at
	// ~40% — the K8 points-delta badge between any two adjacent years should
	// show a visible ~2pt swing.
	const baseRate = 0.4 + 0.02 * yearsBeforeCurrent;
	const sectorBias = nafCode.startsWith("K")
		? 0.12
		: nafCode.startsWith("M")
			? -0.1
			: 0;
	const threshold = Math.min(0.9, Math.max(0.05, baseRate + sectorBias));
	return pseudoRandom(companyIndex * 101 + yearsBeforeCurrent * 17) < threshold;
}

/**
 * Build a plausible average gap (0..12%) for a seed row so K10 has something
 * to plot. Same shape as `shouldHaveAlertGap`: slightly improving over time,
 * with a sector bias (K finance skewed up, M services skewed down). Clamped
 * to [0.5, 12] so the chart's Y-axis stays readable.
 */
function pseudoAverageGap(companyIndex, yearsBeforeCurrent, nafCode) {
	const baseGap = 4 + 0.6 * yearsBeforeCurrent;
	const sectorShift = nafCode.startsWith("K")
		? 2.5
		: nafCode.startsWith("M")
			? -1.5
			: 0;
	const jitter =
		(pseudoRandom(companyIndex * 211 + yearsBeforeCurrent) - 0.5) * 3;
	const value = baseGap + sectorShift + jitter;
	return Math.max(0.5, Math.min(12, Math.round(value * 10) / 10));
}

function sirenFor(index) {
	return `${SIREN_PREFIX}${String(index).padStart(6, "0")}`;
}

function buildCompanyCatalog() {
	/** @type {Array<{ siren: string; workforce: number; nafCode: string }>} */
	const catalog = [];
	let index = 1;
	for (const workforce of WORKFORCE_BUCKETS) {
		for (const nafCode of NAF_SAMPLE_CODES) {
			catalog.push({ siren: sirenFor(index), workforce, nafCode });
			index++;
		}
	}
	return catalog;
}

/** @param {import("postgres").Sql} sql */
async function ensureDeclarant(sql) {
	await sql`
		INSERT INTO app_user (id, email, is_admin)
		VALUES (${SEED_DECLARANT_ID}, ${SEED_DECLARANT_EMAIL}, false)
		ON CONFLICT (id) DO NOTHING
	`;
}

/** @param {import("postgres").Sql} sql */
async function seed(sql) {
	await ensureDeclarant(sql);

	const catalog = buildCompanyCatalog();
	const currentYear = new Date().getFullYear();

	let insertedCompanies = 0;
	let insertedDeclarations = 0;

	for (const { siren, workforce, nafCode } of catalog) {
		await sql`
			INSERT INTO app_company (siren, name, workforce, naf_code, created_at, updated_at)
			VALUES (
				${siren},
				${`Seed K8 ${siren}`},
				${workforce},
				${nafCode},
				NOW(),
				NOW()
			)
			ON CONFLICT (siren) DO UPDATE SET
				workforce = EXCLUDED.workforce,
				naf_code = EXCLUDED.naf_code,
				updated_at = NOW()
		`;
		insertedCompanies++;
	}

	const totalYears = currentYear - FIRST_SEED_YEAR + 1;
	for (let yearsBack = 0; yearsBack < totalYears; yearsBack++) {
		const year = currentYear - yearsBack;
		let companyIndex = 0;
		for (const { siren, nafCode } of catalog) {
			companyIndex++;
			const hasAlertGap = shouldHaveAlertGap(companyIndex, yearsBack, nafCode);
			const averageGap = pseudoAverageGap(companyIndex, yearsBack, nafCode);
			// Spread submissions over January-February so the rows look realistic
			// (even though the campaign progression chart is not what we exercise
			// here, keeping a plausible date avoids surprises elsewhere).
			const submittedAt = new Date(
				Date.UTC(year, 0, 15 + (companyIndex % 30), 9, 0, 0),
			).toISOString();
			await sql`
				INSERT INTO app_declaration (
					id, siren, year, declarant_id, current_step, status,
					submitted_at, has_alert_gap, average_gap, created_at, updated_at
				)
				VALUES (
					gen_random_uuid(),
					${siren},
					${year},
					${SEED_DECLARANT_ID},
					6,
					'submitted',
					${submittedAt},
					${hasAlertGap},
					${averageGap},
					NOW(),
					NOW()
				)
				ON CONFLICT ON CONSTRAINT declaration_siren_year_idx DO UPDATE SET
					status = 'submitted',
					submitted_at = EXCLUDED.submitted_at,
					has_alert_gap = EXCLUDED.has_alert_gap,
					average_gap = EXCLUDED.average_gap,
					updated_at = NOW()
			`;
			insertedDeclarations++;
		}
	}

	return { insertedCompanies, insertedDeclarations };
}

/** @param {import("postgres").Sql} sql */
async function clean(sql) {
	const [{ deleted: deletedDeclarations }] = await sql`
		WITH deleted AS (
			DELETE FROM app_declaration WHERE siren LIKE ${`${SIREN_PREFIX}%`} RETURNING 1
		)
		SELECT COUNT(*)::int AS deleted FROM deleted
	`;
	const [{ deleted: deletedCompanies }] = await sql`
		WITH deleted AS (
			DELETE FROM app_company WHERE siren LIKE ${`${SIREN_PREFIX}%`} RETURNING 1
		)
		SELECT COUNT(*)::int AS deleted FROM deleted
	`;
	const [{ deleted: deletedUsers }] = await sql`
		WITH deleted AS (
			DELETE FROM app_user WHERE id = ${SEED_DECLARANT_ID} RETURNING 1
		)
		SELECT COUNT(*)::int AS deleted FROM deleted
	`;
	return { deletedDeclarations, deletedCompanies, deletedUsers };
}

async function main() {
	assertNotProduction();
	const mode = process.argv[2] ?? "seed";
	const sql = postgres(getDatabaseUrl(), { max: 1 });
	try {
		if (mode === "clean") {
			const result = await clean(sql);
			console.log(
				`[seed-conformite] cleaned: ${result.deletedDeclarations} declarations, ${result.deletedCompanies} companies, ${result.deletedUsers} declarant.`,
			);
			return;
		}
		if (mode !== "seed") {
			console.error(`Unknown mode "${mode}". Use "seed" (default) or "clean".`);
			process.exit(2);
		}
		const result = await seed(sql);
		console.log(
			`[seed-conformite] upserted ${result.insertedCompanies} companies and ${result.insertedDeclarations} submitted declarations from ${FIRST_SEED_YEAR} to the current year.`,
		);
		console.log(
			`[seed-conformite] open http://localhost:3000/admin/stats/conformite to browse the tile.`,
		);
	} finally {
		await sql.end();
	}
}

if (
	import.meta.url === `file://${realpathSync(fileURLToPath(import.meta.url))}`
) {
	main().catch((error) => {
		console.error("[seed-conformite] failed:", error);
		process.exit(1);
	});
}
