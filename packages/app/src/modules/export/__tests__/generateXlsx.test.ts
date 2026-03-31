import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { generateXlsx } from "../generateXlsx";
import { DECLARATION_COLUMNS, INDICATOR_G_COLUMNS } from "../shared/constants";
import type { ExportRow, IndicatorGRow } from "../types";

function makeRow(overrides: Partial<ExportRow> = {}): ExportRow {
	return {
		siren: "123456789",
		companyName: "ACME Corp",
		workforce: 250,
		nafCode: "62.02",
		address: "1 rue de Paris, 75001 Paris",
		hasCse: true,
		year: 2027,
		status: "submitted",
		declarationType: "6_indicateurs",
		compliancePath: null,
		createdAt: "2027-03-15T10:00:00.000Z",
		updatedAt: "2027-03-15T10:00:00.000Z",
		totalWomen: 120,
		totalMen: 130,
		remunerationScore: 5,
		variableRemunerationScore: 3,
		quartileScore: 2,
		categoryScore: null,
		indAAnnualWomen: "35000",
		indAAnnualMen: "38000",
		indAHourlyWomen: null,
		indAHourlyMen: null,
		indBAnnualWomen: null,
		indBAnnualMen: null,
		indBHourlyWomen: null,
		indBHourlyMen: null,
		indCAnnualWomen: null,
		indCAnnualMen: null,
		indCHourlyWomen: null,
		indCHourlyMen: null,
		indDAnnualWomen: null,
		indDAnnualMen: null,
		indDHourlyWomen: null,
		indDHourlyMen: null,
		indEWomen: null,
		indEMen: null,
		indFAnnualQ1Women: null,
		indFAnnualQ1Men: null,
		indFAnnualQ1Threshold: null,
		indFAnnualQ2Women: null,
		indFAnnualQ2Men: null,
		indFAnnualQ2Threshold: null,
		indFAnnualQ3Women: null,
		indFAnnualQ3Men: null,
		indFAnnualQ3Threshold: null,
		indFAnnualQ4Women: null,
		indFAnnualQ4Men: null,
		indFAnnualQ4Threshold: null,
		indFHourlyQ1Women: null,
		indFHourlyQ1Men: null,
		indFHourlyQ1Threshold: null,
		indFHourlyQ2Women: null,
		indFHourlyQ2Men: null,
		indFHourlyQ2Threshold: null,
		indFHourlyQ3Women: null,
		indFHourlyQ3Men: null,
		indFHourlyQ3Threshold: null,
		indFHourlyQ4Women: null,
		indFHourlyQ4Men: null,
		indFHourlyQ4Threshold: null,
		secondDeclarationStatus: null,
		secondDeclReferencePeriodStart: null,
		secondDeclReferencePeriodEnd: null,
		declarantFirstName: "Jean",
		declarantLastName: "Dupont",
		declarantEmail: "jean.dupont@acme.fr",
		declarantPhone: "0612345678",
		cseOpinion1Type: null,
		cseOpinion1Opinion: null,
		cseOpinion1Date: null,
		cseOpinion2Type: null,
		cseOpinion2Opinion: null,
		cseOpinion2Date: null,
		cseOpinion3Type: null,
		cseOpinion3Opinion: null,
		cseOpinion3Date: null,
		cseOpinion4Type: null,
		cseOpinion4Opinion: null,
		cseOpinion4Date: null,
		...overrides,
	};
}

function makeIndicatorGRow(
	overrides: Partial<IndicatorGRow> = {},
): IndicatorGRow {
	return {
		siren: "123456789",
		companyName: "ACME Corp",
		year: 2027,
		declarationType: "initial",
		categoryIndex: 0,
		categoryName: "Ouvriers",
		categoryDetail: "Production",
		categorySource: "predefined",
		womenCount: 40,
		menCount: 45,
		annualBaseWomen: "24000",
		annualBaseMen: "25500",
		annualVariableWomen: "1200",
		annualVariableMen: "1500",
		hourlyBaseWomen: "12.50",
		hourlyBaseMen: "13.20",
		hourlyVariableWomen: "0.62",
		hourlyVariableMen: "0.78",
		...overrides,
	};
}

describe("generateXlsx", () => {
	it("should generate a valid XLSX buffer with two sheets", async () => {
		const buffer = await generateXlsx([makeRow()], [makeIndicatorGRow()]);

		expect(buffer).toBeInstanceOf(Buffer);
		expect(buffer.length).toBeGreaterThan(0);

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer as never);

		expect(workbook.worksheets).toHaveLength(2);
		expect(workbook.worksheets[0]?.name).toBe("Déclarations");
		expect(workbook.worksheets[1]?.name).toBe("Indicateur G");
	});

	it("should have correct headers in Déclarations sheet", async () => {
		const buffer = await generateXlsx([makeRow()], []);

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer as never);

		const sheet = workbook.getWorksheet("Déclarations");
		const headerRow = sheet?.getRow(1);
		const headers = headerRow?.values as string[];

		for (const col of DECLARATION_COLUMNS) {
			expect(headers).toContain(col.header);
		}
	});

	it("should have correct headers in Indicateur G sheet", async () => {
		const buffer = await generateXlsx([], [makeIndicatorGRow()]);

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer as never);

		const sheet = workbook.getWorksheet("Indicateur G");
		const headerRow = sheet?.getRow(1);
		const headers = headerRow?.values as string[];

		for (const col of INDICATOR_G_COLUMNS) {
			expect(headers).toContain(col.header);
		}
	});

	it("should include data rows", async () => {
		const buffer = await generateXlsx(
			[makeRow(), makeRow({ siren: "987654321" })],
			[makeIndicatorGRow()],
		);

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer as never);

		const declSheet = workbook.getWorksheet("Déclarations");
		// 1 header + 2 data rows
		expect(declSheet?.rowCount).toBe(3);

		const gSheet = workbook.getWorksheet("Indicateur G");
		// 1 header + 1 data row
		expect(gSheet?.rowCount).toBe(2);
	});

	it("should handle empty data", async () => {
		const buffer = await generateXlsx([], []);

		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(buffer as never);

		const declSheet = workbook.getWorksheet("Déclarations");
		expect(declSheet?.rowCount).toBe(1); // header only
	});
});
