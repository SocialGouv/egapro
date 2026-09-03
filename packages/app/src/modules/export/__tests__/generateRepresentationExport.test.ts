import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { representationDeclarations } from "~/server/db/schema";
import {
	buildRepresentationExportRows,
	generateRepresentationXlsx,
	type RepresentationExportRow,
} from "../generateRepresentationExport";

const EXPECTED_HEADERS = [
	"Annee_reference",
	"SIREN",
	"Raison_sociale",
	"Region",
	"Code_departement",
	"Departement",
	"Code_NAF",
	"Libelle_NAF",
	"Cadres_dirigeants_F",
	"Cadres_dirigeants_H",
	"Cadres_dirigeants_motif_non_calculabilite",
	"Instances_dirigeantes_F",
	"Instances_dirigeantes_H",
	"Instances_dirigeantes_motif_non_calculabilite",
	"Date_publication",
	"Url_publication",
	"Modalites_publication",
];

type DbRow = Record<string, unknown>;

function makeDbRow(overrides: DbRow = {}): DbRow {
	return {
		year: 2027,
		siren: "123456789",
		name: "Entreprise Diffusible",
		region: "Île-de-France",
		departmentCode: "75",
		departmentLabel: "Paris",
		nafCode: "62.02A",
		nafLabel: "Conseil en systèmes informatiques",
		identityDiffusible: true,
		executiveWomenPercent: "40.00",
		executiveMenPercent: "60.00",
		notComputableReasonExecutives: null,
		memberWomenPercent: "45.50",
		memberMenPercent: "54.50",
		notComputableReasonMembers: null,
		publishDate: "2028-03-01",
		publishUrl: "https://example.fr/representation",
		publishModalities: null,
		...overrides,
	};
}

function makeExportRow(
	overrides: Partial<RepresentationExportRow> = {},
): RepresentationExportRow {
	return {
		referenceYear: 2027,
		siren: "123456789",
		name: "Entreprise Diffusible",
		region: "Île-de-France",
		departmentCode: "75",
		departmentLabel: "Paris",
		nafCode: "62.02A",
		nafLabel: "Conseil en systèmes informatiques",
		executiveWomenPercent: 40,
		executiveMenPercent: 60,
		notComputableReasonExecutives: null,
		memberWomenPercent: 45.5,
		memberMenPercent: 54.5,
		notComputableReasonMembers: null,
		publishDate: "2028-03-01",
		publishUrl: "https://example.fr/representation",
		publishModalities: null,
		...overrides,
	};
}

async function loadSheet(buffer: Buffer) {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(buffer as never);
	return workbook;
}

function readRow(sheet: ExcelJS.Worksheet, rowNumber: number): unknown[] {
	const row = sheet.getRow(rowNumber);
	return EXPECTED_HEADERS.map((_, index) => row.getCell(index + 1).value);
}

