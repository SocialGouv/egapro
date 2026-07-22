import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { generateTemplate, parseImportFile } from "../categoryFileHandler";

const TEMPLATE_HEADERS = [
	"Nom de la catégorie",
	"Effectif femmes",
	"Effectif hommes",
	"Annuel base femmes (€)",
	"Annuel base hommes (€)",
	"Annuel variable femmes (€)",
	"Annuel variable hommes (€)",
	"Horaire base femmes (€)",
	"Horaire base hommes (€)",
	"Horaire variable femmes (€)",
	"Horaire variable hommes (€)",
];
const HEADER_LINE = TEMPLATE_HEADERS.join(";");

async function xlsxFile(
	dataRows: Array<Array<string | number>>,
): Promise<File> {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet("Indicateur G");
	sheet.addRow(TEMPLATE_HEADERS);
	for (const row of dataRows) {
		sheet.addRow(row);
	}
	const buffer = await workbook.xlsx.writeBuffer();
	return new File([buffer], "test.xlsx", {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
}

function csvFile(content: string, name = "test.csv"): File {
	return new File([content], name, { type: "text/csv" });
}

describe("generateTemplate", () => {
	it("returns a synchronous CSV blob holding only the 11 header labels and no data row", async () => {
		const blob = generateTemplate();

		expect(blob).toBeInstanceOf(Blob);
		expect(blob.type).toBe("text/csv;charset=utf-8");

		// Blob.text() UTF-8-decodes the bytes, stripping the leading BOM.
		const lines = (await blob.text()).split("\n");
		expect(lines).toHaveLength(1);
		expect(lines[0]).toBe(HEADER_LINE);
	});

	it("prefixes the raw CSV bytes with a UTF-8 BOM", async () => {
		const bytes = new Uint8Array(await generateTemplate().arrayBuffer());

		expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
	});
});

describe("parseImportFile — XLSX", () => {
	it("parses categories from an XLSX file", async () => {
		const file = await xlsxFile([
			["Ouvriers", "50", "60", "30000", "31000", "", "", "", "", "", ""],
			["Cadres", "20", "25", "", "", "", "", "", "", "", ""],
		]);
		const result = await parseImportFile(file);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(2);
		expect(result.categories[0]?.name).toBe("Ouvriers");
		expect(result.categories[0]?.womenCount).toBe("50");
		expect(result.categories[0]?.annualBaseWomen).toBe("30000");
		expect(result.categories[1]?.name).toBe("Cadres");
		expect(result.categories[1]?.womenCount).toBe("20");
	});

	it("returns empty-file error for an XLSX with only the header row", async () => {
		const result = await parseImportFile(await xlsxFile([]));

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.type).toBe("empty-file");
	});

	it("returns empty-file error when every XLSX data row has an empty name", async () => {
		const result = await parseImportFile(
			await xlsxFile([["", "5", "8", "", "", "", "", "", "", "", ""]]),
		);

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.type).toBe("empty-file");
	});

	it("reads a formula cell through its cached computed result", async () => {
		const workbook = new ExcelJS.Workbook();
		const sheet = workbook.addWorksheet("Indicateur G");
		sheet.addRow(TEMPLATE_HEADERS);
		const row = sheet.addRow([
			"Ouvriers",
			"",
			"60",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
		]);
		row.getCell(2).value = { formula: "50+5", result: 55 };
		const buffer = await workbook.xlsx.writeBuffer();
		const file = new File([buffer], "formula.xlsx", {
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		});

		const result = await parseImportFile(file);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories[0]?.womenCount).toBe("55");
	});
});

describe("parseImportFile — CSV", () => {
	it("parses a valid CSV file", async () => {
		const csv = `${HEADER_LINE}\nOuvriers;50;60;30000;31000;;;;;\nCadres;20;25;;;;;;;;;`;
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(2);
		expect(result.categories[0]?.name).toBe("Ouvriers");
		expect(result.categories[0]?.womenCount).toBe("50");
		expect(result.categories[0]?.annualBaseWomen).toBe("30000");
	});

	it("normalizes comma decimals to dots", async () => {
		const csv = `${HEADER_LINE}\nOuvriers;10;12;30 000,50;31000;;;;;`;
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories[0]?.annualBaseWomen).toBe("30000.50");
	});

	it("parses a quoted field that contains the separator and escaped quotes", async () => {
		const csv = `${HEADER_LINE}\n"Cadres ""séniors""; groupe A";10;12;;;;;;;;`;
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(1);
		expect(result.categories[0]?.name).toBe('Cadres "séniors"; groupe A');
	});

	it("skips rows with empty name", async () => {
		const csv = `${HEADER_LINE}\nOuvriers;10;12;;;;;;\n;5;8;;;;;;`;
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(1);
	});

	it("returns error on missing columns", async () => {
		const csv = "Nom;Effectif\nOuvriers;10";
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.type).toBe("missing-columns");
		expect(result.errors[0]?.message).toContain("Colonnes manquantes");
	});

	it("returns error on empty file", async () => {
		const result = await parseImportFile(csvFile(""));

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.type).toBe("empty-file");
	});

	it("returns empty-file error when every CSV data row has an empty name", async () => {
		const result = await parseImportFile(csvFile(`${HEADER_LINE}\n;5;8;;;;;;`));

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.type).toBe("empty-file");
	});

	it("returns error on unsupported file format", async () => {
		const file = new File(["data"], "test.txt", { type: "text/plain" });
		const result = await parseImportFile(file);

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.message).toContain("Format de fichier");
	});

	it("rejects a file larger than 5 MB before reading it", async () => {
		const big = new File(["x"], "huge.csv", { type: "text/csv" });
		Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });

		const result = await parseImportFile(big);

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.type).toBe("invalid-value");
		expect(result.errors[0]?.message).toContain("trop volumineux");
	});

	it("round-trips: fill the header-only template then parse it", async () => {
		const template = await generateTemplate().text();
		const filled = `${template}\nTechniciens;30;40;;;;;18.50;19;;`;
		const result = await parseImportFile(csvFile(filled));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(1);
		expect(result.categories[0]?.name).toBe("Techniciens");
		expect(result.categories[0]?.hourlyBaseWomen).toBe("18.50");
	});
});
