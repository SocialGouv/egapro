#!/usr/bin/env node

//
// Injects multi-year history onto the Observatoire for the 10 `purpose:
// "rgaa"` SIRENs of data/dedicated-test-sirens.json, so the external RGAA
// audit can reach the year selector, the history chart and the
// Représentation tab — which a freshly deployed env never shows, since only
// the current campaign year exists there.
//
// Writes declarations for campaign years C-N..C-1 (current campaign year C
// is never touched: the auditor declares it) and representation for
// reference years C-N..C-2 (C-1's representation releases under campaign C,
// left for the auditor). `app_company` is never written: these are real
// companies, identified by the GIP import.
//
// Refuses to write anything unless the Observatoire demo fixture
// (`pnpm db:seed-observatory`) is already loaded, and unless every target
// `app_company` row already exists. Idempotent: re-running leaves the same
// rows in place, and only ever touches rows it owns (by id prefix for
// declarations/representation, by a sentinel `imported_at` for GIP rows) —
// a row already occupied by someone else is left intact and listed.
//
// Usage from the repository root:
//   pnpm --filter app db:seed-rgaa-history -- --campaign-year=2026
//   pnpm --filter app db:seed-rgaa-history -- --campaign-year=2026 --years=3
//   pnpm --filter app db:seed-rgaa-history -- --clean
//
// Execution against `rgaa-persist` (port-forward): see
// docs/consultation-publique.md.

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Sql, TransactionSql } from "postgres";
import postgres from "postgres";
import {
	getDefaultCampaignDeadlineColumns,
	parseCampaignYear,
	REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
} from "~/modules/domain";
import dedicatedTestSirens from "../data/dedicated-test-sirens.json";
import {
	DEMO_PUBLIC_RELEASE_DATE,
	DEMO_SEED_USER_ID,
	type GapProfile,
	indicatorValues,
	resolveDatabaseUrl,
} from "./observatorySeedShared";

type DedicatedTestSiren = {
	siren: string;
	name: string;
	purpose: "ui" | "rgaa";
	sizeRange: string;
	workforce: number;
	bucket: string;
};

const SEED_USER_ID = "00000000-9979-4979-8979-000000009979";
const SEED_USER_EMAIL = "seed-rgaa-history@example.fr";
const DECLARATION_ID_PREFIX = "seed-rgaa-history-";
const REPRESENTATION_ID_PREFIX = "seed-rgaa-history-representation-";
// A real GIP import always stamps `imported_at` at NOW(); any fixed sentinel
// in the past tells our own rows apart from theirs.
const GIP_SENTINEL_IMPORTED_AT = new Date("1970-01-01T00:00:00.000Z");
// The oldest history year exists as soon as `years >= 2`, so this pair is always seeded.
const NON_COMPUTABLE_REPRESENTATION_COMPANY_INDEX = 7;

function declarationId(siren: string, year: number): string {
	return `${DECLARATION_ID_PREFIX}${siren}-${year}`;
}

function representationId(siren: string, year: number): string {
	return `${REPRESENTATION_ID_PREFIX}${siren}-${year}`;
}

export type RgaaHistoryTarget = {
	siren: string;
	companyIndex: number;
	workforce: number;
	subjectToRepresentation: boolean;
};

export function resolveTargets(): RgaaHistoryTarget[] {
	return (dedicatedTestSirens as DedicatedTestSiren[])
		.filter((entry) => entry.purpose === "rgaa")
		.map((entry, companyIndex) => ({
			siren: entry.siren,
			companyIndex,
			workforce: entry.workforce,
			subjectToRepresentation:
				entry.workforce >= REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
		}));
}

/** A few percent of year-over-year drift, always below the current workforce — never enough to cross a size bracket. */
function workforceForYear(baseWorkforce: number, yearsAgo: number): number {
	return Math.max(1, Math.round(baseWorkforce * (1 - yearsAgo * 0.01)));
}

