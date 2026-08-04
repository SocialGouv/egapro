import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const DATA_DIR = resolve(APP_ROOT, "data");

type Bucket =
	| "medium-50"
	| "medium-100"
	| "medium-150"
	| "large-250"
	| "large-1000"
	| "large-5000";

type Company = {
	siren: string;
	name: string;
	workforce: number | null;
	bucket: Bucket;
};

const BUCKET_WORKFORCE_RANGES: Record<Bucket, [number, number]> = {
	"medium-50": [50, 99],
	"medium-100": [100, 149],
	"medium-150": [150, 249],
	"large-250": [250, 999],
	"large-1000": [1000, 4999],
	"large-5000": [5000, 20000],
};

const BUCKETS: Bucket[] = [
	"medium-50",
	"medium-100",
	"medium-150",
	"large-250",
	"large-1000",
	"large-5000",
];

function loadCompanies(): Company[] {
	const raw = readFileSync(resolve(DATA_DIR, "companies.json"), "utf-8");
	return JSON.parse(raw) as Company[];
}

function parseCsvRows(csvContent: string): string[][] {
	const lines = csvContent.split("\n");
	return lines.slice(3).map((l) => l.split(";"));
}

function parseHeaders(csvContent: string): string[] {
	return (csvContent.split("\n")[2] ?? "").split(";").map((h) => h.trim());
}

function toNum(value: string | undefined): number | null {
	if (value === undefined || value === "") return null;
	const parsed = Number.parseFloat(value.replace(",", "."));
	return Number.isNaN(parsed) ? null : parsed;
}

type QuartileBlock = {
	referenceF: string;
	referenceH: string;
	nbF: [string, string, string, string];
	nbH: [string, string, string, string];
	proportionF: [string, string, string, string];
};

const QUARTILE_BLOCKS: QuartileBlock[] = [
	{
		referenceF: "Effectif_F_rem_annuelle_globale",
		referenceH: "Effectif_H_rem_annuelle_globale",
		nbF: [1, 2, 3, 4].map((q) => `Quartile${q}_Rem_globale_annuelle_nb_F`) as [
			string,
			string,
			string,
			string,
		],
		nbH: [1, 2, 3, 4].map((q) => `Quartile${q}_Rem_globale_annuelle_nb_H`) as [
			string,
			string,
			string,
			string,
		],
		proportionF: [1, 2, 3, 4].map(
			(q) => `Quartile${q}_Rem_globale_annuelle_proportion_F`,
		) as [string, string, string, string],
	},
	{
		referenceF: "Effectif_F_taux_horaire_global",
		referenceH: "Effectif_H_taux_horaire_global",
		nbF: [1, 2, 3, 4].map((q) => `Quartile${q}_Taux_horaire_global_nb_F`) as [
			string,
			string,
			string,
			string,
		],
		nbH: [1, 2, 3, 4].map((q) => `Quartile${q}_Taux_horaire_global_nb_H`) as [
			string,
			string,
			string,
			string,
		],
		proportionF: [1, 2, 3, 4].map(
			(q) => `Quartile${q}_Taux_horaire_global_proportion_F`,
		) as [string, string, string, string],
	},
];

/**
 * Per file and per block, assert nb columns are the source of truth: their
 * sums equal the block reference headcount and the proportions are derived
 * from them. Blocks with a null reference or a null nb cell are skipped
 * (edge-case rows with empty blocks).
 */
function assertNbCoherence(fileName: string) {
	const csv = readFileSync(resolve(DATA_DIR, fileName), "utf-8");
	const headers = parseHeaders(csv);
	const col = (name: string) => headers.indexOf(name);
	const rows = parseCsvRows(csv).filter((r) => r.length > 1);

	for (const row of rows) {
		const siren = row[0];
		for (const block of QUARTILE_BLOCKS) {
			const refF = toNum(row[col(block.referenceF)]);
			const refH = toNum(row[col(block.referenceH)]);
			const nbF = block.nbF.map((h) => toNum(row[col(h)]));
			const nbH = block.nbH.map((h) => toNum(row[col(h)]));
			const propF = block.proportionF.map((h) => toNum(row[col(h)]));

			const blockIsFilled =
				refF !== null &&
				refH !== null &&
				nbF.every((v) => v !== null) &&
				nbH.every((v) => v !== null);
			if (!blockIsFilled) continue;

			const sumF = nbF.reduce<number>((a, v) => a + (v ?? 0), 0);
			const sumH = nbH.reduce<number>((a, v) => a + (v ?? 0), 0);
			expect(
				sumF,
				`${fileName} SIREN ${siren} ${block.referenceF}: Σ nb_F ${sumF} should equal reference ${refF}`,
			).toBe(refF);
			expect(
				sumH,
				`${fileName} SIREN ${siren} ${block.referenceH}: Σ nb_H ${sumH} should equal reference ${refH}`,
			).toBe(refH);

			for (let q = 0; q < 4; q++) {
				const denom = (nbF[q] ?? 0) + (nbH[q] ?? 0);
				if (denom === 0) continue;
				const derived = (nbF[q] ?? 0) / denom;
				expect(
					derived,
					`${fileName} SIREN ${siren} ${block.proportionF[q]}: nb_F/(nb_F+nb_H) should match proportion_F`,
				).toBeCloseTo(propF[q] ?? 0, 4);
			}
		}
	}
}

