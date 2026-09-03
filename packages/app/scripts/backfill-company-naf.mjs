/**
 * Rewrite `app_company.naf_code` / `naf_label` from the Weez registry so both
 * sides of the pair speak NAF rév. 2 (issue #4087).
 *
 * Between #3077 and #4087 the mapping read the NAF 2025 code
 * (`activiteprincipalenaf25unitelegale`) while the label stayed on the rév. 2
 * wording. No column records which nomenclature wrote a row, and the code shape
 * does not tell either — NAF 2025 keeps the original letter for every unchanged
 * code and only remapped ones take a new one. Sorting by suffix would repair
 * part of the stock without ever proving it repaired all of it, so every row is
 * re-read from the registry, the one source that can answer.
 *
 * Idempotent: a row whose stored pair already equals the registry pair is left
 * untouched (no write, no `updated_at` bump), so a second run reports 0 updated.
 * The optimistic lock on `updated_at` drops any row a login refreshed while the
 * job was running — that write already carries the corrected pair.
 *
 * Run:
 *   EGAPRO_WEEZ_API_URL=... DATABASE_URL=... pnpm backfill:company-naf
 *   pnpm backfill:company-naf -- --dry-run
 */
import postgres from "postgres";

const WEEZ_CONCURRENCY = 10;
const DELAY_BETWEEN_BATCHES_MS = 100;

// Column width of `companies.naf_label`; the registry is not bound by it.
const NAF_LABEL_MAX_LENGTH = 255;

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

/**
 * Reads the rév. 2 activity pair. Returns null when the registry has nothing to
 * say about the SIREN, and null for a non-diffusible unit too: the app masks
 * that company's activity, and the backfill must not put it back in the clear.
 */
async function fetchNaf(siren) {
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
	const entity = data.content?.[0];
	if (!entity) return null;
	if (entity.statutdiffusionunitelegale === "N") return null;

	const nafCode = entity.activiteprincipaleunitelegale ?? null;
	if (!nafCode) return null;

	return {
		nafCode,
		nafLabel:
			entity.nomenclatureactiviteprincipalelibelleunitelegale?.slice(
				0,
				NAF_LABEL_MAX_LENGTH,
			) ?? null,
	};
}

async function assertSchema() {
	const rows = await sql`
		SELECT column_name
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'app_company'
			AND column_name IN ('naf_code', 'naf_label')
	`;
	if (rows.length !== 2) {
		throw new Error("NAF columns are missing. Run `pnpm db:migrate` first.");
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
			console.log("[backfill-company-naf] waiting for the database...");
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}
}

async function main() {
	await waitForSchema();

	const rows = await sql`
		SELECT siren, naf_code, naf_label, updated_at
		FROM app_company
		WHERE naf_code IS NOT NULL
	`;
	console.log(`${rows.length} companies with a NAF code to re-read`);

	let updated = 0;
	let unchanged = 0;
	let skipped = 0;

	for (let i = 0; i < rows.length; i += WEEZ_CONCURRENCY) {
		const batch = rows.slice(i, i + WEEZ_CONCURRENCY);
		const settled = await Promise.allSettled(
			batch.map(async (row) => {
				const { siren, updated_at: selectedUpdatedAt } = row;
				const registry = await fetchNaf(siren);
				if (!registry) return "skipped";

				if (
					registry.nafCode === row.naf_code &&
					registry.nafLabel === row.naf_label
				) {
					return "unchanged";
				}

				if (dryRun) return "updated";

				const changed = await sql`
					UPDATE app_company
					SET naf_code = ${registry.nafCode},
						naf_label = ${registry.nafLabel},
						updated_at = NOW()
					WHERE siren = ${siren}
						AND updated_at IS NOT DISTINCT FROM ${selectedUpdatedAt}
					RETURNING siren
				`;
				return changed.length === 0 ? "skipped" : "updated";
			}),
		);

		for (const result of settled) {
			if (result.status !== "fulfilled") {
				skipped++;
			} else if (result.value === "updated") {
				updated++;
			} else if (result.value === "unchanged") {
				unchanged++;
			} else {
				skipped++;
			}
		}

		await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
	}

	console.log(
		`${dryRun ? "[dry-run] " : ""}Backfill done: ${updated} updated, ${unchanged} already aligned, ${skipped} skipped`,
	);
}

try {
	await main();
} finally {
	await sql.end();
}