/** Covers a threshold crossing, a negative gap, an exact zero and a year without variable-pay gap; deeper `--years` fall back to a flat profile. */
function smallCompanyGapProfile(
	companyIndex: number,
	yearsAgo: number,
): GapProfile {
	if (companyIndex === 0) {
		// Crosses the alert threshold: below, then above, then below again.
		if (yearsAgo === 1) return { annual: 0.03, hourly: 0.025, variable: 0.02 };
		if (yearsAgo === 2) return { annual: 0.07, hourly: 0.065, variable: 0.06 };
		if (yearsAgo === 3) return { annual: 0.02, hourly: 0.018, variable: 0.015 };
	}
	if (companyIndex === 1) {
		// Women earn more every year: a negative gap throughout.
		return {
			annual: -0.01 - yearsAgo * 0.005,
			hourly: -0.008 - yearsAgo * 0.004,
			variable: -0.012 - yearsAgo * 0.004,
		};
	}
	if (companyIndex === 2) {
		// Exactly zero one year.
		if (yearsAgo === 2) return { annual: 0, hourly: 0, variable: 0.01 };
		return { annual: 0.01 + yearsAgo * 0.002, hourly: 0.008, variable: 0.012 };
	}
	if (companyIndex === 3) {
		// No variable-pay gap one year.
		if (yearsAgo === 2) return { annual: 0.025, hourly: 0.02, variable: null };
		return { annual: 0.03, hourly: 0.025, variable: 0.02 };
	}
	return { annual: 0.02, hourly: 0.015, variable: 0.01 };
}

/** Gap profile for the 6 companies subject to representation — a plain, realistic drift, no special variety requirement. */
function bigCompanyGapProfile(
	companyIndex: number,
	yearsAgo: number,
): GapProfile {
	const base = 0.02 + (companyIndex - 4) * 0.01;
	const drift = (yearsAgo - 1) * 0.003;
	return {
		annual: base + drift,
		hourly: base + drift - 0.01,
		variable: base + drift - 0.005,
	};
}

function gapProfileFor(
	target: RgaaHistoryTarget,
	yearsAgo: number,
): GapProfile {
	return target.companyIndex < 4
		? smallCompanyGapProfile(target.companyIndex, yearsAgo)
		: bigCompanyGapProfile(target.companyIndex, yearsAgo);
}

type RepresentationProfile = {
	executiveWomenPercent: number | null;
	memberWomenPercent: number | null;
	computable: boolean;
};

function representationProfileFor(
	target: RgaaHistoryTarget,
	year: number,
	oldestYear: number,
): RepresentationProfile {
	if (
		target.companyIndex === NON_COMPUTABLE_REPRESENTATION_COMPANY_INDEX &&
		year === oldestYear
	) {
		return {
			executiveWomenPercent: null,
			memberWomenPercent: null,
			computable: false,
		};
	}
	const executiveWomenPercent =
		25 + (target.companyIndex - 4) * 3 + ((year % 5) + 1);
	return {
		executiveWomenPercent,
		memberWomenPercent: executiveWomenPercent + 10,
		computable: true,
	};
}

export type IgnoredRow = {
	table: string;
	siren: string;
	year: number;
	reason: string;
};

export type SeedRgaaHistoryResult = {
	campaignYear: number;
	declarationYears: number[];
	representationReferenceYears: number[];
	correctedCampaignYears: number[];
	ignored: IgnoredRow[];
};

export async function assertDemoFixturePresent(sql: Sql): Promise<void> {
	const rows = await sql`
		SELECT 1 FROM app_user WHERE id = ${DEMO_SEED_USER_ID}
	`;
	if (rows.length === 0) {
		throw new Error(
			"Observatory demo fixture not found — run `pnpm db:seed-observatory` first. Refusing to write fictitious data outside a demo database.",
		);
	}
}

