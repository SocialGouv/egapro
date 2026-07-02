/**
 * Backfill `region`, `department_code` and `department_label` on existing
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

import { getLocationFromPostalCode } from "../src/modules/domain/index.ts";

const WEEZ_CONCURRENCY = 5;
const DELAY_BETWEEN_BATCHES_MS = 150;

const dryRun = process.argv.includes("--dry-run");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL must be set");
}

const weezApiUrl = process.env.EGAPRO_WEEZ_API_URL?.replace(/\/$/, "");
if (!weezApiUrl) {
	throw new Error("EGAPRO_WEEZ_API_URL must be set");
}

const sql = postgres(databaseUrl, { max: 1 });

async function fetchPostalCode(siren) {
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
	return data.content[0]?.codepostal ?? null;
}

async function main() {
	const rows = await sql`SELECT siren FROM app_company WHERE region IS NULL`;
	console.log(`${rows.length} companies without region to backfill`);

	let updated = 0;
	let skipped = 0;

	for (let i = 0; i < rows.length; i += WEEZ_CONCURRENCY) {
		const batch = rows.slice(i, i + WEEZ_CONCURRENCY);
		const settled = await Promise.allSettled(
			batch.map(async ({ siren }) => {
				const postalCode = await fetchPostalCode(siren);
				const location = getLocationFromPostalCode(postalCode);
				if (!location.departmentCode) return { siren, filled: false };

				if (!dryRun) {
					await sql`
						UPDATE app_company
						SET region = ${location.region},
							department_code = ${location.departmentCode},
							department_label = ${location.departmentLabel},
							updated_at = NOW()
						WHERE siren = ${siren} AND region IS NULL
					`;
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
