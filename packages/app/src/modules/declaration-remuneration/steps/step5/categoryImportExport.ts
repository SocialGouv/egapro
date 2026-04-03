import ExcelJS from "exceljs";

import { DEFAULT_CATEGORIES } from "~/modules/declaration-remuneration/types";
import type { EmployeeCategory } from "./categorySerializer";

/** Column definitions for the import/export template. */
const TEMPLATE_COLUMNS = [
	{ key: "name", header: "Nom de la catégorie" },
	{ key: "detail", header: "Détail des emplois" },
	{ key: "womenCount", header: "Effectif femmes" },
	{ key: "menCount", header: "Effectif hommes" },
	{ key: "annualBaseWomen", header: "Annuel base femmes (€)" },
	{ key: "annualBaseMen", header: "Annuel base hommes (€)" },
	{ key: "annualVariableWomen", header: "Annuel variable femmes (€)" },
	{ key: "annualVariableMen", header: "Annuel variable hommes (€)" },
	{ key: "hourlyBaseWomen", header: "Horaire base femmes (€)" },
	{ key: "hourlyBaseMen", header: "Horaire base hommes (€)" },
	{ key: "hourlyVariableWomen", header: "Horaire variable femmes (€)" },
	{ key: "hourlyVariableMen", header: "Horaire variable hommes (€)" },
] as const;

type TemplateKey = (typeof TEMPLATE_COLUMNS)[number]["key"];

const EXPECTED_HEADERS = TEMPLATE_COLUMNS.map((c) => c.header);

const CSV_SEPARATOR = ";";

export type ImportError = {
	type: "missing-columns" | "invalid-value" | "empty-file";
	message: string;
};

export type ImportResult =
	| { ok: true; categories: EmployeeCategory[] }
	| { ok: false; errors: ImportError[] };

/**
 * Generate a template file with current form categories or defaults.
 * Returns a Blob ready for download.
 */
export async function generateTemplate(
	categories: EmployeeCategory[],
	format: "xlsx" | "csv",
): Promise<Blob> {
	const rows = buildTemplateRows(categories);

	if (format === "csv") {
		return generateCsvBlob(rows);
	}
	return generateXlsxBlob(rows);
}

type TemplateRow = Record<TemplateKey, string | number>;

function buildTemplateRows(categories: EmployeeCategory[]): TemplateRow[] {
	const cats =
		categories.length > 0 && categories.some((c) => c.name.trim())
			? categories
			: DEFAULT_CATEGORIES.map((name) => ({ name, detail: "" }));

	return cats.map((cat) => {
		const row: TemplateRow = {
			name: cat.name,
			detail: "detail" in cat ? cat.detail : "",
			womenCount: "",
			menCount: "",
			annualBaseWomen: "",
			annualBaseMen: "",
			annualVariableWomen: "",
			annualVariableMen: "",
			hourlyBaseWomen: "",
			hourlyBaseMen: "",
			hourlyVariableWomen: "",
			hourlyVariableMen: "",
		};

		if ("womenCount" in cat) {
			const full = cat as EmployeeCategory;
			row.womenCount = full.womenCount;
			row.menCount = full.menCount;
			row.annualBaseWomen = full.annualBaseWomen;
			row.annualBaseMen = full.annualBaseMen;
			row.annualVariableWomen = full.annualVariableWomen;
			row.annualVariableMen = full.annualVariableMen;
			row.hourlyBaseWomen = full.hourlyBaseWomen;
			row.hourlyBaseMen = full.hourlyBaseMen;
			row.hourlyVariableWomen = full.hourlyVariableWomen;
			row.hourlyVariableMen = full.hourlyVariableMen;
		}

		return row;
	});
}

async function generateXlsxBlob(rows: TemplateRow[]): Promise<Blob> {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet("Indicateur G");

	sheet.columns = TEMPLATE_COLUMNS.map((col) => ({
		header: col.header,
		key: col.key,
		width: 25,
	}));

	for (const row of rows) {
		sheet.addRow(row);
	}

	const headerRow = sheet.getRow(1);
	headerRow.font = { bold: true };
	headerRow.alignment = { horizontal: "center" };

	const buffer = await workbook.xlsx.writeBuffer();
	return new Blob([buffer], {
		type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	});
}

function generateCsvBlob(rows: TemplateRow[]): Blob {
	const lines: string[] = [];
	lines.push(EXPECTED_HEADERS.join(CSV_SEPARATOR));

	for (const row of rows) {
		const values = TEMPLATE_COLUMNS.map((col) => {
			const val = String(row[col.key] ?? "");
			return val.includes(CSV_SEPARATOR) || val.includes('"')
				? `"${val.replace(/"/g, '""')}"`
				: val;
		});
		lines.push(values.join(CSV_SEPARATOR));
	}

	return new Blob(["\uFEFF" + lines.join("\n")], {
		type: "text/csv;charset=utf-8",
	});
}

/**
 * Parse an imported file (XLSX or CSV) and return categories for the form.
 */
export async function parseImportFile(file: File): Promise<ImportResult> {
	const extension = file.name.split(".").pop()?.toLowerCase();

	if (extension === "csv") {
		return parseCsv(await file.text());
	}

	if (extension === "xlsx") {
		return parseXlsx(await file.arrayBuffer());
	}

	return {
		ok: false,
		errors: [
			{
				type: "invalid-value",
				message:
					"Format de fichier non supporté. Utilisez un fichier .xlsx ou .csv.",
			},
		],
	};
}