export async function assertTargetCompaniesExist(
	sql: Sql,
	sirens: string[],
): Promise<void> {
	const rows = await sql<{ siren: string }[]>`
		SELECT siren FROM app_company WHERE siren = ANY(${sirens})
	`;
	const found = new Set(rows.map((row) => row.siren));
	const missing = sirens.filter((siren) => !found.has(siren));
	if (missing.length > 0) {
		throw new Error(
			`Missing app_company row(s) for: ${missing.join(", ")} — run the GIP import first.`,
		);
	}
}

async function ensureCampaignDeadlineReleased(
	tx: TransactionSql,
	year: number,
	corrected: number[],
): Promise<void> {
	const existing = await tx<{ exists: boolean }[]>`
		SELECT EXISTS(SELECT 1 FROM app_campaign_deadline WHERE year = ${year}) AS "exists"
	`;
	if (!existing[0]?.exists) {
		const defaults = getDefaultCampaignDeadlineColumns(year);
		await tx`
			INSERT INTO app_campaign_deadline (
				year, public_data_release_date,
				decl1_modification_deadline, decl1_justification_deadline,
				decl1_joint_evaluation_deadline, decl2_modification_deadline,
				decl2_justification_deadline, decl2_joint_evaluation_deadline,
				decl2_cse_opinion_deadline
			) VALUES (
				${year}, ${DEMO_PUBLIC_RELEASE_DATE},
				${defaults.decl1ModificationDeadline},
				${defaults.decl1JustificationDeadline},
				${defaults.decl1JointEvaluationDeadline},
				${defaults.decl2ModificationDeadline},
				${defaults.decl2JustificationDeadline},
				${defaults.decl2JointEvaluationDeadline},
				${defaults.decl2CseOpinionDeadline}
			)
		`;
		corrected.push(year);
		return;
	}

	const updated = await tx<{ year: number }[]>`
		UPDATE app_campaign_deadline
		SET public_data_release_date = ${DEMO_PUBLIC_RELEASE_DATE}
		WHERE year = ${year}
			AND (
				public_data_release_date IS NULL
				OR public_data_release_date > (now() AT TIME ZONE 'Europe/Paris')::date
			)
		RETURNING year
	`;
	if (updated.length > 0) corrected.push(year);
}

async function writeGipMdsRow(
	tx: TransactionSql,
	siren: string,
	year: number,
	workforce: number,
	ignored: IgnoredRow[],
): Promise<void> {
	const foreign = await tx<{ siren: string }[]>`
		SELECT siren FROM app_gip_mds_data
		WHERE siren = ${siren} AND year = ${year}
			AND imported_at IS DISTINCT FROM ${GIP_SENTINEL_IMPORTED_AT}
	`;
	if (foreign.length > 0) {
		ignored.push({
			table: "app_gip_mds_data",
			siren,
			year,
			reason: "row imported from a real GIP file",
		});
		return;
	}

	const periodStart = `${year}-01-01`;
	const periodEnd = `${year}-12-31`;
	await tx`
		INSERT INTO app_gip_mds_data (siren, year, workforce_ema, period_start, period_end, imported_at)
		VALUES (${siren}, ${year}, ${workforce}, ${periodStart}, ${periodEnd}, ${GIP_SENTINEL_IMPORTED_AT})
		ON CONFLICT (siren, year) DO UPDATE SET
			workforce_ema = EXCLUDED.workforce_ema,
			period_start = EXCLUDED.period_start,
			period_end = EXCLUDED.period_end,
			imported_at = EXCLUDED.imported_at
	`;
}

