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
	companies: {
		siren: "companies.siren",
		regionCode: "companies.regionCode",
		region: "companies.region",
	},
	campaignDeadlines: { year: "cd.year", publicDataReleaseDate: "cd.release" },
	gipMdsData: { siren: "gip.siren", year: "gip.year" },
	// Pulled in at module scope by the ~/modules/public-api barrel.
	representationDeclarations: {
		siren: "rd.siren",
		year: "rd.year",
		status: "rd.status",
		referencePeriodStart: "rd.referencePeriodStart",
		referencePeriodEnd: "rd.referencePeriodEnd",
		executiveWomenPercent: "rd.executiveWomenPercent",
		executiveMenPercent: "rd.executiveMenPercent",
		notComputableReasonExecutives: "rd.notComputableReasonExecutives",
		memberWomenPercent: "rd.memberWomenPercent",
		memberMenPercent: "rd.memberMenPercent",
		notComputableReasonMembers: "rd.notComputableReasonMembers",
		publishDate: "rd.publishDate",
		publishUrl: "rd.publishUrl",
		publishModalities: "rd.publishModalities",
	},
}));

vi.mock("drizzle-orm", () => ({
	and: (...args: unknown[]) => ({ and: args }),
	eq: (a: unknown, b: unknown) => ({ eq: [a, b] }),
	isNotNull: (a: unknown) => ({ isNotNull: a }),
	isNull: (a: unknown) => ({ isNull: a }),
	or: (...args: unknown[]) => ({ or: args }),
	sql: (strings: TemplateStringsArray) => ({ sql: strings.join("") }),
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

function setRows(rows: unknown[]) {
	const ordered = Object.assign(Promise.resolve(rows), {
		limit: () => Promise.resolve(rows),
	});
	const chain = {
		from: () => chain,
		innerJoin: () => chain,
		leftJoin: () => chain,
		where: () => chain,
		orderBy: () => ordered,
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
		expect(row.name).toBe("Non-diffusible");
		expect(row.address).toBe("Non-diffusible");
		expect(row.city).toBe("Non-diffusible");
		expect(row.region).toBe("Non-diffusible");
		expect(row.departmentCode).toBe("Non-diffusible");
		expect(row.departmentLabel).toBe("Non-diffusible");
		expect(row.nafCode).toBe("Non-diffusible");
		// Indicators are always public, even for a non-diffusible company
		expect(row.globalAnnualMeanGap).toBe(10.5);
	});

	it("treats a null statutDiffusion as diffusible and renders a null workforceEma", async () => {
		setRows([
			buildRow({
				siren: "321321321",
				statutDiffusion: null,
				workforceEma: null,
			}),
		]);

		const response = await callGet();
		const body = await response.json();
		const row = body.data[0];

		// Absent statut → diffusible → identifying fields kept
		expect(row.name).toBe("Société Démo");
		expect(row.workforceEma).toBeNull();
	});

	it("emits an empty quoted field for a null workforceEma in CSV", async () => {
		setRows([buildRow({ siren: "321321321", workforceEma: null })]);

		const response = await callGet("?format=csv");
		const csv = await response.text();
		const line = csv.split("\n")[1] ?? "";

		const header = csv.split("\n")[0]?.split(";") ?? [];
		const workforceIndex = header.indexOf('"workforceEma"');
		expect(line.split(";")[workforceIndex]).toBe('""');
	});

	it("exposes no score, /100 index or indicator-G key in the JSON payload (S6)", async () => {
		setRows([buildRow()]);

		const response = await callGet();
		const body = await response.json();
		const keys = Object.keys(body.data[0]).join(" ").toLowerCase();

		expect(keys).not.toMatch(/score|index|note|categoryg|\bindicatorg/);
	});

	it("exposes no score, /100 index or indicator-G column in the CSV header (S6)", async () => {
		setRows([buildRow()]);

		const response = await callGet("?format=csv");
		const header = (await response.text()).split("\n")[0]?.toLowerCase() ?? "";

		expect(header).not.toMatch(/score|index|note|categoryg|indicatorg/);
	});

	it("returns CSV with a header row and one line per declaration when format=csv", async () => {
		setRows([buildRow({ siren: "111222333", name: "Alpha & Co" })]);

		const response = await callGet("?format=csv");

		expect(response.headers.get("Content-Type")).toContain("text/csv");
		expect(response.headers.get("Content-Disposition")).toContain(
			"index-egapro-remunerations.csv",
		);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");

		const csv = await response.text();
		const lines = csv.split("\n");
		expect(lines[0]).toContain('"city";"regionCode";"region"');
		expect(lines[0]).toContain('"countryCode";"countryLabel"');
		expect(lines[0]).toContain('"globalAnnualMeanGap"');
		expect(lines).toHaveLength(2);
		expect(lines[1]).toContain('"111222333"');
		expect(lines[1]).toContain('"Alpha & Co"');
	});

	it("returns an Excel workbook when format=xlsx", async () => {
		setRows([buildRow()]);

		const response = await callGet("?format=xlsx");

		expect(response.headers.get("Content-Type")).toContain(
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		);
		expect(response.headers.get("Content-Disposition")).toContain(
			"index-egapro-remunerations.xlsx",
		);
		expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(100);
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
		// Non-diffusible → name and address are replaced with the public label.
		expect(line).toContain('"Non-diffusible"');
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
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		const body = await response.json();
		expect(body).toEqual({ error: "Erreur lors de l'export des déclarations" });
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "failure" }),
		);
		consoleSpy.mockRestore();
	});

	it("returns a CORS-readable 400 for an unsupported format", async () => {
		const response = await callGet("?format=xml");

		expect(response.status).toBe(400);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});

	it("requires filters when an Excel export would exceed 10,000 rows", async () => {
		setRows(Array.from({ length: 10_001 }, () => buildRow()));

		const response = await callGet("?format=xlsx");

		expect(response.status).toBe(413);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(await response.json()).toEqual(
			expect.objectContaining({ error: expect.stringContaining("10 000") }),
		);
	});
});
