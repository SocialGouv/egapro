import ExcelJS from "exceljs";

import type { EmployeeCategory } from "./categorySerializer";

/** Column definitions for the import/export template. */
const TEMPLATE_COLUMNS = [
	{ key: "name", header: "Nom de la catégorie" },
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

export function generateTemplate(): Blob {
	return new Blob([`\uFEFF${EXPECTED_HEADERS.join(CSV_SEPARATOR)}`], {
		type: "text/csv;charset=utf-8",
	});
}

/**
 * Parse an imported file (XLSX or CSV) and return categories for the form.
 */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function parseImportFile(file: File): Promise<ImportResult> {
	if (file.size > MAX_FILE_SIZE_BYTES) {
		return {
			ok: false,
			errors: [
				{
					type: "invalid-value",
					message:
						"Le fichier est trop volumineux (maximum 5 Mo). Vérifiez que vous utilisez le bon fichier.",
				},
			],
		};
	}

	const extension = file.name.split(".").pop()?.toLowerCase();
	const mime = file.type;

	if (
		extension === "csv" ||
		mime === "text/csv" ||
		mime === "application/csv"
	) {
		return parseCsv(await file.text());
	}

	if (
		extension === "xlsx" ||
		mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	) {
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
	return value.replace(/,/g, ".").replace(/\s/g, "");
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