async function writeDeclaration(
	tx: TransactionSql,
	target: RgaaHistoryTarget,
	year: number,
	profile: GapProfile,
	workforce: number,
	ignored: IgnoredRow[],
): Promise<void> {
	const id = declarationId(target.siren, year);

	const foreign = await tx<{ id: string }[]>`
		SELECT id FROM app_declaration
		WHERE siren = ${target.siren} AND year = ${year}
			AND cancelled_at IS NULL
			AND id != ${id}
	`;
	if (foreign.length > 0) {
		ignored.push({
			table: "app_declaration",
			siren: target.siren,
			year,
			reason: "active declaration not owned by this script",
		});
		return;
	}

	await tx`DELETE FROM app_declaration WHERE id = ${id}`;

	const values = indicatorValues(target.companyIndex, profile, workforce);
	await tx`
		INSERT INTO app_declaration (
			id, siren, year, declarant_id, status, total_women, total_men,
			global_annual_mean_gap, global_hourly_mean_gap,
			variable_annual_mean_gap, variable_hourly_mean_gap,
			global_annual_median_gap, global_hourly_median_gap,
			variable_annual_median_gap, variable_hourly_median_gap,
			variable_proportion_women, variable_proportion_men,
			annual_quartile1_proportion_women, annual_quartile1_proportion_men,
			annual_quartile2_proportion_women, annual_quartile2_proportion_men,
			annual_quartile3_proportion_women, annual_quartile3_proportion_men,
			annual_quartile4_proportion_women, annual_quartile4_proportion_men,
			hourly_quartile1_proportion_women, hourly_quartile1_proportion_men,
			hourly_quartile2_proportion_women, hourly_quartile2_proportion_men,
			hourly_quartile3_proportion_women, hourly_quartile3_proportion_men,
			hourly_quartile4_proportion_women, hourly_quartile4_proportion_men,
			created_at, updated_at
		) VALUES (
			${id}, ${target.siren}, ${year},
			${SEED_USER_ID}, 'demarche_completed', ${values.totalWomen}, ${values.totalMen},
			${values.globalAnnualMeanGap}, ${values.globalHourlyMeanGap},
			${values.variableAnnualMeanGap}, ${values.variableHourlyMeanGap},
			${values.globalAnnualMedianGap}, ${values.globalHourlyMedianGap},
			${values.variableAnnualMedianGap}, ${values.variableHourlyMedianGap},
			${values.variableProportionWomen}, ${values.variableProportionMen},
			${values.annualQuartile1Women}, ${values.annualQuartile1Men},
			${values.annualQuartile2Women}, ${values.annualQuartile2Men},
			${values.annualQuartile3Women}, ${values.annualQuartile3Men},
			${values.annualQuartile4Women}, ${values.annualQuartile4Men},
			${values.hourlyQuartile1Women}, ${values.hourlyQuartile1Men},
			${values.hourlyQuartile2Women}, ${values.hourlyQuartile2Men},
			${values.hourlyQuartile3Women}, ${values.hourlyQuartile3Men},
			${values.hourlyQuartile4Women}, ${values.hourlyQuartile4Men},
			NOW(), NOW()
		)
	`;
}

async function writeRepresentation(
	tx: TransactionSql,
	target: RgaaHistoryTarget,
	year: number,
	profile: RepresentationProfile,
	ignored: IgnoredRow[],
): Promise<void> {
	const id = representationId(target.siren, year);

	const foreign = await tx<{ id: string }[]>`
		SELECT id FROM app_representation_declaration
		WHERE siren = ${target.siren} AND year = ${year} AND id != ${id}
	`;
	if (foreign.length > 0) {
		ignored.push({
			table: "app_representation_declaration",
			siren: target.siren,
			year,
			reason: "representation not owned by this script",
		});
		return;
	}

	await tx`DELETE FROM app_representation_declaration WHERE id = ${id}`;

	const executiveMenPercent =
		profile.executiveWomenPercent === null
			? null
			: 100 - profile.executiveWomenPercent;
	const memberMenPercent =
		profile.memberWomenPercent === null
			? null
			: 100 - profile.memberWomenPercent;

	await tx`
		INSERT INTO app_representation_declaration (
			id, siren, year, declarant_id,
			reference_period_start, reference_period_end,
			executive_women_percent, executive_men_percent,
			not_computable_reason_executives,
			member_women_percent, member_men_percent,
			not_computable_reason_members,
			publish_modalities, status, submitted_at,
			created_at, updated_at
		) VALUES (
			${id}, ${target.siren}, ${year}, ${SEED_USER_ID},
			${`${year}-01-01`}, ${`${year}-12-31`},
			${profile.executiveWomenPercent}, ${executiveMenPercent},
			${profile.computable ? null : "aucun_cadre_dirigeant"},
			${profile.memberWomenPercent}, ${memberMenPercent},
			${profile.computable ? null : "aucune_instance_dirigeante"},
			'Publication de démonstration', 'submitted', NOW(),
			NOW(), NOW()
		)
	`;
}