async function parseXlsx(buffer: ArrayBuffer): Promise<ImportResult> {
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load(buffer);

	const sheet = workbook.worksheets[0];
	if (!sheet || sheet.rowCount < 2) {
		return {
			ok: false,
			errors: [
				{ type: "empty-file", message: "Le fichier est vide ou invalide." },
			],
		};
	}

	const headerRow = sheet.getRow(1);
	const headers: string[] = [];
	headerRow.eachCell((cell, colNumber) => {
		headers[colNumber - 1] = String(cell.value ?? "").trim();
	});

	const columnMapping = mapColumns(headers);
	if (!columnMapping.ok) return columnMapping.result;

	const categories: EmployeeCategory[] = [];
	let idCounter = 0;

	for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
		const row = sheet.getRow(rowNum);
		const values: string[] = [];
		row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
			values[colNumber - 1] = cellToString(cell.value);
		});

		const name = values[columnMapping.mapping.name] ?? "";
		if (!name.trim()) continue;

		categories.push(
			buildCategoryFromRow(values, columnMapping.mapping, idCounter++),
		);
	}

	if (categories.length === 0) {
		return {
			ok: false,
			errors: [
				{
					type: "empty-file",
					message:
						"Aucune catégorie trouvée dans le fichier. Vérifiez que le nom de la catégorie est renseigné.",
				},
			],
		};
	}

	return { ok: true, categories };
}

function parseCsv(text: string): ImportResult {
	const content = text.replace(/^\uFEFF/, "");
	const lines = content.split(/\r?\n/).filter((line) => line.trim());

	if (lines.length < 2) {
		return {
			ok: false,
			errors: [
				{ type: "empty-file", message: "Le fichier CSV est vide ou invalide." },
			],
		};
	}

	const headerLine = lines[0];
	if (!headerLine) {
		return {
			ok: false,
			errors: [
				{ type: "empty-file", message: "Le fichier CSV est vide ou invalide." },
			],
		};
	}
	const headers = parseCsvLine(headerLine);

	const columnMapping = mapColumns(headers);
	if (!columnMapping.ok) return columnMapping.result;

	const categories: EmployeeCategory[] = [];
	let idCounter = 0;

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (!line) continue;
		const values = parseCsvLine(line);

		const name = values[columnMapping.mapping.name] ?? "";
		if (!name.trim()) continue;

		categories.push(
			buildCategoryFromRow(values, columnMapping.mapping, idCounter++),
		);
	}

	if (categories.length === 0) {
		return {
			ok: false,
			errors: [
				{
					type: "empty-file",
					message:
						"Aucune catégorie trouvée dans le fichier. Vérifiez que le nom de la catégorie est renseigné.",
				},
			],
		};
	}

	return { ok: true, categories };
}

function parseCsvLine(line: string): string[] {
	const values: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (inQuotes) {
			if (char === '"' && line[i + 1] === '"') {
				current += '"';
				i++;
			} else if (char === '"') {
				inQuotes = false;
			} else {
				current += char;
			}
		} else if (char === '"') {
			inQuotes = true;
		} else if (char === CSV_SEPARATOR) {
			values.push(current.trim());
			current = "";
		} else {
			current += char;
		}
	}
	values.push(current.trim());
	return values;
}

type ColumnMapping = Record<TemplateKey, number>;

function mapColumns(headers: string[]):
	| { ok: true; mapping: ColumnMapping }
	| {
			ok: false;
			result: { ok: false; errors: ImportError[] };
	  } {
	const normalized = headers.map((h) => h.toLowerCase().trim());

	const mapping = {} as ColumnMapping;
	const missing: string[] = [];

	for (const col of TEMPLATE_COLUMNS) {
		const idx = normalized.indexOf(col.header.toLowerCase());
		if (idx === -1) {
			missing.push(col.header);
		} else {
			mapping[col.key] = idx;
		}
	}

	if (missing.length > 0) {
		return {
			ok: false,
			result: {
				ok: false,
				errors: [
					{
						type: "missing-columns",
						message: `Colonnes manquantes : ${missing.join(", ")}. Téléchargez le modèle pour obtenir le format attendu.`,
					},
				],
			},
		};
	}

	return { ok: true, mapping };
}

function cellToString(value: unknown): string {
	if (value === null || value === undefined) return "";
	if (typeof value === "object" && "result" in value) {
		return String((value as { result: unknown }).result ?? "");
	}
	return String(value);
}

function normalizeDecimal(value: string): string {
	return value.replace(",", ".").replace(/\s/g, "");
}

function buildCategoryFromRow(
	values: string[],
	mapping: ColumnMapping,
	id: number,
): EmployeeCategory {
	const get = (key: TemplateKey): string => values[mapping[key]] ?? "";

	return {
		id,
		name: get("name").trim(),
		detail: get("detail").trim(),
		womenCount: normalizeDecimal(get("womenCount")),
		menCount: normalizeDecimal(get("menCount")),
		annualBaseWomen: normalizeDecimal(get("annualBaseWomen")),
		annualBaseMen: normalizeDecimal(get("annualBaseMen")),
		annualVariableWomen: normalizeDecimal(get("annualVariableWomen")),
		annualVariableMen: normalizeDecimal(get("annualVariableMen")),
		hourlyBaseWomen: normalizeDecimal(get("hourlyBaseWomen")),
		hourlyBaseMen: normalizeDecimal(get("hourlyBaseMen")),
		hourlyVariableWomen: normalizeDecimal(get("hourlyVariableWomen")),
		hourlyVariableMen: normalizeDecimal(get("hourlyVariableMen")),
	};
}
