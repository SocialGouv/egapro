import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const RELEASE_GATE_SENTINEL = "RELEASE_GATE_SENTINEL";

const mocks = vi.hoisted(() => ({
	dbSelect: vi.fn(),
	dbSelectDistinct: vi.fn(),
	logAction: vi.fn(),
	releasedRepresentationCampaignJoin: vi.fn(() => "RELEASE_GATE_SENTINEL"),
	innerJoinCalls: [] as unknown[][],
	queryWhere: vi.fn(),
	getValkey: vi.fn(),
}));

vi.mock("~/server/services/valkey", async () =>
	(await import("~/test/fakeValkey")).mockValkeyModule(mocks.getValkey),
);

vi.mock("~/server/db", () => ({
	db: { select: mocks.dbSelect, selectDistinct: mocks.dbSelectDistinct },
}));

vi.mock("~/server/db/publicReleaseConditions", () => ({
	releasedRepresentationCampaignJoin: mocks.releasedRepresentationCampaignJoin,
	representationCampaignYearExpression: vi.fn(() => "CAMPAIGN_YEAR_EXPRESSION"),
	publiclyReleasedCampaignCondition: vi.fn(() => "RELEASE_GATE_SENTINEL"),
}));

vi.mock("~/server/db/schema", () => ({
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
	companies: {
		siren: "companies.siren",
		name: "companies.name",
		address: "companies.address",
		city: "companies.city",
		regionCode: "companies.regionCode",
		region: "companies.region",
		departmentCode: "companies.departmentCode",
		departmentLabel: "companies.departmentLabel",
		countryCode: "companies.countryCode",
		countryLabel: "companies.countryLabel",
		nafCode: "companies.nafCode",
		nafLabel: "companies.nafLabel",
		statutDiffusion: "companies.statutDiffusion",
	},
	campaignDeadlines: { year: "cd.year", publicDataReleaseDate: "cd.release" },
	gipMdsData: { siren: "gip.siren", year: "gip.year", workforceEma: "gip.ema" },
	declarations: { year: "d.year", siren: "d.siren", status: "d.status" },
}));