export type SeedRgaaHistoryOptions = {
	campaignYear: number;
	/** Depth of history to inject, in years before `campaignYear` (default 3). */
	years?: number;
};

function assertValidYears(years: number): void {
	if (!Number.isInteger(years) || years < 1) {
		throw new Error("years must be a positive integer");
	}
}

/**
 * Writes the RGAA observatory history. Refuses — without writing anything —
 * unless the demo fixture is loaded and every target `app_company` exists.
 * Idempotent: a second call with the same options leaves the database
 * unchanged; a row it does not own (an active declaration, a representation,
 * or a GIP row from a real import) is left intact and reported in `ignored`.
 */
export async function seedRgaaObservatoryHistory(
	sql: Sql,
	options: SeedRgaaHistoryOptions,
): Promise<SeedRgaaHistoryResult> {
	const years = options.years ?? 3;
	assertValidYears(years);

	const targets = resolveTargets();
	const sirens = targets.map((target) => target.siren);

	await assertDemoFixturePresent(sql);
	await assertTargetCompaniesExist(sql, sirens);

	const campaignYear = options.campaignYear;
	const oldestYear = campaignYear - years;
	const declarationYears = Array.from(
		{ length: years },
		(_, i) => oldestYear + i,
	);
	const representationReferenceYears = declarationYears.slice(0, -1);

	const ignored: IgnoredRow[] = [];
	const correctedCampaignYears: number[] = [];

	await sql.begin(async (tx) => {
		await tx`
			INSERT INTO app_user (id, email, first_name, last_name, is_admin)
			VALUES (${SEED_USER_ID}, ${SEED_USER_EMAIL}, 'Seed', 'RGAA Historique', false)
			ON CONFLICT (id) DO NOTHING
		`;

		for (const year of declarationYears) {
			await ensureCampaignDeadlineReleased(tx, year, correctedCampaignYears);
		}

		for (const target of targets) {
			for (const year of declarationYears) {
				const yearsAgo = campaignYear - year;
				const workforce = workforceForYear(target.workforce, yearsAgo);
				await writeGipMdsRow(tx, target.siren, year, workforce, ignored);
				await writeDeclaration(
					tx,
					target,
					year,
					gapProfileFor(target, yearsAgo),
					workforce,
					ignored,
				);
			}

			if (!target.subjectToRepresentation) continue;
			for (const year of representationReferenceYears) {
				const profile = representationProfileFor(target, year, oldestYear);
				await writeRepresentation(tx, target, year, profile, ignored);
			}
		}
	});

	return {
		campaignYear,
		declarationYears,
		representationReferenceYears,
		correctedCampaignYears,
		ignored,
	};
}

/** Removes only the rows this script owns (by id prefix / GIP sentinel) and the seed user. Campaign deadline corrections are shared with the rest of the env and are never restored. */
export async function cleanRgaaObservatoryHistory(sql: Sql): Promise<void> {
	const sirens = resolveTargets().map((target) => target.siren);
	await sql.begin(async (tx) => {
		await tx`
			DELETE FROM app_representation_declaration
			WHERE siren = ANY(${sirens}) AND id LIKE ${`${REPRESENTATION_ID_PREFIX}%`}
		`;
		await tx`
			DELETE FROM app_declaration_status_history
			WHERE declaration_id IN (
				SELECT id FROM app_declaration
				WHERE siren = ANY(${sirens}) AND id LIKE ${`${DECLARATION_ID_PREFIX}%`}
			)
		`;
		await tx`
			DELETE FROM app_declaration
			WHERE siren = ANY(${sirens}) AND id LIKE ${`${DECLARATION_ID_PREFIX}%`}
		`;
		await tx`
			DELETE FROM app_gip_mds_data
			WHERE siren = ANY(${sirens}) AND imported_at = ${GIP_SENTINEL_IMPORTED_AT}
		`;
		await tx`DELETE FROM app_user WHERE id = ${SEED_USER_ID}`;
	});
}

