import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { generateTemplate, parseImportFile } from "../categoryFileHandler";

const TEMPLATE_HEADERS = [
	"Libellé de la catégorie",
	"Annuel effectif femmes",
	"Annuel effectif hommes",
	"Horaire effectif femmes",
	"Horaire effectif hommes",
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
const OLD_TEMPLATE_HEADERS = [
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

async function xlsxFile(
	headers: string[],
	dataRows: Array<Array<string | number>>,
): Promise<File> {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet("Indicateur G");
	sheet.addRow(headers);
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
	it("returns a synchronous CSV blob holding only the 13 header labels, in order, and no data row", async () => {
		const blob = generateTemplate();

		expect(blob).toBeInstanceOf(Blob);
		expect(blob.type).toBe("text/csv;charset=utf-8");

		// Blob.text() UTF-8-decodes the bytes, stripping the leading BOM.
		const lines = (await blob.text()).split("\n");
		expect(lines).toHaveLength(1);
		expect(lines[0]?.split(";")).toEqual(TEMPLATE_HEADERS);
	});

	it("prefixes the raw CSV bytes with a UTF-8 BOM", async () => {
		const bytes = new Uint8Array(await generateTemplate().arrayBuffer());

		expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
	});
});

describe("parseImportFile — XLSX", () => {
	it("parses categories from an XLSX file", async () => {
		const file = await xlsxFile(TEMPLATE_HEADERS, [
			[
				"Ouvriers",
				"50",
				"60",
				"45",
				"55",
				"30000",
				"31000",
				"",
				"",
				"",
				"",
				"",
				"",
			],
			["Cadres", "20", "25", "18", "22", "", "", "", "", "", "", "", ""],
		]);
		const result = await parseImportFile(file);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(2);
		expect(result.categories[0]?.name).toBe("Ouvriers");
		expect(result.categories[0]?.womenCount).toBe("50");
		expect(result.categories[0]?.hourlyWomenCount).toBe("45");
		expect(result.categories[0]?.hourlyMenCount).toBe("55");
		expect(result.categories[0]?.annualBaseWomen).toBe("30000");
		expect(result.categories[1]?.name).toBe("Cadres");
		expect(result.categories[1]?.womenCount).toBe("20");
		expect(result.categories[1]?.hourlyWomenCount).toBe("18");
	});

	it("returns empty-file error for an XLSX with only the header row", async () => {
		const result = await parseImportFile(await xlsxFile(TEMPLATE_HEADERS, []));

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.type).toBe("empty-file");
	});

	it("returns empty-file error when every XLSX data row has an empty name", async () => {
		const result = await parseImportFile(
			await xlsxFile(TEMPLATE_HEADERS, [
				["", "5", "8", "", "", "", "", "", "", "", "", "", ""],
			]),
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

	it("parses the same content identically whether column order matches the template or not", async () => {
		const shuffledHeaders = [
			"Annuel effectif hommes",
			"Libellé de la catégorie",
			"Horaire effectif hommes",
			"Annuel effectif femmes",
			"Horaire effectif femmes",
			"Annuel base hommes (€)",
			"Annuel base femmes (€)",
			"Annuel variable femmes (€)",
			"Annuel variable hommes (€)",
			"Horaire base femmes (€)",
			"Horaire base hommes (€)",
			"Horaire variable femmes (€)",
			"Horaire variable hommes (€)",
		];
		const orderedFile = await xlsxFile(TEMPLATE_HEADERS, [
			[
				"Ouvriers",
				"50",
				"60",
				"45",
				"55",
				"30000",
				"31000",
				"",
				"",
				"",
				"",
				"",
				"",
			],
		]);
		const shuffledFile = await xlsxFile(shuffledHeaders, [
			[
				"60",
				"Ouvriers",
				"55",
				"50",
				"45",
				"31000",
				"30000",
				"",
				"",
				"",
				"",
				"",
				"",
			],
		]);

		const orderedResult = await parseImportFile(orderedFile);
		const shuffledResult = await parseImportFile(shuffledFile);

		expect(orderedResult.ok).toBe(true);
		expect(shuffledResult.ok).toBe(true);
		if (!orderedResult.ok || !shuffledResult.ok) return;

		expect(shuffledResult.categories).toEqual(orderedResult.categories);
	});
});

describe("parseImportFile — CSV", () => {
	it("parses a valid CSV file, restituting annual and hourly headcounts alongside the 8 remuneration columns", async () => {
		const csv = [
			HEADER_LINE,
			[
				"Ouvriers",
				"50",
				"60",
				"45",
				"55",
				"30000",
				"31000",
				"",
				"",
				"",
				"",
				"",
				"",
			].join(";"),
			["Cadres", "20", "25", "18", "22", "", "", "", "", "", "", "", ""].join(
				";",
			),
		].join("\n");
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(2);
		expect(result.categories[0]?.name).toBe("Ouvriers");
		expect(result.categories[0]?.womenCount).toBe("50");
		expect(result.categories[0]?.menCount).toBe("60");
		expect(result.categories[0]?.hourlyWomenCount).toBe("45");
		expect(result.categories[0]?.hourlyMenCount).toBe("55");
		expect(result.categories[0]?.annualBaseWomen).toBe("30000");
	});

	it("normalizes comma decimals to dots", async () => {
		const csv = `${HEADER_LINE}\nOuvriers;10;12;8;9;30 000,50;31000;;;;;;`;
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories[0]?.annualBaseWomen).toBe("30000.50");
	});

	it("parses a quoted field that contains the separator and escaped quotes", async () => {
		const csv = `${HEADER_LINE}\n"Cadres ""séniors""; groupe A";10;12;;;;;;;;;;`;
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(1);
		expect(result.categories[0]?.name).toBe('Cadres "séniors"; groupe A');
	});

	it("skips rows with empty name", async () => {
		const csv = `${HEADER_LINE}\nOuvriers;10;12;;;;;;;;\n;5;8;;;;;;;;`;
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

	it("rejects a file built on the old 11-column format, listing the renamed and new headers as missing", async () => {
		expect(OLD_TEMPLATE_HEADERS).toHaveLength(11);
		const csv = [
			OLD_TEMPLATE_HEADERS.join(";"),
			["Ouvriers", "50", "60", "30000", "31000", "", "", "", "", "", ""].join(
				";",
			),
		].join("\n");
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.type).toBe("missing-columns");
		expect(result.errors[0]?.message).toContain("Libellé de la catégorie");
		expect(result.errors[0]?.message).toContain("Annuel effectif femmes");
		expect(result.errors[0]?.message).toContain("Annuel effectif hommes");
		expect(result.errors[0]?.message).toContain("Horaire effectif femmes");
		expect(result.errors[0]?.message).toContain("Horaire effectif hommes");
	});

	it("returns error on empty file", async () => {
		const result = await parseImportFile(csvFile(""));

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.type).toBe("empty-file");
	});

	it("returns empty-file error when every CSV data row has an empty name", async () => {
		const result = await parseImportFile(
			csvFile(`${HEADER_LINE}\n;5;8;;;;;;;;;;`),
		);

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
		const filled = `${template}\nTechniciens;30;40;28;38;;;;;18.50;19;;`;
		const result = await parseImportFile(csvFile(filled));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(1);
		expect(result.categories[0]?.name).toBe("Techniciens");
		expect(result.categories[0]?.hourlyWomenCount).toBe("28");
		expect(result.categories[0]?.hourlyMenCount).toBe("38");
		expect(result.categories[0]?.hourlyBaseWomen).toBe("18.50");
	});

	it("produces the same result from an equivalent CSV and XLSX file", async () => {
		const dataRow = [
			"Ouvriers",
			"50",
			"60",
			"45",
			"55",
			"30000",
			"31000",
			"",
			"",
			"",
			"",
			"",
			"",
		];
		const csv = `${HEADER_LINE}\n${dataRow.join(";")}`;
		const csvResult = await parseImportFile(csvFile(csv));
		const xlsxResult = await parseImportFile(
			await xlsxFile(TEMPLATE_HEADERS, [dataRow]),
		);

		expect(csvResult.ok).toBe(true);
		expect(xlsxResult.ok).toBe(true);
		if (!csvResult.ok || !xlsxResult.ok) return;

		expect(csvResult.categories).toEqual(xlsxResult.categories);
	});
});
