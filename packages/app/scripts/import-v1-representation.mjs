import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

import { COUNTIES, REGIONS } from "../src/modules/domain/index.ts";

const USAGE =
	"Usage: import-v1-representation --from YYYY-MM-DD [--to YYYY-MM-DD] [--dry-run]";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const NON_DIFFUSIBLE_NAF = "[NON-DIFFUSIBLE]";
const IMPORTED_DECLARATION_STEP = 5;
const IMPORTED_DECLARATION_STATUS = "submitted";

export function parseCliArgs(argv, { now = new Date() } = {}) {
	const flags = { dryRun: false };
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (token === "--dry-run") {
			flags.dryRun = true;
			continue;
		}
		if (token === "--from" || token === "--to") {
			flags[token.slice(2)] = argv[i + 1];
			i++;
		}
	}

	if (!flags.from) {
		throw new Error(`--from is required. ${USAGE}`);
	}
	const from = parseDateBoundary(flags.from, "--from");
	const to = flags.to ? parseDateBoundary(flags.to, "--to") : now;
	if (!(to > from)) {
		throw new Error(
			`--to (${flags.to ?? "now"}) must be after --from (${flags.from})`,
		);
	}

	return { from, to, dryRun: flags.dryRun };
}

function parseDateBoundary(value, label) {
	if (!DATE_PATTERN.test(value)) {
		throw new Error(`Invalid ${label} date "${value}": expected YYYY-MM-DD`);
	}
	const date = new Date(`${value}T00:00:00.000Z`);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid ${label} date "${value}"`);
	}
	return date;
}

export function computeReferencePeriodStart(referencePeriodEnd) {
	const start = new Date(`${referencePeriodEnd}T00:00:00.000Z`);
	start.setUTCFullYear(start.getUTCFullYear() - 1);
	start.setUTCDate(start.getUTCDate() + 1);
	return start.toISOString().slice(0, 10);
}

export function mapCompanyFromV1(entreprise) {
	const regionCode = entreprise.région ?? null;
	const departmentCode = entreprise.département ?? null;
	return {
		siren: entreprise.siren,
		name: entreprise.raison_sociale,
		address: entreprise.adresse ?? null,
		nafCode:
			entreprise.code_naf && entreprise.code_naf !== NON_DIFFUSIBLE_NAF
				? entreprise.code_naf
				: null,
		region: regionCode ? (REGIONS[regionCode] ?? null) : null,
		departmentCode,
		departmentLabel: departmentCode ? (COUNTIES[departmentCode] ?? null) : null,
	};
}

export function mapDeclarationFromV1(row) {
	const indicator = row.data.indicateurs.représentation_équilibrée;
	const publication = row.data.déclaration.publication;
	const referencePeriodEnd = row.data.déclaration.fin_période_référence;

	return {
		siren: row.siren,
		year: row.year,
		legacyDeclarant: {
			email: row.data.déclarant.email,
			lastname: row.data.déclarant.nom,
			firstname: row.data.déclarant.prénom,
			phone: row.data.déclarant.téléphone,
		},
		referencePeriodStart: computeReferencePeriodStart(referencePeriodEnd),
		referencePeriodEnd,
		executiveWomenPercent: indicator.motif_non_calculabilité_cadres
			? null
			: (indicator.pourcentage_femmes_cadres ?? null),
		executiveMenPercent: indicator.motif_non_calculabilité_cadres
			? null
			: (indicator.pourcentage_hommes_cadres ?? null),
		notComputableReasonExecutives:
			indicator.motif_non_calculabilité_cadres ?? null,
		memberWomenPercent: indicator.motif_non_calculabilité_membres
			? null
			: (indicator.pourcentage_femmes_membres ?? null),
		memberMenPercent: indicator.motif_non_calculabilité_membres
			? null
			: (indicator.pourcentage_hommes_membres ?? null),
		notComputableReasonMembers:
			indicator.motif_non_calculabilité_membres ?? null,
		publishDate: publication?.date ?? null,
		publishUrl: publication?.url ?? null,
		publishModalities: publication?.modalités ?? null,
		submittedAt: row.declared_at,
		createdAt: row.declared_at,
		updatedAt: row.modified_at,
	};
}

async function ensureCompany(tx, company) {
	await tx`
		INSERT INTO app_company (
			siren, name, address, naf_code, region, department_code, department_label, created_at, updated_at
		) VALUES (
			${company.siren}, ${company.name}, ${company.address}, ${company.nafCode},
			${company.region}, ${company.departmentCode}, ${company.departmentLabel}, NOW(), NOW()
		)
		ON CONFLICT (siren) DO NOTHING
	`;
}

async function insertDeclaration(tx, declaration) {
	await tx`
		INSERT INTO app_representation_declaration (
			id, siren, year, legacy_declarant, imported_from_v1_at,
			reference_period_start, reference_period_end,
			executive_women_percent, executive_men_percent, not_computable_reason_executives,
			member_women_percent, member_men_percent, not_computable_reason_members,
			publish_date, publish_url, publish_modalities,
			current_step, status, submitted_at, created_at, updated_at
		) VALUES (
			${crypto.randomUUID()}, ${declaration.siren}, ${declaration.year},
			${tx.json(declaration.legacyDeclarant)}, NOW(),
			${declaration.referencePeriodStart}, ${declaration.referencePeriodEnd},
			${declaration.executiveWomenPercent}, ${declaration.executiveMenPercent},
			${declaration.notComputableReasonExecutives},
			${declaration.memberWomenPercent}, ${declaration.memberMenPercent},
			${declaration.notComputableReasonMembers},
			${declaration.publishDate}, ${declaration.publishUrl}, ${declaration.publishModalities},
			${IMPORTED_DECLARATION_STEP}, ${IMPORTED_DECLARATION_STATUS},
			${declaration.submittedAt}, ${declaration.createdAt}, ${declaration.updatedAt}
		)
	`;
}

async function updateDeclaration(tx, declaration) {
	await tx`
		UPDATE app_representation_declaration
		SET legacy_declarant = ${tx.json(declaration.legacyDeclarant)},
			reference_period_start = ${declaration.referencePeriodStart},
			reference_period_end = ${declaration.referencePeriodEnd},
			executive_women_percent = ${declaration.executiveWomenPercent},
			executive_men_percent = ${declaration.executiveMenPercent},
			not_computable_reason_executives = ${declaration.notComputableReasonExecutives},
			member_women_percent = ${declaration.memberWomenPercent},
			member_men_percent = ${declaration.memberMenPercent},
			not_computable_reason_members = ${declaration.notComputableReasonMembers},
			publish_date = ${declaration.publishDate},
			publish_url = ${declaration.publishUrl},
			publish_modalities = ${declaration.publishModalities},
			submitted_at = ${declaration.submittedAt},
			updated_at = ${declaration.updatedAt}
		WHERE siren = ${declaration.siren} AND year = ${declaration.year}
	`;
}

async function importRow({ sql, row, dryRun, counters }) {
	const company = mapCompanyFromV1(row.data.entreprise);
	const declaration = mapDeclarationFromV1(row);

	const [existing] = await sql`
		SELECT imported_from_v1_at, updated_at
		FROM app_representation_declaration
		WHERE siren = ${row.siren} AND year = ${row.year}
	`;

	if (existing && existing.imported_from_v1_at === null) {
		counters.skippedNative++;
		return;
	}

	if (existing && !(row.modified_at > existing.updated_at)) {
		counters.skippedUpToDate++;
		return;
	}

	if (dryRun) {
		if (existing) {
			counters.updated++;
		} else {
			counters.imported++;
		}
		return;
	}

	await sql.begin(async (txRaw) => {
		const tx = /** @type {import("postgres").Sql} */ (
			/** @type {unknown} */ (txRaw)
		);
		await ensureCompany(tx, company);
		if (existing) {
			await updateDeclaration(tx, declaration);
		} else {
			await insertDeclaration(tx, declaration);
		}
	});

	if (existing) {
		counters.updated++;
	} else {
		counters.imported++;
	}
}

export async function runImportV1Representation({
	legacySql,
	sql,
	from,
	to,
	dryRun = false,
}) {
	const legacyRows = await legacySql`
		SELECT siren, year, declared_at, modified_at, data
		FROM representation_equilibree
		WHERE declared_at >= ${from} AND declared_at < ${to}
	`;

	const counters = {
		total: legacyRows.length,
		imported: 0,
		updated: 0,
		skippedUpToDate: 0,
		skippedNative: 0,
		errors: [],
	};

	for (const row of legacyRows) {
		try {
			await importRow({ sql, row, dryRun, counters });
		} catch (error) {
			counters.errors.push({
				siren: row.siren,
				year: row.year,
				cause: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return counters;
}

export function formatReport(counters, dryRun) {
	const lines = [
		`${dryRun ? "[dry-run] " : ""}import-v1-representation report`,
		`  total read:            ${counters.total}`,
		`  imported:              ${counters.imported}`,
		`  updated:               ${counters.updated}`,
		`  skipped (up to date):  ${counters.skippedUpToDate}`,
		`  skipped (native V2):   ${counters.skippedNative}`,
		`  errors:                ${counters.errors.length}`,
	];
	for (const error of counters.errors) {
		lines.push(
			`    siren=${error.siren} year=${error.year} cause=${error.cause}`,
		);
	}
	return lines.join("\n");
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
	let sql;
	let legacySql;
	try {
		const { from, to, dryRun } = parseCliArgs(process.argv.slice(2));

		if (!process.env.LEGACY_DATABASE_URL) {
			throw new Error("LEGACY_DATABASE_URL must be set");
		}

		legacySql = postgres(process.env.LEGACY_DATABASE_URL, { max: 1 });
		sql = postgres(getDatabaseUrl(), { max: 1 });

		const counters = await runImportV1Representation({
			legacySql,
			sql,
			from,
			to,
			dryRun,
		});

		console.log(formatReport(counters, dryRun));
		if (counters.errors.length > 0) {
			exitCode = 1;
		}
	} catch (error) {
		console.error(
			"[import-v1-representation] Failed:",
			error instanceof Error ? error.message : error,
		);
		exitCode = 1;
	} finally {
		await sql?.end();
		await legacySql?.end();
	}
	process.exit(exitCode);
}