function printSummary(result: SeedRgaaHistoryResult): void {
	console.log(
		`[seed-rgaa-history] seeded ${resolveTargets().length} companies over ${result.declarationYears.join(", ")} (campaign year ${result.campaignYear} untouched).`,
	);
	if (result.correctedCampaignYears.length > 0) {
		console.log(
			`[seed-rgaa-history] campaign deadlines released for: ${result.correctedCampaignYears.join(", ")}`,
		);
	}
	if (result.ignored.length > 0) {
		console.log("[seed-rgaa-history] left intact (not owned by this script):");
		for (const row of result.ignored) {
			console.log(`  - ${row.table} ${row.siren}/${row.year}: ${row.reason}`);
		}
	}
	console.log(
		"[seed-rgaa-history] open http://localhost:3000/index-egapro/recherche",
	);
}

type ParsedCliArgs =
	| { ok: true; clean: true }
	| { ok: true; clean: false; campaignYear: number; years: number }
	| { ok: false };

function parseCliArgs(argv: string[]): ParsedCliArgs {
	const args: Record<string, string | true> = Object.fromEntries(
		argv
			.filter((arg) => arg !== "--")
			.map((arg): [string, string | true] => {
				if (arg === "--clean") return ["clean", true];
				const match = arg.match(/^--([^=]+)=(.+)$/);
				const key = match?.[1];
				const value = match?.[2];
				return key === undefined || value === undefined
					? [arg, true]
					: [key, value];
			}),
	);

	const KNOWN_ARGS = new Set(["campaign-year", "years", "clean"]);
	for (const key of Object.keys(args)) {
		if (!KNOWN_ARGS.has(key)) {
			console.error(`ERROR: unknown argument --${key}`);
			return { ok: false };
		}
	}

	if (args.clean === true) return { ok: true, clean: true };

	const rawCampaignYear = args["campaign-year"];
	if (typeof rawCampaignYear !== "string") {
		console.error("ERROR: --campaign-year=<year> is required");
		return { ok: false };
	}
	const campaignYear = parseCampaignYear(rawCampaignYear);
	if (campaignYear === null) {
		console.error(
			"ERROR: --campaign-year must be a 4-digit year between 2000 and 2100",
		);
		return { ok: false };
	}

	const rawYears = args.years;
	const years =
		rawYears === undefined ? 3 : Number.parseInt(String(rawYears), 10);
	if (!Number.isInteger(years) || years < 1) {
		console.error("ERROR: --years must be a positive integer");
		return { ok: false };
	}

	return { ok: true, clean: false, campaignYear, years };
}

async function main(): Promise<void> {
	const parsed = parseCliArgs(process.argv.slice(2));
	if (!parsed.ok) {
		process.exit(1);
	}

	const sql = postgres(resolveDatabaseUrl(), { max: 1 });
	try {
		if (parsed.clean) {
			await cleanRgaaObservatoryHistory(sql);
			console.log(
				`[seed-rgaa-history] cleaned ${resolveTargets().length} targets.`,
			);
			return;
		}

		const result = await seedRgaaObservatoryHistory(sql, {
			campaignYear: parsed.campaignYear,
			years: parsed.years,
		});
		printSummary(result);
	} finally {
		await sql.end();
	}
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
	main().catch((error) => {
		console.error("[seed-rgaa-history] FAILED:", error);
		process.exit(1);
	});
}
