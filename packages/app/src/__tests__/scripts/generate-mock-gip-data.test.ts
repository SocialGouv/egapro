import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const DATA_DIR = resolve(APP_ROOT, "data");

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

const BUCKET_WORKFORCE_RANGES: Record<Bucket, [number, number]> = {
	"medium-50": [50, 99],
	"medium-100": [100, 249],
	"large-250": [250, 999],
	"large-1000": [1000, 4999],
	"large-5000": [5000, 20000],
};

const BUCKETS: Bucket[] = [
	"medium-50",
	"medium-100",
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

describe("companies.json", () => {
	it("has a bucket field on every entry", () => {
		const companies = loadCompanies();
		expect(companies.length).toBeGreaterThan(0);
		for (const c of companies) {
			expect(BUCKETS).toContain(c.bucket);
		}
	});

	it("has all 5 buckets represented", () => {
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

	it("all 5 buckets are represented in the CSV via companies.json cross-reference", () => {
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
});