describe("buildRepresentationExportRows", () => {
	const mockOrderBy = vi.fn();
	const mockWhere = vi.fn(() => ({ orderBy: mockOrderBy }));
	const mockLeftJoin = vi.fn(() => ({ where: mockWhere }));
	const mockInnerJoin = vi.fn(() => ({ leftJoin: mockLeftJoin }));
	const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));
	const mockSelect = vi.fn((_projection: Record<string, unknown>) => ({
		from: mockFrom,
	}));
	const mockDb = { select: mockSelect };

	beforeEach(() => {
		vi.clearAllMocks();
		mockOrderBy.mockResolvedValue([]);
	});

	it("returns an empty array when no submitted declaration exists", async () => {
		const rows = await buildRepresentationExportRows(mockDb as never);

		expect(rows).toEqual([]);
	});

	it("restricts the query to submitted declarations", async () => {
		await buildRepresentationExportRows(mockDb as never);

		expect(mockWhere).toHaveBeenCalledWith(
			eq(representationDeclarations.status, "submitted"),
		);
	});

	it("applies the observatory facets to filtered downloads", async () => {
		await buildRepresentationExportRows(mockDb as never, {
			region: ["11", "84"],
			workforceRanges: ["1000+"],
			limit: 10,
			offset: 0,
		});

		expect(mockLeftJoin).toHaveBeenCalledTimes(1);
		expect(mockWhere).toHaveBeenCalledTimes(1);
	});

	it("keeps identity and location for a diffusible company", async () => {
		mockOrderBy.mockResolvedValue([makeDbRow()]);

		const rows = await buildRepresentationExportRows(mockDb as never);

		expect(rows).toEqual([
			{
				referenceYear: 2027,
				siren: "123456789",
				name: "Entreprise Diffusible",
				region: "Île-de-France",
				departmentCode: "75",
				departmentLabel: "Paris",
				nafCode: "62.02A",
				nafLabel: "Conseil en systèmes informatiques",
				executiveWomenPercent: 40,
				executiveMenPercent: 60,
				notComputableReasonExecutives: null,
				memberWomenPercent: 45.5,
				memberMenPercent: 54.5,
				notComputableReasonMembers: null,
				publishDate: "2028-03-01",
				publishUrl: "https://example.fr/representation",
				publishModalities: null,
			},
		]);
	});

	it("masks identity and location of a non-diffusible company but keeps its SIREN and indicators", async () => {
		mockOrderBy.mockResolvedValue([
			makeDbRow(),
			makeDbRow({
				siren: "987654321",
				name: "Entreprise Non Diffusible",
				identityDiffusible: false,
				executiveWomenPercent: "30.00",
				executiveMenPercent: "70.00",
			}),
		]);

		const rows = await buildRepresentationExportRows(mockDb as never);

		expect(rows[0]).toMatchObject({
			siren: "123456789",
			name: "Entreprise Diffusible",
			region: "Île-de-France",
		});
		expect(rows[1]).toMatchObject({
			siren: "987654321",
			name: "Non-diffusible",
			region: "Non-diffusible",
			departmentCode: "Non-diffusible",
			departmentLabel: "Non-diffusible",
			nafCode: "Non-diffusible",
			nafLabel: "Non-diffusible",
			executiveWomenPercent: 30,
			executiveMenPercent: 70,
			publishUrl: "https://example.fr/representation",
		});
	});

	it("never exposes an address, neither for a diffusible nor for a non-diffusible company", async () => {
		mockOrderBy.mockResolvedValue([
			makeDbRow(),
			makeDbRow({ siren: "987654321", identityDiffusible: false }),
		]);

		const rows = await buildRepresentationExportRows(mockDb as never);

		const projection = mockSelect.mock.calls[0]?.[0] ?? {};
		expect(Object.keys(projection)).not.toContain("address");
		expect(rows[0]).not.toHaveProperty("address");
		expect(rows[1]).not.toHaveProperty("address");
	});

	it("keeps identity when the database condition marks it diffusible", async () => {
		mockOrderBy.mockResolvedValue([makeDbRow({ identityDiffusible: true })]);

		const rows = await buildRepresentationExportRows(mockDb as never);

		expect(rows[0]).toMatchObject({
			name: "Entreprise Diffusible",
			region: "Île-de-France",
		});
	});

	it("maps a non-computable declaration with null percentages and its reasons", async () => {
		mockOrderBy.mockResolvedValue([
			makeDbRow({
				executiveWomenPercent: null,
				executiveMenPercent: null,
				notComputableReasonExecutives: "aucun_cadre_dirigeant",
				memberWomenPercent: null,
				memberMenPercent: null,
				notComputableReasonMembers: "aucune_instance_dirigeante",
				publishDate: null,
				publishUrl: null,
				publishModalities: "Affichage dans les locaux",
			}),
		]);

		const rows = await buildRepresentationExportRows(mockDb as never);

		expect(rows[0]).toMatchObject({
			executiveWomenPercent: null,
			executiveMenPercent: null,
			notComputableReasonExecutives: "aucun_cadre_dirigeant",
			memberWomenPercent: null,
			memberMenPercent: null,
			notComputableReasonMembers: "aucune_instance_dirigeante",
			publishDate: null,
			publishUrl: null,
			publishModalities: "Affichage dans les locaux",
		});
	});

	it("maps an unparseable percentage to null rather than NaN", async () => {
		mockOrderBy.mockResolvedValue([
			makeDbRow({ executiveWomenPercent: "n/a", memberMenPercent: "" }),
		]);

		const rows = await buildRepresentationExportRows(mockDb as never);

		expect(rows[0]?.executiveWomenPercent).toBeNull();
		// Postgres never returns "", but Number("") is 0 — pin the coercion down.
		expect(rows[0]?.memberMenPercent).toBe(0);
	});
});