describe("companies.json", () => {
	it("has a bucket field on every entry", () => {
		const companies = loadCompanies();
		expect(companies.length).toBeGreaterThan(0);
		for (const c of companies) {
			expect(BUCKETS).toContain(c.bucket);
		}
	});

	it("has all 6 buckets represented", () => {
		const companies = loadCompanies();
		for (const bucket of BUCKETS) {
			const count = companies.filter((c) => c.bucket === bucket).length;
			expect(count, `bucket ${bucket} should have entries`).toBeGreaterThan(0);
		}
	});

	it("has workforce values consistent with bucket ranges", () => {
		const companies = loadCompanies();
		for (const c of companies) {
			if (c.workforce === null) continue;
			const [min, max] = BUCKET_WORKFORCE_RANGES[c.bucket];
			expect(
				c.workforce,
				`${c.siren} workforce ${c.workforce} out of range for ${c.bucket} (${min}–${max})`,
			).toBeGreaterThanOrEqual(min);
			expect(
				c.workforce,
				`${c.siren} workforce ${c.workforce} out of range for ${c.bucket} (${min}–${max})`,
			).toBeLessThanOrEqual(max);
		}
	});

	it("has globally unique SIRENs across all buckets", () => {
		const companies = loadCompanies();
		const sirens = companies.map((c) => c.siren);
		expect(new Set(sirens).size).toBe(sirens.length);
	});

	it("contains no companies with fewer than 50 employees", () => {
		const companies = loadCompanies();
		for (const c of companies) {
			if (c.workforce !== null) {
				expect(
					c.workforce,
					`${c.siren} has fewer than 50 employees`,
				).toBeGreaterThanOrEqual(50);
			}
		}
	});
});

