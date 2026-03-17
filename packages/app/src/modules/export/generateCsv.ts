import { CSV_COLUMNS } from "./shared/constants";
import type { ExportRow } from "./types";

/** UTF-8 BOM for Excel compatibility. */
const UTF8_BOM = "\uFEFF";

/**
 * Generate a CSV string from export rows.
 * Handles proper escaping of values containing commas, quotes, or newlines.
 * Includes UTF-8 BOM for Excel compatibility.
 */
export function generateCsv(rows: ExportRow[]): string {
	const headerLine = CSV_COLUMNS.map((col) => col.header).join(",");
	const dataLines = rows.map((row) =>
		CSV_COLUMNS.map((col) => escapeCsvValue(row[col.key])).join(","),
	);
	return `${UTF8_BOM}${headerLine}\n${dataLines.join("\n")}\n`;
}

function escapeCsvValue(value: unknown): string {
	if (value === null || value === undefined) return "";

	const str = String(value);
	if (
		str.includes(",") ||
		str.includes('"') ||
		str.includes("\n") ||
		str.includes("\r")
	) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}
