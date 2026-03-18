/**
 * Fetch real large French companies (catégorie GE) from the public
 * API Recherche d'Entreprises and write them to data/companies.json.
 *
 * Usage:
 *   npx tsx scripts/fetch-large-companies.ts
 *   npx tsx scripts/fetch-large-companies.ts --min 300
 *
 * The API requires a query string (3+ chars), so we iterate over common
 * French words to collect as many unique "Grande Entreprise" SIRENs as
 * possible, then deduplicate.
 */

const API_BASE = "https://recherche-entreprises.api.gouv.fr/search";
const PER_PAGE = 25; // API max
const MAX_PAGES_PER_QUERY = 12; // 25 × 12 = 300 results per query
const DEFAULT_MIN = 300;

// Common French words/prefixes to maximize coverage of GE companies
const SEARCH_QUERIES = [
	"france",
	"groupe",
	"services",
	"societe",
	"paris",
	"national",
	"transport",
	"banque",
	"assurance",
	"energie",
	"industrie",
	"construction",
	"distribution",
	"conseil",
	"systemes",
	"logistique",
	"technologies",
	"sante",
	"immobilier",
	"automobile",
	"alimentaire",
	"telecom",
	"securite",
	"environnement",
	"international",
	"europeen",
	"gestion",
	"maintenance",
	"production",
	"commerce",
	"communication",
	"recherche",
	"formation",
	"ingenierie",
	"aeronautique",
	"pharmacie",
	"chimie",
	"metallurgie",
	"agence",
	"mutuelle",
	"caisse",
	"credit",
	"poste",
	"hospitalier",
	"centre",
	"office",
	"association",
	"fondation",
	"institut",
	"compagnie",
];

type Company = {
	siren: string;
	name: string;
	workforce: number | null;
};

async function fetchPage(
	query: string,
	page: number,
): Promise<{ results: Company[]; totalPages: number }> {
	const url = `${API_BASE}?q=${encodeURIComponent(query)}&categorie_entreprise=GE&per_page=${PER_PAGE}&page=${page}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`API error: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as {
		results: Array<{
			siren: string;
			nom_complet: string;
			tranche_effectif_salarie: string | null;
			nombre_etablissements_ouverts: number;
		}>;
		total_pages: number;
	};

	const results: Company[] = data.results.map((r) => ({
		siren: r.siren,
		name: r.nom_complet,
		workforce: estimateWorkforce(r.tranche_effectif_salarie),
	}));

	return { results, totalPages: data.total_pages };
}

/** Convert INSEE tranche_effectif_salarie code to an estimated headcount. */
function estimateWorkforce(code: string | null): number | null {
	const map: Record<string, number> = {
		"32": 375, // 250-499
		"41": 750, // 500-999
		"42": 1500, // 1000-1999
		"51": 3500, // 2000-4999
		"52": 7500, // 5000-9999
		"53": 20000, // 10000+
	};
	return code ? (map[code] ?? null) : null;
}

async function fetchAllForQuery(query: string): Promise<Company[]> {
	const all: Company[] = [];
	const { results, totalPages } = await fetchPage(query, 1);
	all.push(...results);

	const pagesToFetch = Math.min(totalPages, MAX_PAGES_PER_QUERY);
	for (let page = 2; page <= pagesToFetch; page++) {
		// Rate limiting: small delay between requests
		await new Promise((r) => setTimeout(r, 100));
		const { results: pageResults } = await fetchPage(query, page);
		all.push(...pageResults);
	}

	return all;
}

// ── Main ───────────────────────────────────────────────────────────

const minArg = process.argv.find((a) => a.startsWith("--min="));
const minCount = minArg
	? Number.parseInt(minArg.split("=")[1] ?? "", 10)
	: DEFAULT_MIN;

console.error(`Fetching large French companies (catégorie GE)...`);
console.error(`Target: ${minCount} unique companies\n`);

const seen = new Map<string, Company>();

for (const query of SEARCH_QUERIES) {
	if (seen.size >= minCount * 1.5) break; // Overshoot to have margin

	process.stderr.write(`  "${query}": `);
	const companies = await fetchAllForQuery(query);
	let added = 0;
	for (const c of companies) {
		if (!seen.has(c.siren)) {
			seen.set(c.siren, c);
			added++;
		}
	}
	console.error(
		`${companies.length} results, ${added} new → ${seen.size} total`,
	);

	// Rate limiting between queries
	await new Promise((r) => setTimeout(r, 200));
}

// Sort by estimated workforce (largest first), then by name
const companies = [...seen.values()]
	.sort(
		(a, b) =>
			(b.workforce ?? 0) - (a.workforce ?? 0) || a.name.localeCompare(b.name),
	)
	.slice(0, minCount);

// Write to data/companies.json
const fs = await import("node:fs");
const path = await import("node:path");

const dataDir = path.join(import.meta.dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const outputPath = path.join(dataDir, "companies.json");
fs.writeFileSync(outputPath, JSON.stringify(companies, null, "\t"), "utf-8");

console.error(`\nWrote ${companies.length} companies → ${outputPath}`);
console.error(
	`Workforce breakdown: ${companies.filter((c) => (c.workforce ?? 0) >= 10000).length} (10k+), ` +
		`${companies.filter((c) => (c.workforce ?? 0) >= 1000 && (c.workforce ?? 0) < 10000).length} (1k-10k), ` +
		`${companies.filter((c) => (c.workforce ?? 0) < 1000 || c.workforce === null).length} (<1k or unknown)`,
);