describe("mock-gip-mds.csv", () => {
	it("is parseable and has data rows", () => {
		const csv = readFileSync(resolve(DATA_DIR, "mock-gip-mds.csv"), "utf-8");
		const rows = parseCsvRows(csv);
		expect(rows.length).toBeGreaterThan(0);
	});

	it("has the v3 header with 87 columns (71 existing + 16 nb)", () => {
		const csv = readFileSync(resolve(DATA_DIR, "mock-gip-mds.csv"), "utf-8");
		expect(parseHeaders(csv)).toHaveLength(87);
	});

	it("carries the 16 nb quartile headers and the 12 de-accented median headers", () => {
		const csv = readFileSync(resolve(DATA_DIR, "mock-gip-mds.csv"), "utf-8");
		const headers = parseHeaders(csv);
		for (const block of QUARTILE_BLOCKS) {
			for (const h of [...block.nbF, ...block.nbH]) {
				expect(headers, `missing nb header ${h}`).toContain(h);
			}
		}
		for (const h of [
			"Rem_globale_annuelle_mediane_F",
			"Taux_horaire_variable_median_H",
		]) {
			expect(headers, `missing de-accented median header ${h}`).toContain(h);
		}
		expect(headers).not.toContain("Rem_globale_annuelle_médiane_F");
		expect(headers).not.toContain("Taux_horaire_variable_médian_H");
	});

	it("has nb counts as source of truth: Σ nb === reference and proportions derived from nb", () => {
		assertNbCoherence("mock-gip-mds.csv");
	});

	it("has at least 100 data rows (multi-bucket coverage)", () => {
		const csv = readFileSync(resolve(DATA_DIR, "mock-gip-mds.csv"), "utf-8");
		const rows = parseCsvRows(csv).filter((r) => r.length > 1);
		expect(rows.length).toBeGreaterThanOrEqual(100);
	});

	it("has Effectif_RCD values matching companies.json workforce", () => {
		const companies = loadCompanies();
		const csv = readFileSync(resolve(DATA_DIR, "mock-gip-mds.csv"), "utf-8");
		const rows = parseCsvRows(csv).filter((r) => r.length > 1);

		const companiesBySiren = new Map(companies.map((c) => [c.siren, c]));

		for (const row of rows.slice(0, 20)) {
			const siren = row[0];
			const effectifRcd = row[1];
			if (!siren || !effectifRcd) continue;

			const company = companiesBySiren.get(siren);
			if (!company?.workforce) continue;

			const csvWorkforce = Number.parseFloat(effectifRcd.replace(",", "."));
			expect(
				csvWorkforce,
				`SIREN ${siren}: Effectif_RCD ${csvWorkforce} should match workforce ${company.workforce}`,
			).toBeCloseTo(company.workforce, 0);
		}
	});

	it("has no SIREN with workforce below 50", () => {
		const companies = loadCompanies();
		const csv = readFileSync(resolve(DATA_DIR, "mock-gip-mds.csv"), "utf-8");
		const rows = parseCsvRows(csv).filter((r) => r.length > 1);
		const companiesBySiren = new Map(companies.map((c) => [c.siren, c]));

		for (const row of rows) {
			const siren = row[0];
			if (!siren) continue;
			const company = companiesBySiren.get(siren);
			if (company?.workforce !== undefined && company.workforce !== null) {
				expect(
					company.workforce,
					`SIREN ${siren} has workforce < 50`,
				).toBeGreaterThanOrEqual(50);
			}
		}
	});

	it("all 6 buckets are represented in the CSV via companies.json cross-reference", () => {
		const companies = loadCompanies();
		const csv = readFileSync(resolve(DATA_DIR, "mock-gip-mds.csv"), "utf-8");
		const rows = parseCsvRows(csv).filter((r) => r.length > 1);
		const csvSirens = new Set(rows.map((r) => r[0]).filter(Boolean));
		const companiesBySiren = new Map(companies.map((c) => [c.siren, c]));

		const bucketsInCsv = new Set<Bucket>();
		for (const siren of csvSirens) {
			if (siren) {
				const company = companiesBySiren.get(siren);
				if (company?.bucket) {
					bucketsInCsv.add(company.bucket);
				}
			}
		}

		for (const bucket of BUCKETS) {
			expect(
				bucketsInCsv.has(bucket),
				`bucket ${bucket} not represented in CSV`,
			).toBe(true);
		}
	});

	it("medium-100 and medium-150 buckets have Effectif_RCD within their respective ranges", () => {
		const companies = loadCompanies();
		const csv = readFileSync(resolve(DATA_DIR, "mock-gip-mds.csv"), "utf-8");
		const rows = parseCsvRows(csv).filter((r) => r.length > 1);

		const tieredBuckets: Bucket[] = ["medium-100", "medium-150"];
		for (const bucket of tieredBuckets) {
			const [min, max] = BUCKET_WORKFORCE_RANGES[bucket];
			const bucketSirens = new Set(
				companies.filter((c) => c.bucket === bucket).map((c) => c.siren),
			);
			const bucketRows = rows.filter((r) => r[0] && bucketSirens.has(r[0]));

			expect(
				bucketRows.length,
				`bucket ${bucket} should have rows in CSV`,
			).toBeGreaterThan(0);

			for (const row of bucketRows) {
				const siren = row[0];
				const effectifRcd = Number.parseFloat((row[1] ?? "").replace(",", "."));
				expect(
					effectifRcd,
					`SIREN ${siren} in bucket ${bucket}: Effectif_RCD ${effectifRcd} should be >= ${min}`,
				).toBeGreaterThanOrEqual(min);
				expect(
					effectifRcd,
					`SIREN ${siren} in bucket ${bucket}: Effectif_RCD ${effectifRcd} should be <= ${max}`,
				).toBeLessThanOrEqual(max);
			}
		}
	});
});

describe("mock-gip-mds-edge-cases.csv", () => {
	it("has the v3 header with 87 columns", () => {
		const csv = readFileSync(
			resolve(DATA_DIR, "mock-gip-mds-edge-cases.csv"),
			"utf-8",
		);
		expect(parseHeaders(csv)).toHaveLength(87);
	});

	it("keeps nb counts coherent on filled blocks (empty blocks skipped)", () => {
		assertNbCoherence("mock-gip-mds-edge-cases.csv");
	});
});
