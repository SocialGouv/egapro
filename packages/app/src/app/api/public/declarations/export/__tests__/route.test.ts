import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	dbSelect: vi.fn(),
	logAction: vi.fn(),
}));

vi.mock("~/server/db", () => ({
	db: { select: mocks.dbSelect },
}));

vi.mock("~/server/db/schema", () => ({
	declarations: { year: "year", siren: "siren", status: "status" },
	companies: { siren: "companies.siren" },
	campaignDeadlines: { year: "cd.year", publicDataReleaseDate: "cd.release" },
	gipMdsData: { siren: "gip.siren", year: "gip.year" },
}));

vi.mock("drizzle-orm", () => ({
	and: (...args: unknown[]) => ({ and: args }),
	eq: (a: unknown, b: unknown) => ({ eq: [a, b] }),
	isNotNull: (a: unknown) => ({ isNotNull: a }),
	isNull: (a: unknown) => ({ isNull: a }),
	sql: (strings: TemplateStringsArray) => ({ sql: strings.join("") }),
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

function setRows(rows: unknown[]) {
	const chain = {
		from: () => chain,
		innerJoin: () => chain,
		leftJoin: () => chain,
		where: () => chain,
		orderBy: () => Promise.resolve(rows),
	};
	mocks.dbSelect.mockReturnValue(chain);
}

type RowOverrides = Record<string, unknown>;

const NUMERIC_DECLARATION_FIELDS = [
	"globalAnnualMeanGap",
	"globalAnnualMedianGap",
	"globalHourlyMeanGap",
	"globalHourlyMedianGap",
	"variableAnnualMeanGap",
	"variableAnnualMedianGap",
	"variableHourlyMeanGap",
	"variableHourlyMedianGap",
	"variableProportionWomen",
	"variableProportionMen",
	"annualQuartile1ProportionWomen",
	"annualQuartile2ProportionWomen",
	"annualQuartile3ProportionWomen",
	"annualQuartile4ProportionWomen",
	"annualQuartile1ProportionMen",
	"annualQuartile2ProportionMen",
	"annualQuartile3ProportionMen",
	"annualQuartile4ProportionMen",
	"hourlyQuartile1ProportionWomen",
	"hourlyQuartile2ProportionWomen",
	"hourlyQuartile3ProportionWomen",
	"hourlyQuartile4ProportionWomen",
	"hourlyQuartile1ProportionMen",
	"hourlyQuartile2ProportionMen",
	"hourlyQuartile3ProportionMen",
	"hourlyQuartile4ProportionMen",
] as const;

function buildRow(overrides: RowOverrides = {}) {
	const base: Record<string, unknown> = {
		year: 2023,
		totalWomen: 40,
		totalMen: 60,
		siren: "123456789",
		name: "Société Démo",
		address: "1 rue de la Paix, 75002 PARIS",
		region: "Île-de-France",
		departmentCode: "75",
		departmentLabel: "Paris",
		nafCode: "6202A",
		nafLabel: "Conseil informatique",
		statutDiffusion: "O",
		workforceEma: "250",
	};
	for (const field of NUMERIC_DECLARATION_FIELDS) {
		base[field] = "10.5";
	}
	return { ...base, ...overrides };
}

async function callGet(search = "") {
	const { GET } = await import("../route");
	return GET(
		new Request(`http://localhost/api/public/declarations/export${search}`),
	);
}

describe("GET /api/public/declarations/export", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("returns JSON with data and count by default", async () => {
		setRows([buildRow()]);

		const response = await callGet();

		expect(response.headers.get("Content-Type")).toMatch(/application\/json/);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(response.headers.get("Cache-Control")).toContain("max-age=3600");

		const body = await response.json();
		expect(body.count).toBe(1);
		expect(body.data).toHaveLength(1);
		expect(body.data[0]).toMatchObject({
			siren: "123456789",
			name: "Société Démo",
			year: 2023,
			workforceEma: 250,
			globalAnnualMeanGap: 10.5,
		});
	});

	it("returns an empty payload when no declaration matches", async () => {
		setRows([]);

		const response = await callGet();

		const body = await response.json();
		expect(body).toEqual({ data: [], count: 0 });
	});

	it("masks identifying company fields for a non-diffusible company but keeps the SIREN", async () => {
		setRows([
			buildRow({
				siren: "987654321",
				statutDiffusion: "N",
			}),
		]);

		const response = await callGet();
		const body = await response.json();
		const row = body.data[0];

		expect(row.siren).toBe("987654321");
		expect(row.name).toBeNull();
		expect(row.address).toBeNull();
		expect(row.region).toBeNull();
		expect(row.departmentCode).toBeNull();
		expect(row.departmentLabel).toBeNull();
		expect(row.nafCode).toBeNull();
		expect(row.nafLabel).toBeNull();
		// Indicators are always public, even for a non-diffusible company
		expect(row.globalAnnualMeanGap).toBe(10.5);
	});

	it("returns CSV with a header row and one line per declaration when format=csv", async () => {
		setRows([buildRow({ siren: "111222333", name: "Alpha & Co" })]);

		const response = await callGet("?format=csv");

		expect(response.headers.get("Content-Type")).toContain("text/csv");
		expect(response.headers.get("Content-Disposition")).toContain(
			"declarations_export.csv",
		);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");

		const csv = await response.text();
		const lines = csv.split("\n");
		expect(lines[0]).toBe(
			'"year";"siren";"name";"address";"region";"departmentCode";"departmentLabel";"nafCode";"nafLabel";"workforceEma";"totalWomen";"totalMen";"globalAnnualMeanGap";"globalAnnualMedianGap";"globalHourlyMeanGap";"globalHourlyMedianGap";"variableAnnualMeanGap";"variableAnnualMedianGap";"variableHourlyMeanGap";"variableHourlyMedianGap";"variableProportionWomen";"variableProportionMen";"annualQuartile1ProportionWomen";"annualQuartile2ProportionWomen";"annualQuartile3ProportionWomen";"annualQuartile4ProportionWomen";"annualQuartile1ProportionMen";"annualQuartile2ProportionMen";"annualQuartile3ProportionMen";"annualQuartile4ProportionMen";"hourlyQuartile1ProportionWomen";"hourlyQuartile2ProportionWomen";"hourlyQuartile3ProportionWomen";"hourlyQuartile4ProportionWomen";"hourlyQuartile1ProportionMen";"hourlyQuartile2ProportionMen";"hourlyQuartile3ProportionMen";"hourlyQuartile4ProportionMen"',
		);
		expect(lines).toHaveLength(2);
		expect(lines[1]).toContain('"111222333"');
		expect(lines[1]).toContain('"Alpha & Co"');
	});

	it("escapes double quotes in CSV fields and emits empty quotes for null values", async () => {
		setRows([
			buildRow({
				siren: "444555666",
				name: 'Beta "Groupe" SA',
				statutDiffusion: "N",
			}),
		]);

		const response = await callGet("?format=csv");
		const csv = await response.text();
		const line = csv.split("\n")[1] ?? "";

		expect(line).toContain('"444555666"');
		// Non-diffusible → name masked to null → empty quoted field
		expect(line).toContain('""');
		expect(line).not.toContain('Beta "Groupe" SA');
	});

	it("quotes and doubles inner quotes for a diffusible company name in CSV", async () => {
		setRows([buildRow({ siren: "555666777", name: 'Gamma "X" SARL' })]);

		const response = await callGet("?format=csv");
		const csv = await response.text();

		expect(csv.split("\n")[1]).toContain('"Gamma ""X"" SARL"');
	});

	it("audits the export with the format in metadata", async () => {
		setRows([buildRow()]);

		await callGet("?format=csv");

		expect(mocks.logAction).toHaveBeenCalledTimes(1);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "public_declarations.export",
				status: "success",
				metadata: { format: "csv" },
			}),
		);
	});

	it("defaults the audited format to json when the param is absent", async () => {
		setRows([buildRow()]);

		await callGet();

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ metadata: { format: "json" } }),
		);
	});

	it("returns a 500 payload and audits a failure when the query throws", async () => {
		mocks.dbSelect.mockImplementation(() => {
			throw new Error("db down");
		});
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		const response = await callGet();

		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body).toEqual({ error: "Erreur lors de l'export des déclarations" });
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "failure" }),
		);
		consoleSpy.mockRestore();
	});
});
