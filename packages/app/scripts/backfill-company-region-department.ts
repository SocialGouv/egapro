/**
 * Post-deploy repair of the location columns of `app_company`: commune,
 * region, department and the tri-state country.
 *
 * Selected: every row whose country is unknown, every non-foreign row without
 * a commune, and every row with a region but no region code. The country is
 * resolved exactly as at login, through `legalUnitCountry` then
 * `headOfficeCountry`, ceased legal units included. An unknown country is never
 * written: the row stays selected and is retried at the next deploy.
 *
 * The optimistic lock compares the seven columns read, not `updated_at`: a row
 * stamped by SQL `NOW()` keeps microseconds that a JS `Date` cannot round-trip.
 * A registry failure is reported apart and never fails the run; a database
 * failure does.
 *
 * Run:
 *   EGAPRO_WEEZ_API_URL=... DATABASE_URL=... pnpm backfill:company-location
 *   pnpm backfill:company-location --dry-run
 */
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Sql } from "postgres";
import postgres from "postgres";

import {
	FRANCE_COUNTRY,
	getLocationFromPostalCode,
	headOfficeCountry,
	isUnknownCountry,
	legalUnitCountry,
	type RegistryCountry,
} from "~/modules/domain";

export type CompanyLocationRow = {
	siren: string;
	city: string | null;
	region_code: string | null;
	region: string | null;
	department_code: string | null;
	department_label: string | null;
	country_code: string | null;
	country_label: string | null;
};

type LocationValues = Omit<CompanyLocationRow, "siren">;

type RegistryLegalUnit = {
	postalCode: string | null;
	city: string | null;
	declaredCode: string | null;
	declaredLabel: string | null;
};

type WeezFindBySirenResponse = {
	content?:
		| {
				codepostal?: string | null;
				libellecommune?: string | null;
				codepaysetrangeretablissement?: string | null;
				libellepaysetrangeretablissement?: string | null;
		  }[]
		| null;
};

type Outcome = "updated" | "unchanged" | "unresolved" | "skipped";

type RowOutcome = {
	siren: string;
	outcome: Outcome | "failed";
	cause?: string;
};

export type BackfillCounters = {
	updated: number;
	unchanged: number;
	unresolved: number;
	skipped: number;
	failed: number;
	errors: { siren: string; cause: string }[];
};

const WEEZ_CONCURRENCY = 10;
const DELAY_BETWEEN_BATCHES_MS = 100;
const WEEZ_TIMEOUT_MS = 10_000;

const LOCATION_COLUMNS = [
	"city",
	"region_code",
	"region",
	"department_code",
	"department_label",
	"country_code",
	"country_label",
] as const satisfies readonly (keyof LocationValues)[];

export function getDatabaseUrl(): string {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
	const host = process.env.POSTGRES_HOST ?? process.env.PGHOST;
	const database = process.env.POSTGRES_DB ?? process.env.PGDATABASE;
	const user = process.env.POSTGRES_USER ?? process.env.PGUSER ?? "postgres";
	const password = process.env.POSTGRES_PASSWORD ?? process.env.PGPASSWORD;
	const port = process.env.POSTGRES_PORT ?? process.env.PGPORT ?? "5432";
	const sslmode = process.env.POSTGRES_SSLMODE ?? process.env.PGSSLMODE;
	if (!host || !database) {
		throw new Error(
			"DATABASE_URL or PostgreSQL connection variables must be set",
		);
	}
	return `postgresql://${encodeURIComponent(user)}${password ? `:${encodeURIComponent(password)}` : ""}@${host}:${port}/${database}${sslmode ? `?sslmode=${sslmode}` : ""}`;
}

async function fetchRegistryJson(url: URL, siren: string): Promise<unknown> {
	const response = await fetch(url, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(WEEZ_TIMEOUT_MS),
	});
	if (!response.ok) {
		throw new Error(`Weez API error: ${response.status} ${siren}`);
	}
	return response.json();
}

