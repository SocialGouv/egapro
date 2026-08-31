/**
 * Backfill city, region, department and foreign-country fields on existing
 * `app_company` rows (issue #3710).
 *
 * Source of truth: the establishment postal code returned by the Weez public
 * registry — INSEE exposes it even for non-diffusible legal units, so this
 * works whether or not `address` is masked. The code → label mapping reuses
 * `getLocationFromPostalCode` from the domain layer (single source of truth).
 *
 * Idempotent: only rows where `region IS NULL` are processed, so re-running
 * skips already-filled companies. Rows whose postal code Weez cannot provide
 * are left untouched (they get filled at next login/refresh by weez.ts).
 *
 * Run with tsx (resolves the TS domain import):
 *   EGAPRO_WEEZ_API_URL=... DATABASE_URL=... pnpm tsx scripts/backfill-company-region-department.mjs
 *   pnpm tsx scripts/backfill-company-region-department.mjs --dry-run
 */
import postgres from "postgres";

import { getLocationFromPostalCode } from "../src/modules/domain/shared/regions.ts";

const WEEZ_CONCURRENCY = 5;
const DELAY_BETWEEN_BATCHES_MS = 150;

const dryRun = process.argv.includes("--dry-run");

const SCHEMA_WAIT_SECONDS = Number(
	process.env.COMPANY_BACKFILL_WAIT_FOR_SCHEMA_SECONDS ?? "0",
);
if (!Number.isFinite(SCHEMA_WAIT_SECONDS) || SCHEMA_WAIT_SECONDS < 0) {
	throw new Error(
		"COMPANY_BACKFILL_WAIT_FOR_SCHEMA_SECONDS must be a positive number",
	);
}

function getDatabaseUrl() {
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

const databaseUrl = getDatabaseUrl();

const weezApiUrl = process.env.EGAPRO_WEEZ_API_URL?.replace(/\/$/, "");
if (!weezApiUrl) {
	throw new Error("EGAPRO_WEEZ_API_URL must be set");
}

const sql = postgres(databaseUrl, { max: 1 });

async function fetchLocation(siren) {
	const url = new URL(`${weezApiUrl}/public/v3/unitelegale/findbysiren`);
	url.searchParams.set("siren", siren);
	url.searchParams.set("page", "0");
	url.searchParams.set("inclure_non_diffusibles", "true");

	const response = await fetch(url, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(10_000),
	});
	if (!response.ok) {
		throw new Error(`Weez API error: ${response.status} ${siren}`);
	}
	const data = await response.json();
	const entity = data.content[0];
	return entity
		? {
				postalCode: entity.codepostal ?? null,
				city: entity.libellecommune ?? null,
				countryCode: entity.codepaysetrangeretablissement ?? null,
				countryLabel: entity.libellepaysetrangeretablissement ?? null,
			}
		: null;
}

async function assertSchema() {
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

async function waitForSchema() {
	const deadline = Date.now() + SCHEMA_WAIT_SECONDS * 1000;
	for (;;) {
		try {
			await assertSchema();
			return;
		} catch (error) {
			if (Date.now() >= deadline) throw error;
			console.log("[backfill-company-location] waiting for the database...");
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}
}

async function main() {
	await waitForSchema();

	const rows = await sql`
		SELECT siren, updated_at
		FROM app_company
		WHERE city IS NULL
			OR (region IS NOT NULL AND region_code IS NULL)
			OR (region IS NULL AND department_code IS NULL AND country_label IS NULL)
	`;
	console.log(`${rows.length} companies with location fields to backfill`);

	let updated = 0;
	let skipped = 0;

	for (let i = 0; i < rows.length; i += WEEZ_CONCURRENCY) {
		const batch = rows.slice(i, i + WEEZ_CONCURRENCY);
		const settled = await Promise.allSettled(
			batch.map(async ({ siren, updated_at: selectedUpdatedAt }) => {
				const registryLocation = await fetchLocation(siren);
				if (!registryLocation) return { siren, filled: false };
				const isForeign = Boolean(
					registryLocation.countryCode || registryLocation.countryLabel,
				);
				const location = isForeign
					? {
							regionCode: null,
							region: null,
							departmentCode: null,
							departmentLabel: null,
						}
					: getLocationFromPostalCode(registryLocation.postalCode);
				if (!location.departmentCode && !registryLocation.countryLabel) {
					return { siren, filled: false };
				}

				if (!dryRun) {
					const changed = await sql`
						UPDATE app_company
						SET city = COALESCE(${registryLocation.city}, city),
							region_code = ${location.regionCode},
							region = ${location.region},
							department_code = ${location.departmentCode},
							department_label = ${location.departmentLabel},
							country_code = COALESCE(${registryLocation.countryCode}, country_code),
							country_label = COALESCE(${registryLocation.countryLabel}, country_label),
							updated_at = NOW()
						WHERE siren = ${siren}
							AND updated_at IS NOT DISTINCT FROM ${selectedUpdatedAt}
						RETURNING siren
					`;
					if (changed.length === 0) return { siren, filled: false };
				}
				return { siren, filled: true };
			}),
		);

		for (const result of settled) {
			if (result.status === "fulfilled" && result.value.filled) {
				updated++;
			} else {
				skipped++;
			}
		}

		await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
	}

	console.log(
		`${dryRun ? "[dry-run] " : ""}Backfill done: ${updated} updated, ${skipped} skipped`,
	);
}

try {
	await main();
} finally {
	await sql.end();
}
