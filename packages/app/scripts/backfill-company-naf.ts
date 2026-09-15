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
 * The optimistic lock compares `naf_code`/`naf_label` themselves rather than
 * `updated_at`: `timestamp with time zone` keeps microsecond precision, but
 * postgres.js round-trips it through a JS `Date` (millisecond precision), so a
 * row stamped by raw SQL `NOW()` — as `backfill-company-region-department.mjs`
 * does on every deploy — could never satisfy an `updated_at` compare-and-swap.
 * Comparing the two columns actually being rewritten keeps the same anti-clobber
 * semantics (a row a login refreshed mid-run no longer matches its selected
 * pair, so the write is dropped) without that precision trap.
 *
 * A registry read that fails (non-2xx, timeout, DB error) is counted and logged
 * separately from a legitimate skip — a Weez outage must not look like a clean
 * "0 skipped" pass. It fails the run's exit code only when failures are
 * SYSTEMIC, see FAILURE_RATIO_EXIT_THRESHOLD.
 *
 * Run:
 *   EGAPRO_WEEZ_API_URL=... DATABASE_URL=... pnpm backfill:company-naf
 *   pnpm backfill:company-naf -- --dry-run
 */
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Sql } from "postgres";
import postgres from "postgres";

type CompanyNafRow = {
	siren: string;
	naf_code: string | null;
	naf_label: string | null;
};

type RegistryNafPair = {
	nafCode: string;
	nafLabel: string | null;
};

type WeezLegalUnit = {
	statutdiffusionunitelegale?: string | null;
	activiteprincipaleunitelegale?: string | null;
	nomenclatureactiviteprincipalelibelleunitelegale?: string | null;
};

type WeezFindBySirenResponse = {
	content?: WeezLegalUnit[] | null;
};

const WEEZ_CONCURRENCY = 10;
const DELAY_BETWEEN_BATCHES_MS = 100;

// Column width of `companies.naf_label`; the registry is not bound by it.
const NAF_LABEL_MAX_LENGTH = 255;

// Share of attempted rows that must fail before the run is called broken.
//
// The threshold exists because of where this script runs: a Helm
// `post-install,post-upgrade` hook with `backoffLimit: 3` and `restartPolicy:
// OnFailure`, over the WHOLE table, on EVERY deploy. Exiting non-zero on a
// single failed row would restart the entire sweep — up to four full passes
// over the registry precisely when the registry is the thing misbehaving — and
// a hook that exhausts its backoff fails the release. That would couple the
// availability of a deploy to the availability of a third-party API, for a
// data-repair task nothing functionally depends on.
//
// A registry outage does not fail one row in a thousand, it fails nearly all of
// them; one transient timeout is noise. Every failure is logged either way, so
// nothing is hidden by tolerating a few.
const FAILURE_RATIO_EXIT_THRESHOLD = 0.1;

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

/**
 * Reads the rév. 2 activity pair. Returns null when the registry has nothing to
 * say about the SIREN, and null for a non-diffusible unit too: the app masks
 * that company's activity, and the backfill must not put it back in the clear.
 *
 * Ceased legal units are requested explicitly (`inclure_cesse`), as weez.ts does:
 * the registry omits them by default, nobody logs in for them any more, and their
 * published declarations still expose the NAF pair through the public API.
 *
 * The `"N"` test below restates `isCompanyDiffusible`
 * (src/modules/public-api/projection.ts) rather than importing it: that module
 * reaches the Drizzle schema through the `~/` alias, which this plain-node
 * script cannot resolve. **If the diffusibility rule ever gains a status, change
 * it here too** — the two must not drift, or this job re-exposes the activity of
 * companies the app deliberately masks.
 */
export async function fetchNaf(
	weezApiUrl: string,
	siren: string,
): Promise<RegistryNafPair | null> {
	const url = new URL(`${weezApiUrl}/public/v3/unitelegale/findbysiren`);
	url.searchParams.set("siren", siren);
	url.searchParams.set("page", "0");
	url.searchParams.set("inclure_non_diffusibles", "true");
	url.searchParams.set("inclure_cesse", "true");

	const response = await fetch(url, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(10_000),
	});
	if (!response.ok) {
		throw new Error(`Weez API error: ${response.status} ${siren}`);
	}
	const data: WeezFindBySirenResponse = await response.json();
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

export async function assertSchema(sql: Sql): Promise<void> {
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
			console.log("[backfill-company-naf] waiting for the database...");
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}
}

type Outcome = "updated" | "unchanged" | "skipped";