export async function fetchLegalUnit(
	weezApiUrl: string,
	siren: string,
): Promise<RegistryLegalUnit | null> {
	const url = new URL(`${weezApiUrl}/public/v3/unitelegale/findbysiren`);
	url.searchParams.set("siren", siren);
	url.searchParams.set("page", "0");
	url.searchParams.set("inclure_non_diffusibles", "true");
	url.searchParams.set("inclure_cesse", "true");

	const data = (await fetchRegistryJson(url, siren)) as WeezFindBySirenResponse;
	const entity = data.content?.[0];
	if (!entity) return null;
	return {
		postalCode: entity.codepostal ?? null,
		city: entity.libellecommune ?? null,
		declaredCode: entity.codepaysetrangeretablissement ?? null,
		declaredLabel: entity.libellepaysetrangeretablissement ?? null,
	};
}

export async function fetchHeadOffice(
	weezApiUrl: string,
	siren: string,
): Promise<unknown> {
	const url = new URL(`${weezApiUrl}/public/v3/unitelegale/etablissementsiege`);
	url.searchParams.set("siren", siren);
	return fetchRegistryJson(url, siren);
}

export function toTargetLocation(
	row: CompanyLocationRow,
	unit: RegistryLegalUnit,
	country: RegistryCountry,
): LocationValues | null {
	if (isUnknownCountry(country)) return null;

	const city = unit.city ?? row.city;
	if (country.countryCode !== null) {
		return {
			city,
			region_code: null,
			region: null,
			department_code: null,
			department_label: null,
			country_code: country.countryCode,
			country_label: country.countryLabel,
		};
	}

	const location = getLocationFromPostalCode(unit.postalCode);
	const geography = location.departmentCode
		? {
				region_code: location.regionCode,
				region: location.region,
				department_code: location.departmentCode,
				department_label: location.departmentLabel,
			}
		: {
				region_code: row.region_code,
				region: row.region,
				department_code: row.department_code,
				department_label: row.department_label,
			};
	return {
		city,
		...geography,
		country_code: FRANCE_COUNTRY.countryCode,
		country_label: FRANCE_COUNTRY.countryLabel,
	};
}

function isAligned(row: CompanyLocationRow, target: LocationValues): boolean {
	return LOCATION_COLUMNS.every((column) => row[column] === target[column]);
}

export async function applyLocation({
	sql,
	row,
	target,
	dryRun,
}: {
	sql: Sql;
	row: CompanyLocationRow;
	target: LocationValues;
	dryRun: boolean;
}): Promise<Outcome> {
	if (isAligned(row, target)) return "unchanged";
	if (dryRun) return "updated";

	const changed = await sql`
		UPDATE app_company
		SET city = ${target.city},
			region_code = ${target.region_code},
			region = ${target.region},
			department_code = ${target.department_code},
			department_label = ${target.department_label},
			country_code = ${target.country_code},
			country_label = ${target.country_label},
			updated_at = NOW()
		WHERE siren = ${row.siren}
			AND city IS NOT DISTINCT FROM ${row.city}
			AND region_code IS NOT DISTINCT FROM ${row.region_code}
			AND region IS NOT DISTINCT FROM ${row.region}
			AND department_code IS NOT DISTINCT FROM ${row.department_code}
			AND department_label IS NOT DISTINCT FROM ${row.department_label}
			AND country_code IS NOT DISTINCT FROM ${row.country_code}
			AND country_label IS NOT DISTINCT FROM ${row.country_label}
		RETURNING siren
	`;
	return changed.length === 0 ? "skipped" : "updated";
}

async function resolveFromRegistry(
	weezApiUrl: string,
	siren: string,
): Promise<{ unit: RegistryLegalUnit; country: RegistryCountry } | null> {
	const unit = await fetchLegalUnit(weezApiUrl, siren);
	if (!unit) return null;
	const country =
		legalUnitCountry(unit) ??
		headOfficeCountry(await fetchHeadOffice(weezApiUrl, siren));
	return { unit, country };
}

export async function processRow({
	sql,
	weezApiUrl,
	row,
	dryRun,
}: {
	sql: Sql;
	weezApiUrl: string;
	row: CompanyLocationRow;
	dryRun: boolean;
}): Promise<RowOutcome> {
	let resolved: Awaited<ReturnType<typeof resolveFromRegistry>>;
	try {
		resolved = await resolveFromRegistry(weezApiUrl, row.siren);
	} catch (error) {
		return {
			siren: row.siren,
			outcome: "failed",
			cause: error instanceof Error ? error.message : String(error),
		};
	}
	const target = resolved
		? toTargetLocation(row, resolved.unit, resolved.country)
		: null;
	if (!target) return { siren: row.siren, outcome: "unresolved" };
	const outcome = await applyLocation({ sql, row, target, dryRun });
	return { siren: row.siren, outcome };
}