describe("generateRepresentationXlsx", () => {
	it("generates a single sheet named after the representation export", async () => {
		const buffer = await generateRepresentationXlsx([makeExportRow()]);

		expect(buffer).toBeInstanceOf(Buffer);
		const workbook = await loadSheet(buffer);

		expect(workbook.worksheets).toHaveLength(1);
		expect(workbook.worksheets[0]?.name).toBe("Représentation équilibrée");
	});

	it("writes the expected column headers in order", async () => {
		const buffer = await generateRepresentationXlsx([makeExportRow()]);
		const workbook = await loadSheet(buffer);

		const headers = workbook.worksheets[0]?.getRow(1).values as string[];

		expect(headers.slice(1)).toEqual(EXPECTED_HEADERS);
	});

	it("writes one data row per declaration with its mapped values", async () => {
		const buffer = await generateRepresentationXlsx([
			makeExportRow(),
			makeExportRow({
				siren: "987654321",
				name: null,
				region: null,
				departmentCode: null,
				departmentLabel: null,
				nafCode: null,
				nafLabel: null,
				executiveWomenPercent: 30,
				executiveMenPercent: 70,
			}),
		]);
		const workbook = await loadSheet(buffer);
		const sheet = workbook.worksheets[0] as ExcelJS.Worksheet;

		expect(sheet.rowCount).toBe(3);
		expect(readRow(sheet, 2)).toEqual([
			2027,
			"123456789",
			"Entreprise Diffusible",
			"Île-de-France",
			"75",
			"Paris",
			"62.02A",
			"Conseil en systèmes informatiques",
			40,
			60,
			null,
			45.5,
			54.5,
			null,
			"2028-03-01",
			"https://example.fr/representation",
			null,
		]);
		expect(readRow(sheet, 3)).toEqual([
			2027,
			"987654321",
			null,
			null,
			null,
			null,
			null,
			null,
			30,
			70,
			null,
			45.5,
			54.5,
			null,
			"2028-03-01",
			"https://example.fr/representation",
			null,
		]);
	});

	it("writes the non-computable reasons when the percentages are absent", async () => {
		const buffer = await generateRepresentationXlsx([
			makeExportRow({
				executiveWomenPercent: null,
				executiveMenPercent: null,
				notComputableReasonExecutives: "aucun_cadre_dirigeant",
				memberWomenPercent: null,
				memberMenPercent: null,
				notComputableReasonMembers: "aucune_instance_dirigeante",
			}),
		]);
		const workbook = await loadSheet(buffer);
		const row = workbook.worksheets[0]?.getRow(2);

		expect(row?.getCell(9).value).toBeNull();
		expect(row?.getCell(11).value).toBe("aucun_cadre_dirigeant");
		expect(row?.getCell(14).value).toBe("aucune_instance_dirigeante");
	});

	it("generates a header-only sheet when there is nothing to export", async () => {
		const buffer = await generateRepresentationXlsx([]);
		const workbook = await loadSheet(buffer);

		expect(workbook.worksheets[0]?.rowCount).toBe(1);
		expect(
			(workbook.worksheets[0]?.getRow(1).values as string[]).slice(1),
		).toEqual(EXPECTED_HEADERS);
	});
});