export async function applyRegistryPair({
	sql,
	row,
	registry,
	dryRun,
}: {
	sql: Sql;
	row: CompanyNafRow;
	registry: RegistryNafPair;
	dryRun: boolean;
}): Promise<Outcome> {
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
		WHERE siren = ${row.siren}
			AND naf_code IS NOT DISTINCT FROM ${row.naf_code}
			AND naf_label IS NOT DISTINCT FROM ${row.naf_label}
		RETURNING siren
	`;
	return changed.length === 0 ? "skipped" : "updated";
}

async function processRow({
	sql,
	weezApiUrl,
	row,
	dryRun,
}: {
	sql: Sql;
	weezApiUrl: string;
	row: CompanyNafRow;
	dryRun: boolean;
}): Promise<Outcome> {
	const registry = await fetchNaf(weezApiUrl, row.siren);
	if (!registry) return "skipped";
	return applyRegistryPair({ sql, row, registry, dryRun });
}

type RowOutcome = {
	siren: string;
	outcome: Outcome | "failed";
	cause?: string;
};

/**
 * Runs `processRow` and never rejects: a registry or DB failure is captured
 * as a `"failed"` outcome carrying its cause, so the caller can tally it
 * without indexing back into the batch to recover the siren.
 */
async function processRowSafely({
	sql,
	weezApiUrl,
	row,
	dryRun,
}: {
	sql: Sql;
	weezApiUrl: string;
	row: CompanyNafRow;
	dryRun: boolean;
}): Promise<RowOutcome> {
	try {
		const outcome = await processRow({ sql, weezApiUrl, row, dryRun });
		return { siren: row.siren, outcome };
	} catch (error) {
		return {
			siren: row.siren,
			outcome: "failed",
			cause: error instanceof Error ? error.message : String(error),
		};
	}
}

type BackfillCounters = {
	updated: number;
	unchanged: number;
	skipped: number;
	failed: number;
	errors: { siren: string; cause: string }[];
};

export async function runBackfillCompanyNaf({
	sql,
	weezApiUrl,
	dryRun = false,
}: {
	sql: Sql;
	weezApiUrl: string;
	dryRun?: boolean;
}): Promise<BackfillCounters> {
	const rows = await sql<CompanyNafRow[]>`
		SELECT siren, naf_code, naf_label
		FROM app_company
		WHERE naf_code IS NOT NULL
	`;
	console.log(`${rows.length} companies with a NAF code to re-read`);

	const counters: BackfillCounters = {
		updated: 0,
		unchanged: 0,
		skipped: 0,
		failed: 0,
		errors: [],
	};

	for (let i = 0; i < rows.length; i += WEEZ_CONCURRENCY) {
		const batch = rows.slice(i, i + WEEZ_CONCURRENCY);
		const results = await Promise.all(
			batch.map((row) => processRowSafely({ sql, weezApiUrl, row, dryRun })),
		);

		for (const result of results) {
			if (result.outcome === "failed") {
				counters.failed++;
				counters.errors.push({
					siren: result.siren,
					cause: result.cause ?? "",
				});
			} else if (result.outcome === "updated") {
				counters.updated++;
			} else if (result.outcome === "unchanged") {
				counters.unchanged++;
			} else {
				counters.skipped++;
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
		`${dryRun ? "[dry-run] " : ""}Backfill done: ${counters.updated} updated, ${counters.unchanged} already aligned, ${counters.skipped} skipped, ${counters.failed} failed`,
	];
	for (const error of counters.errors) {
		lines.push(`  siren=${error.siren} cause=${error.cause}`);
	}
	return lines.join("\n");
}

/**
 * True when failures look systemic rather than incidental — the registry being
 * down, misconfigured or rejecting us, as opposed to a handful of timeouts.
 */
export function hasSystemicFailure(counters: BackfillCounters): boolean {
	const attempted =
		counters.updated + counters.unchanged + counters.skipped + counters.failed;
	if (attempted === 0 || counters.failed === 0) return false;
	return counters.failed / attempted >= FAILURE_RATIO_EXIT_THRESHOLD;
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

		const counters = await runBackfillCompanyNaf({ sql, weezApiUrl, dryRun });
		console.log(formatReport(counters, dryRun));
		if (hasSystemicFailure(counters)) {
			console.error(
				`[backfill-company-naf] ${counters.failed} registry failures — treating the run as broken.`,
			);
			exitCode = 1;
		}
	} catch (error) {
		console.error(
			"[backfill-company-naf] Failed:",
			error instanceof Error ? error.message : error,
		);
		exitCode = 1;
	} finally {
		await sql?.end();
	}
	process.exit(exitCode);
}