vi.mock("drizzle-orm", () => ({
	and: (...args: unknown[]) => ({ and: args }),
	eq: (a: unknown, b: unknown) => ({ eq: [a, b] }),
	isNotNull: (a: unknown) => ({ isNotNull: a }),
	isNull: (a: unknown) => ({ isNull: a }),
	inArray: (a: unknown, b: unknown) => ({ inArray: [a, b] }),
	desc: (a: unknown) => ({ desc: a }),
	or: (...args: unknown[]) => ({ or: args }),
	sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
		sql: strings.join(""),
		values,
	}),
	ilike: (a: unknown, b: unknown) => ({ ilike: [a, b] }),
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

function setReferenceYears(years: number[]) {
	const chain = {
		from: () => chain,
		innerJoin: () => chain,
		where: () => chain,
		orderBy: () => chain,
		limit: () => Promise.resolve(years.map((year) => ({ year }))),
	};
	mocks.dbSelectDistinct.mockReturnValue(chain);
}

function setRows(rows: unknown[]) {
	mocks.innerJoinCalls.length = 0;
	const ordered = Object.assign(Promise.resolve(rows), {
		limit: () => Promise.resolve(rows),
	});
	const chain = {
		from: () => chain,
		$dynamic: () => chain,
		innerJoin: (...args: unknown[]) => {
			mocks.innerJoinCalls.push(args);
			return chain;
		},
		leftJoin: () => chain,
		where: (condition: unknown) => {
			mocks.queryWhere(condition);
			return chain;
		},
		orderBy: () => ordered,
	};
	mocks.dbSelect.mockReturnValue(chain);
}

function buildRow(overrides: Record<string, unknown> = {}) {
	return {
		year: 2026,
		campaignYear: 2027,
		siren: "123456789",
		name: "Société Démo",
		address: "1 rue de la Paix, 75002 Paris",
		region: "Île-de-France",
		departmentCode: "75",
		departmentLabel: "Paris",
		countryCode: null,
		countryLabel: "FRANCE",
		nafCode: "6202A",
		nafLabel: "Conseil informatique",
		statutDiffusion: "O",
		workforceEma: "250",
		referencePeriodStart: "2025-01-01",
		referencePeriodEnd: "2025-12-31",
		executiveWomenPercent: "35.50",
		executiveMenPercent: "64.50",
		notComputableReasonExecutives: null,
		memberWomenPercent: "42.00",
		memberMenPercent: "58.00",
		notComputableReasonMembers: null,
		publishDate: "2027-02-15",
		publishUrl: "https://exemple.fr/egalite-professionnelle",
		publishModalities: null,
		...overrides,
	};
}

async function callGet(search = "") {
	const { GET } = await import("../route");
	return GET(
		new Request(`http://localhost/api/public/representations/export${search}`),
	);
}

function csvCells(csv: string) {
	const [header, line = ""] = csv.split("\n");
	return {
		header: header?.split(";") ?? [],
		line: line.split(";"),
	};
}

describe("GET /api/public/representations/export", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		mocks.getValkey.mockResolvedValue(null);
	});

	it("returns a CSV by default with the 15 DGT headers in order", async () => {
		setReferenceYears([2026]);
		setRows([buildRow()]);

		const response = await callGet();

		expect(response.headers.get("Content-Type")).toContain("text/csv");
		expect(response.headers.get("Content-Disposition")).toBe(
			'attachment; filename="indicateurs-representation.csv"',
		);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(csvCells(await response.text()).header).toEqual([
			'"Annee_declaration"',
			'"SIREN"',
			'"Raison_sociale"',
			'"Adresse"',
			'"Region"',
			'"Code_departement"',
			'"Departement"',
			'"Pays"',
			'"Code_NAF"',
			'"Libelle_NAF"',
			'"Effectif_annuel_moyen"',
			'"Cadres_pourcentage_F"',
			'"Cadres_pourcentage_H"',
			'"Membres_pourcentage_F"',
			'"Membres_pourcentage_H"',
		]);
	});

	it("publishes the campaign year and the reference-year workforce", async () => {
		setReferenceYears([2026]);
		setRows([buildRow()]);

		const response = await callGet("?format=csv");
		const { line } = csvCells(await response.text());

		expect(line[0]).toBe('"2027"');
		expect(line[10]).toBe('"250"');
		expect(line[11]).toBe('"35.5"');
	});

	it("uses the campaign year in the filename when year is given", async () => {
		setRows([buildRow()]);

		const response = await callGet("?year=2027");

		expect(response.headers.get("Content-Disposition")).toBe(
			'attachment; filename="Indicateurs_representation_2027.csv"',
		);
		expect(mocks.dbSelectDistinct).not.toHaveBeenCalled();
	});

	it("masks identity, address, country and activity but keeps SIREN and percentages", async () => {
		setReferenceYears([2026]);
		setRows([
			buildRow({
				siren: "987654321",
				statutDiffusion: "N",
				countryCode: "99100",
				countryLabel: "ALLEMAGNE",
			}),
		]);

		const response = await callGet("?format=csv");
		const { header, line } = csvCells(await response.text());
		const cell = (name: string) => line[header.indexOf(`"${name}"`)];

		expect(cell("SIREN")).toBe('"987654321"');
		expect(cell("Raison_sociale")).toBe('"Non-diffusible"');
		expect(cell("Adresse")).toBe('"Non-diffusible"');
		expect(cell("Pays")).toBe('"Non-diffusible"');
		expect(cell("Cadres_pourcentage_F")).toBe('"35.5"');
		expect(cell("Membres_pourcentage_H")).toBe('"58"');
	});

	it("leaves an unknown country and an absent workforce empty, not Non-diffusible", async () => {
		setReferenceYears([2026]);
		setRows([
			buildRow({ countryCode: null, countryLabel: null, workforceEma: null }),
		]);

		const response = await callGet("?format=csv");
		const { header, line } = csvCells(await response.text());

		expect(line[header.indexOf('"Pays"')]).toBe('""');
		expect(line[header.indexOf('"Effectif_annuel_moyen"')]).toBe('""');
	});

	it("omits publication columns and non-computability reasons", async () => {
		setReferenceYears([2026]);
		setRows([buildRow()]);

		const response = await callGet("?format=csv");
		const { header } = csvCells(await response.text());

		expect(header.join(";")).not.toMatch(
			/Date_publication|Url_publication|Modalites_publication|motif/i,
		);
	});

	it("gates on the released campaign and on submitted declarations", async () => {
		setReferenceYears([2026]);
		setRows([buildRow()]);

		await callGet("?format=csv");

		expect(
			mocks.innerJoinCalls.some((args) =>
				JSON.stringify(args).includes(RELEASE_GATE_SENTINEL),
			),
		).toBe(true);
		expect(JSON.stringify(mocks.queryWhere.mock.calls)).toContain("submitted");
	});

	it("returns an Excel workbook with the same row keys when format=xlsx", async () => {
		setRows([buildRow()]);

		const response = await callGet("?format=xlsx&year=2027");

		expect(response.headers.get("Content-Disposition")).toBe(
			'attachment; filename="index-egapro-representations-equilibrees.xlsx"',
		);
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(await response.arrayBuffer());
		const sheet = workbook.getWorksheet("Représentation équilibrée");
		expect(sheet?.getRow(1).getCell(1).value).toBe("campaignYear");
		expect(sheet?.getRow(2).getCell(2).value).toBe("123456789");
	});

	it("rejects any other format with a CORS-readable 400", async () => {
		const response = await callGet("?format=json");

		expect(response.status).toBe(400);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
		expect(await response.json()).toEqual({
			error: "Le paramètre format doit être 'csv' ou 'xlsx'",
		});
	});

	it("answers OPTIONS with the public export headers", async () => {
		const { OPTIONS } = await import("../route");
		const response = OPTIONS();

		expect(response.status).toBe(204);
		expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
	});

	it("audits the format and the campaign year", async () => {
		setRows([buildRow()]);

		await callGet("?format=csv&year=2027");

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "public_representations.export",
				status: "success",
				metadata: { format: "csv", year: 2027 },
			}),
		);
	});

	it("audits an invalid format by name only", async () => {
		await callGet("?format=json&year=2027");

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "public_representations.export",
				status: "failure",
				metadata: { invalidParam: "format" },
			}),
		);
	});
});