export async function assertSchema(sql: Sql): Promise<void> {
	const rows = await sql`
		SELECT column_name
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'app_company'
			AND column_name IN ('city', 'region_code', 'country_code', 'country_label')
	`;
	if (rows.length !== 4) {
		throw new Error(
			"Location columns are missing. Run `pnpm db:migrate` first.",
		);
	}
}

export async function waitForSchema(
	sql: Sql,
	waitSeconds: number,
): Promise<void> {
	const deadline = Date.now() + waitSeconds * 1000;
	for (;;) {
		try {
			await assertSchema(sql);
			return;
		} catch (error) {
			if (Date.now() >= deadline) throw error;
			console.log("[backfill-company-location] waiting for the database...");
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}
}

export async function runBackfillCompanyLocation({
	sql,
	weezApiUrl,
	dryRun = false,
}: {
	sql: Sql;
	weezApiUrl: string;
	dryRun?: boolean;
}): Promise<BackfillCounters> {
	const rows = await sql<CompanyLocationRow[]>`
		SELECT siren, city, region_code, region, department_code, department_label,
			country_code, country_label
		FROM app_company
		WHERE country_label IS NULL
			OR (country_code IS NULL AND city IS NULL)
			OR (region IS NOT NULL AND region_code IS NULL)
	`;
	console.log(`${rows.length} companies with location fields to backfill`);

	const counters: BackfillCounters = {
		updated: 0,
		unchanged: 0,
		unresolved: 0,
		skipped: 0,
		failed: 0,
		errors: [],
	};

	for (let i = 0; i < rows.length; i += WEEZ_CONCURRENCY) {
		const batch = rows.slice(i, i + WEEZ_CONCURRENCY);
		const results = await Promise.all(
			batch.map((row) => processRow({ sql, weezApiUrl, row, dryRun })),
		);

		for (const result of results) {
			counters[result.outcome]++;
			if (result.outcome === "failed") {
				counters.errors.push({
					siren: result.siren,
					cause: result.cause ?? "",
				});
			}
		}

		await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
	}

	return counters;
}

export function formatReport(
	counters: BackfillCounters,
	dryRun: boolean,
): string {
	const lines = [
		`${dryRun ? "[dry-run] " : ""}Backfill done: ${counters.updated} updated, ${counters.unchanged} already aligned, ${counters.unresolved} unresolved, ${counters.skipped} skipped, ${counters.failed} failed`,
	];
	for (const error of counters.errors) {
		lines.push(`siren=${error.siren} cause=${error.cause}`);
	}
	return lines.join("\n");
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
	let sql: Sql | undefined;
	try {
		const schemaWaitSeconds = Number(
			process.env.COMPANY_BACKFILL_WAIT_FOR_SCHEMA_SECONDS ?? "0",
		);
		if (!Number.isFinite(schemaWaitSeconds) || schemaWaitSeconds < 0) {
			throw new Error(
				"COMPANY_BACKFILL_WAIT_FOR_SCHEMA_SECONDS must be a positive number",
			);
		}

		const weezApiUrl = process.env.EGAPRO_WEEZ_API_URL?.replace(/\/$/, "");
		if (!weezApiUrl) {
			throw new Error("EGAPRO_WEEZ_API_URL must be set");
		}

		const dryRun = process.argv.includes("--dry-run");

		sql = postgres(getDatabaseUrl(), { max: 1 });
		await waitForSchema(sql, schemaWaitSeconds);

		const counters = await runBackfillCompanyLocation({
			sql,
			weezApiUrl,
			dryRun,
		});
		console.log(formatReport(counters, dryRun));
	} catch (error) {
		console.error(
			"[backfill-company-location] Failed:",
			error instanceof Error ? error.message : error,
		);
		exitCode = 1;
	} finally {
		await sql?.end();
	}
	process.exit(exitCode);
}
