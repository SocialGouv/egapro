/**
 * Fetch real French companies from the public API Recherche d'Entreprises,
 * targeting 5 workforce buckets, and write them to data/companies.json.
 *
 * Usage:
 *   npx tsx scripts/fetch-companies.ts
 *   npx tsx scripts/fetch-companies.ts --per-bucket=10
 *
 * Each bucket targets companies in a specific INSEE tranche_effectif_salarie
 * range, ensuring coverage of all 5 EMA workforce tiers used by the app.
 * Companies with fewer than 50 employees are excluded (not in GIP-MDS scope).
 */

const API_BASE = "https://recherche-entreprises.api.gouv.fr/search";
const PER_PAGE = 25;
const MAX_PAGES_PER_QUERY = 8;
const DEFAULT_PER_BUCKET = 40;

type Bucket =
	| "medium-50"
	| "medium-100"
	| "large-250"
	| "large-1000"
	| "large-5000";

type Company = {
	siren: string;
	name: string;
	workforce: number | null;
	bucket: Bucket;
};

const BUCKET_CONFIGS: Array<{
	bucket: Bucket;
	tranchesCodes: string[];
	workforceRange: [number, number];
}> = [
	{ bucket: "medium-50", tranchesCodes: ["21"], workforceRange: [50, 99] },
	{
		bucket: "medium-100",
		tranchesCodes: ["22", "31"],
		workforceRange: [100, 249],
	},
	{
		bucket: "large-250",
		tranchesCodes: ["32", "41"],
		workforceRange: [250, 999],
	},
	{
		bucket: "large-1000",
		tranchesCodes: ["42", "51"],
		workforceRange: [1000, 4999],
	},
	{
		bucket: "large-5000",
		tranchesCodes: ["52", "53"],
		workforceRange: [5000, 20000],
	},
];

const SEARCH_QUERIES = [
	"france",
	"groupe",
	"services",
	"societe",
	"paris",
	"national",
	"transport",
	"conseil",
	"gestion",
	"industrie",
	"sante",
	"commerce",
	"construction",
	"formation",
	"centre",
];

/** Convert INSEE tranche_effectif_salarie code to a midpoint headcount estimate. */
function estimateWorkforce(
	code: string | null,
	range: [number, number],
): number {
	const map: Record<string, number> = {
		"21": 70,
		"22": 150,
		"31": 200,
		"32": 375,
		"41": 750,
		"42": 1500,
		"51": 3500,
		"52": 7500,
		"53": 20000,
	};
	if (code && code in map) return map[code] ?? range[0];
	return Math.round((range[0] + range[1]) / 2);
}

async function fetchPage(
	query: string,
	trancheCode: string,
	page: number,
): Promise<{
	results: Array<{ siren: string; nom_complet: string; tranche: string }>;
	totalPages: number;
}> {
	const url =
		`${API_BASE}?q=${encodeURIComponent(query)}` +
		`&tranche_effectif_salarie=${trancheCode}` +
		`&per_page=${PER_PAGE}&page=${page}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as {
		results: Array<{
			siren: string;
			nom_complet: string;
			tranche_effectif_salarie: string | null;
		}>;
		total_pages: number;
	};

	const results = data.results.map((r) => ({
		siren: r.siren,
		nom_complet: r.nom_complet,
		tranche: r.tranche_effectif_salarie ?? trancheCode,
	}));

	return { results, totalPages: data.total_pages };
}

async function fetchForBucket(
	bucket: Bucket,
	tranchesCodes: string[],
	workforceRange: [number, number],
	targetCount: number,
): Promise<Map<string, Company>> {
	const seen = new Map<string, Company>();

	for (const trancheCode of tranchesCodes) {
		for (const query of SEARCH_QUERIES) {
			if (seen.size >= targetCount * 2) break;

			process.stderr.write(`  [${bucket}/${trancheCode}] "${query}": `);
			try {
				const { results, totalPages } = await fetchPage(query, trancheCode, 1);
				const pagesToFetch = Math.min(totalPages, MAX_PAGES_PER_QUERY);
				const allResults = [...results];

				for (let page = 2; page <= pagesToFetch; page++) {
					await new Promise((r) => setTimeout(r, 80));
					const { results: pageResults } = await fetchPage(
						query,
						trancheCode,
						page,
					);
					allResults.push(...pageResults);
				}

				let added = 0;
				for (const r of allResults) {
					if (!seen.has(r.siren)) {
						seen.set(r.siren, {
							siren: r.siren,
							name: r.nom_complet,
							workforce: estimateWorkforce(r.tranche, workforceRange),
							bucket,
						});
						added++;
					}
				}
				console.error(
					`${allResults.length} results, ${added} new → ${seen.size} total`,
				);
			} catch (err) {
				console.error(`ERROR: ${String(err)}`);
			}

			await new Promise((r) => setTimeout(r, 150));
		}
		if (seen.size >= targetCount * 2) break;
	}

	return seen;
}

// ── Main ───────────────────────────────────────────────────────────

const perBucketArg = process.argv.find((a) => a.startsWith("--per-bucket="));
const perBucket = perBucketArg
	? Number.parseInt(perBucketArg.split("=")[1] ?? "", 10)
	: DEFAULT_PER_BUCKET;

console.error(`Fetching companies for 5 workforce buckets...`);
console.error(`Target: ${perBucket} unique companies per bucket\n`);

const allCompanies: Company[] = [];

for (const config of BUCKET_CONFIGS) {
	console.error(
		`\n── Bucket: ${config.bucket} (${config.workforceRange[0]}–${config.workforceRange[1]} employees) ──`,
	);
	const bucketMap = await fetchForBucket(
		config.bucket,
		config.tranchesCodes,
		config.workforceRange,
		perBucket,
	);

	const bucketCompanies = [...bucketMap.values()].slice(0, perBucket);
	allCompanies.push(...bucketCompanies);
	console.error(
		`→ ${bucketCompanies.length} companies kept for ${config.bucket}`,
	);
}

const fs = await import("node:fs");
const path = await import("node:path");

const dataDir = path.join(import.meta.dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const outputPath = path.join(dataDir, "companies.json");
fs.writeFileSync(outputPath, JSON.stringify(allCompanies, null, "\t"), "utf-8");

console.error(`\nWrote ${allCompanies.length} companies → ${outputPath}`);
console.error("\nBucket breakdown:");
for (const config of BUCKET_CONFIGS) {
	const count = allCompanies.filter((c) => c.bucket === config.bucket).length;
	console.error(`  ${config.bucket}: ${count}`);
}
